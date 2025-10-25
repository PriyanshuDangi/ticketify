const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { addAttendee } = require('../utils/googleCalendar');

/**
 * POST /api/webhooks/envio/ticket-purchased
 * Called by Envio when TicketPurchased event is indexed
 * This is the main handler that updates ticket and adds to calendar
 */
router.post('/envio/ticket-purchased', async (req, res) => {
  try {
    const { 
      eventId, 
      buyer, 
      transactionHash, 
      price, 
      timestamp,
      blockNumber 
    } = req.body;

    console.log(`📞 Webhook: TicketPurchased - Event ${eventId}, Buyer ${buyer}, Tx ${transactionHash}`);

    // Find the event in database
    const event = await Event.findOne({ contractEventId: eventId }).populate('owner');
    
    if (!event) {
      console.error(`Event ${eventId} not found in database`);
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if ticket already processed with this transaction
    const existingTicket = await Ticket.findOne({ 
      transactionHash: transactionHash.toLowerCase() 
    });

    if (existingTicket && existingTicket.status === 'calendar_added') {
      console.log(`Ticket already processed for transaction ${transactionHash}`);
      return res.status(200).json({
        success: true,
        message: 'Ticket already processed'
      });
    }

    // Find ticket in database (status: 'created' or 'blockchain_added')
    const ticket = await Ticket.findOne({
      event: event._id,
      buyerWalletAddress: buyer.toLowerCase(),
      status: { $in: ['created', 'blockchain_added'] }
    }).sort({ createdAt: -1 });

    if (!ticket) {
      console.log(`⚠️ No pending ticket found for buyer ${buyer} on event ${eventId}`);
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Check if transactionHash is empty/null and update it
    if (!ticket.transactionHash) {
      ticket.transactionHash = transactionHash.toLowerCase();
      ticket.status = 'blockchain_added';
      await ticket.save();
      console.log(`✅ Updated ticket ${ticket._id} with transaction hash`);
    }

    // Add to Google Calendar if not already added
    if (ticket.status !== 'calendar_added') {
      try {
        const organizer = event.owner;
        await addAttendee(organizer, event.googleCalendarId, ticket.buyerEmail);
        
        // Update status to calendar_added
        ticket.status = 'calendar_added';
        await ticket.save();
        console.log(`✅ Added ${ticket.buyerEmail} to Google Calendar event ${event.title}`);
      } catch (calendarError) {
        console.error('Failed to add to Google Calendar:', calendarError);
        // Don't fail the webhook - ticket is still valid with blockchain_added status
        return res.status(200).json({
          success: true,
          message: 'Ticket confirmed but calendar addition failed',
          data: { ticket }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ticket processed successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Error processing ticket purchase webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/webhooks/envio/event-created
 * Log only for now
 */
router.post('/envio/event-created', async (req, res) => {
  try {
    const { eventId, organizer, price, maxAttendees, eventTime, transactionHash } = req.body;
    console.log(`📞 Webhook: EventCreated - Event ${eventId}, Organizer ${organizer}, Tx ${transactionHash}`);
    
    res.status(200).json({ success: true, message: 'Event logged' });
  } catch (error) {
    console.error('Error processing event created webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/webhooks/envio/revenue-withdrawn
 * Log only for now
 */
router.post('/envio/revenue-withdrawn', async (req, res) => {
  try {
    const { eventId, organizer, amount, transactionHash } = req.body;
    console.log(`📞 Webhook: RevenueWithdrawn - Event ${eventId}, Amount ${amount}, Tx ${transactionHash}`);
    
    res.status(200).json({ success: true, message: 'Withdrawal logged' });
  } catch (error) {
    console.error('Error processing revenue withdrawn webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/webhooks/envio/platform-fees-withdrawn
 * Log only for now
 */
router.post('/envio/platform-fees-withdrawn', async (req, res) => {
  try {
    const { owner, amount, transactionHash } = req.body;
    console.log(`📞 Webhook: PlatformFeesWithdrawn - Owner ${owner}, Amount ${amount}, Tx ${transactionHash}`);
    
    res.status(200).json({ success: true, message: 'Platform fee withdrawal logged' });
  } catch (error) {
    console.error('Error processing platform fees withdrawn webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

