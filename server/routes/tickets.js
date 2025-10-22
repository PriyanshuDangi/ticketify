const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  purchaseTicket,
  confirmTicket,
  getMyTickets,
  getEventTickets
} = require('../controllers/ticketController');

/**
 * POST /api/tickets/purchase
 * Initiate ticket purchase (creates ticket with 'created' status)
 * Authentication required
 */
router.post(
  '/purchase',
  authenticate,
  purchaseTicket
);

/**
 * POST /api/tickets/confirm
 * Confirm blockchain transaction and add to Google Calendar
 * Authentication required
 */
router.post(
  '/confirm',
  authenticate,
  confirmTicket
);

/**
 * GET /api/tickets/my-tickets
 * Get authenticated user's purchased tickets
 * Authentication required
 */
router.get(
  '/my-tickets',
  authenticate,
  getMyTickets
);

/**
 * GET /api/tickets/event/:eventId
 * Get tickets for specific event (organizer only)
 * Authentication required
 */
router.get(
  '/event/:eventId',
  authenticate,
  getEventTickets
);

module.exports = router;

