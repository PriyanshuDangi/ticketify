const { createMeet } = require('../calendar/gCalendar');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../utils/googleCalendar');

/**
 * Create new event
 * POST /api/events
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, dateTime, duration, price, maxAttendees } = req.body;
    const userId = req.userId;

    // Check if user has Google Calendar connected
    if (!req.user.isGoogleCalendarAdded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'GOOGLE_CALENDAR_ERROR',
          message: 'Please connect Google Calendar before creating an event'
        }
      });
    }

    // Handle image upload (base64 from multer)
    let imageUrl = null;
    if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Create Google Calendar event with Meet link
    let calendarData;
    try {
      calendarData = await createMeet({
        title,
        description,
        dateTime,
        duration,
        price,
        maxAttendees  
      }, req.user);
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'GOOGLE_CALENDAR_ERROR',
          message: 'Failed to create Google Calendar event'
        }
      });
    }

    // Create event in database (contractEventId starts as null/draft)
    const event = await Event.create({
      owner: userId,
      title,
      description,
      imageUrl,
      dateTime,
      duration,
      price,
      maxAttendees,
      googleCalendarId: calendarData.data.hangoutLink,
      googleMeetLink: calendarData.data.id,
      isActive: true
    });

    // Populate owner details
    await event.populate('owner', 'name walletAddress');

    res.status(201).json({
      success: true,
      data: {
        event
      },
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Failed to create event:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create event'
      }
    });
  }
};

/**
 * Get all events with pagination and filtering
 * GET /api/events
 */
const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      upcoming = 'true',
      search = '',
      minPrice,
      maxPrice,
      sortBy = 'dateTime',
      order = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit) > 100 ? 100 : parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - only show events that are on blockchain
    const query = {
      isActive: true,
      isDeleted: false,
      contractEventId: { $ne: null }  // Only show events with blockchain confirmation
    };

    // Filter upcoming events
    if (upcoming === 'true') {
      query.dateTime = { $gt: new Date() };
    }

    // Search in title and description
    if (search) {
      query.$text = { $search: search };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    // Execute query with pagination
    const events = await Event.find(query)
      .populate('owner', 'name walletAddress')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    // Get tickets sold for each event
    const eventsWithTickets = await Promise.all(
      events.map(async (event) => {
        const ticketsSold = await Ticket.countDocuments({
          event: event._id,
          status: { $in: ['blockchain_added', 'calendar_added'] }
        });

        return {
          ...event,
          ticketsSold,
          spotsRemaining: event.maxAttendees - ticketsSold,
          googleMeetLink: undefined  // Hide Meet link in list view
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithTickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single event by ID
 * GET /api/events/:id
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('owner', 'name walletAddress email')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Get tickets sold count
    const ticketsSold = await Ticket.countDocuments({
      event: event._id,
      status: { $in: ['blockchain_added', 'calendar_added'] }
    });

    // Check if user has purchased ticket (if authenticated)
    let userHasPurchased = false;
    if (req.walletAddress) {
      const ticket = await Ticket.exists({
        event: event._id,
        buyerWalletAddress: req.walletAddress.toLowerCase(),
        status: { $in: ['blockchain_added', 'calendar_added'] }
      });
      userHasPurchased = !!ticket;
    }

    // Only show Meet link to organizer or ticket holders
    const isOrganizer = req.userId && event.owner._id.toString() === req.userId.toString();
    const canSeeMeetLink = isOrganizer || userHasPurchased;

    res.status(200).json({
      success: true,
      data: {
        event: {
          ...event,
          ticketsSold,
          spotsRemaining: event.maxAttendees - ticketsSold,
          userHasPurchased,
          googleMeetLink: canSeeMeetLink ? event.googleMeetLink : undefined
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update event
 * PUT /api/events/:id
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Check if user is the owner
    if (event.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You don\'t have permission to update this event'
        }
      });
    }

    // Check if tickets have been sold
    const canEditPrice = await event.canEditPrice();

    const { title, description, dateTime, duration, price, maxAttendees } = req.body;

    // If tickets sold, only allow title, description, and image updates
    if (!canEditPrice) {
      if (price !== undefined || dateTime !== undefined || duration !== undefined || maxAttendees !== undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_EDIT',
            message: 'Cannot update price, date, duration, or capacity after tickets have been sold'
          }
        });
      }
    }

    // Update allowed fields
    if (title) event.title = title;
    if (description) event.description = description;

    // Handle image upload
    if (req.file) {
      event.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Update these only if no tickets sold
    if (canEditPrice) {
      if (price !== undefined) event.price = price;
      if (dateTime !== undefined) event.dateTime = dateTime;
      if (duration !== undefined) event.duration = duration;
      if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    }

    await event.save();

    // Update Google Calendar event
    try {
      await updateCalendarEvent(req.user, event.googleCalendarId, {
        title: event.title,
        description: event.description,
        dateTime: event.dateTime,
        duration: event.duration
      });
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      // Continue even if calendar update fails
    }

    await event.populate('owner', 'name walletAddress');

    res.status(200).json({
      success: true,
      data: {
        event
      },
      message: 'Event updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Check if user is the owner
    if (event.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You don\'t have permission to delete this event'
        }
      });
    }

    // Check if tickets have been sold
    const ticketCount = await Ticket.countDocuments({
      event: event._id,
      status: { $in: ['blockchain_added', 'calendar_added'] }
    });

    if (ticketCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE',
          message: 'Cannot delete event with sold tickets'
        }
      });
    }

    // Delete from Google Calendar
    try {
      await deleteCalendarEvent(req.user, event.googleCalendarId);
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      // Continue even if calendar deletion fails
    }

    // Soft delete
    event.isDeleted = true;
    event.isActive = false;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's created events
 * GET /api/events/my-events
 */
const getMyEvents = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      owner: req.userId,
      isDeleted: false
    };

    // Filter by status
    if (status === 'upcoming') {
      query.dateTime = { $gt: new Date() };
    } else if (status === 'past') {
      query.dateTime = { $lte: new Date() };
    }

    const events = await Event.find(query)
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Event.countDocuments(query);

    // Get tickets sold and revenue for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const ticketsSold = await Ticket.countDocuments({
          event: event._id,
          status: { $in: ['blockchain_added', 'calendar_added'] }
        });

        const revenue = (event.price - (event.price * 0.025)) * ticketsSold;

        return {
          ...event,
          ticketsSold,
          revenue: parseFloat(revenue.toFixed(2))
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithStats,
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
 * Update contract event ID after blockchain creation
 * PATCH /api/events/:id/contract-id
 */
const updateContractEventId = async (req, res, next) => {
  try {
    const { contractEventId } = req.body;
    
    // Validate contractEventId format
    if (!contractEventId || typeof contractEventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid contractEventId is required'
        }
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found'
        }
      });
    }

    // Check if user is the owner
    if (event.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only event owner can update contract ID'
        }
      });
    }

    // Check if contractEventId already set (prevent overwrite)
    if (event.contractEventId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_SET',
          message: 'Contract ID already set for this event'
        }
      });
    }

    // Update contractEventId
    event.contractEventId = contractEventId;
    await event.save();

    await event.populate('owner', 'name walletAddress');

    res.status(200).json({
      success: true,
      data: { event },
      message: 'Contract ID updated successfully'
    });
  } catch (error) {
    // Handle duplicate contractEventId error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_CONTRACT_ID',
          message: 'This contract event ID already exists'
        }
      });
    }
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  updateContractEventId
};

