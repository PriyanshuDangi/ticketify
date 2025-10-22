const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const { addAttendee } = require('../utils/googleCalendar');
const { sendTicketConfirmation } = require('../utils/email');
const { ethers } = require('ethers');

/**
 * Initiate ticket purchase
 * POST /api/tickets/purchase
 */
const purchaseTicket = async (req, res, next) => {
  try {
    const { eventId, buyerEmail } = req.body;
    const buyerWalletAddress = req.walletAddress;

    // Validate required fields
    if (!eventId || !buyerEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Event ID and buyer email are required'
        }
      });
    }

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Check if event is active
    if (!event.isActive || event.isDeleted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_NOT_ACTIVE',
          message: 'Event is not active'
        }
      });
    }

    // Check if event has started
    if (event.hasStarted()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_STARTED',
          message: 'Event has already started'
        }
      });
    }

    // Check if event is sold out
    const ticketsSold = await Ticket.countDocuments({
      event: eventId,
      status: { $in: ['blockchain_added', 'calendar_added'] }
    });

    if (ticketsSold >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_SOLD_OUT',
          message: 'Event is sold out'
        }
      });
    }

    // Check if user already purchased ticket for this event
    const existingTicket = await Ticket.findOne({
      event: eventId,
      buyerWalletAddress: buyerWalletAddress.toLowerCase(),
      status: { $in: ['blockchain_added', 'calendar_added'] }
    });

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PURCHASED',
          message: 'You have already purchased a ticket for this event'
        }
      });
    }

    // Create ticket with 'created' status
    const ticket = await Ticket.create({
      event: eventId,
      buyerWalletAddress: buyerWalletAddress.toLowerCase(),
      buyerEmail: buyerEmail.toLowerCase(),
      status: 'created',
      priceAtPurchase: event.price
    });

    res.status(201).json({
      success: true,
      data: {
        ticket: {
          _id: ticket._id,
          event: eventId,
          buyerWalletAddress: ticket.buyerWalletAddress,
          buyerEmail: ticket.buyerEmail,
          status: ticket.status,
          createdAt: ticket.createdAt
        }
      },
      message: 'Ticket purchase initiated. Please confirm blockchain transaction.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm blockchain transaction and add to calendar
 * POST /api/tickets/confirm
 */
const confirmTicket = async (req, res, next) => {
  try {
    const { ticketId, transactionHash } = req.body;
    const buyerWalletAddress = req.walletAddress;

    // Validate required fields
    if (!ticketId || !transactionHash) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ticket ID and transaction hash are required'
        }
      });
    }

    // Find ticket
    const ticket = await Ticket.findById(ticketId).populate({
      path: 'event',
      populate: { path: 'owner' }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found'
        }
      });
    }

    // Verify ticket belongs to requesting user
    if (ticket.buyerWalletAddress !== buyerWalletAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This ticket does not belong to you'
        }
      });
    }

    // Check if transaction hash already used
    const existingTicket = await Ticket.findOne({
      transactionHash: transactionHash.toLowerCase(),
      _id: { $ne: ticketId }
    });

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_TRANSACTION',
          message: 'Transaction hash already used'
        }
      });
    }

    // TODO: Verify transaction on blockchain
    // For now, we'll trust the transaction hash
    // In production, verify:
    // 1. Transaction is confirmed
    // 2. Correct contract address
    // 3. Correct event ID
    // 4. Correct buyer address
    // 5. Correct payment amount

    // Update ticket status to blockchain_added
    ticket.transactionHash = transactionHash.toLowerCase();
    ticket.status = 'blockchain_added';
    await ticket.save();

    // Add buyer to Google Calendar event
    try {
      const organizer = ticket.event.owner;
      await addAttendee(organizer, ticket.event.googleCalendarId, ticket.buyerEmail);
      
      // Update ticket status to calendar_added
      ticket.status = 'calendar_added';
      await ticket.save();
    } catch (error) {
      console.error('Failed to add attendee to Google Calendar:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'GOOGLE_CALENDAR_ERROR',
          message: 'Failed to add to Google Calendar. Please contact support.'
        }
      });
    }

    // Send confirmation email
    try {
      await sendTicketConfirmation({
        buyerEmail: ticket.buyerEmail,
        buyerName: req.user.name || 'Ticket Holder',
        eventTitle: ticket.event.title,
        eventDescription: ticket.event.description,
        eventDateTime: ticket.event.dateTime,
        eventDuration: ticket.event.duration,
        meetLink: ticket.event.googleMeetLink,
        price: ticket.priceAtPurchase,
        organizerName: ticket.event.owner.name,
        organizerEmail: ticket.event.owner.email,
        transactionHash: ticket.transactionHash
      });
      console.log(`✅ Confirmation email sent to ${ticket.buyerEmail}`);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't fail the request if email fails - ticket is still valid
    }

    // Populate event details for response
    await ticket.populate({
      path: 'event',
      select: 'title dateTime duration googleMeetLink price'
    });

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          _id: ticket._id,
          event: ticket.event,
          buyerWalletAddress: ticket.buyerWalletAddress,
          buyerEmail: ticket.buyerEmail,
          transactionHash: ticket.transactionHash,
          status: ticket.status,
          priceAtPurchase: ticket.priceAtPurchase,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        }
      },
      message: 'Ticket confirmed! You\'ve been added to the Google Calendar event.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's purchased tickets
 * GET /api/tickets/my-tickets
 */
const getMyTickets = async (req, res, next) => {
  try {
    const { status = 'upcoming', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const buyerWalletAddress = req.walletAddress;

    // Build query
    const query = {
      buyerWalletAddress: buyerWalletAddress.toLowerCase(),
      status: { $in: ['blockchain_added', 'calendar_added'] }
    };

    // Get tickets
    const tickets = await Ticket.find(query)
      .populate({
        path: 'event',
        populate: { path: 'owner', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Filter by event status (upcoming/past)
    let filteredTickets = tickets;
    if (status === 'upcoming') {
      filteredTickets = tickets.filter(ticket => 
        ticket.event && new Date(ticket.event.dateTime) > new Date()
      );
    } else if (status === 'past') {
      filteredTickets = tickets.filter(ticket => 
        ticket.event && new Date(ticket.event.dateTime) <= new Date()
      );
    }

    const total = filteredTickets.length;

    res.status(200).json({
      success: true,
      data: {
        tickets: filteredTickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tickets for specific event (organizer only)
 * GET /api/tickets/event/:eventId
 */
const getEventTickets = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Check if user is the event organizer
    if (event.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the event organizer can view tickets'
        }
      });
    }

    // Build query
    const query = { event: eventId };
    if (status) {
      query.status = status;
    }

    // Get tickets
    const tickets = await Ticket.find(query)
      .select('buyerWalletAddress buyerEmail transactionHash status priceAtPurchase createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Ticket.countDocuments(query);

    // Get stats
    const stats = {
      total: await Ticket.countDocuments({ event: eventId }),
      created: await Ticket.countDocuments({ event: eventId, status: 'created' }),
      blockchain_added: await Ticket.countDocuments({ event: eventId, status: 'blockchain_added' }),
      calendar_added: await Ticket.countDocuments({ event: eventId, status: 'calendar_added' })
    };

    res.status(200).json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          dateTime: event.dateTime,
          maxAttendees: event.maxAttendees
        },
        tickets,
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  purchaseTicket,
  confirmTicket,
  getMyTickets,
  getEventTickets
};

