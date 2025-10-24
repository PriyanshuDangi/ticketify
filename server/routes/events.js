const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateEventData } = require('../middleware/validation');
const upload = require('../utils/multerConfig');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  updateContractEventId
} = require('../controllers/eventController');

/**
 * POST /api/events
 * Create new event
 * Authentication required
 * Accepts multipart/form-data with optional image
 */
router.post(
  '/',
  authenticate,
  upload.single('image'),
  validateEventData,
  createEvent
);

/**
 * GET /api/events
 * Get all active events with pagination and filtering
 * Authentication optional
 */
router.get(
  '/',
  optionalAuth,
  getEvents
);

/**
 * GET /api/events/my-events
 * Get authenticated user's created events
 * Authentication required
 */
router.get(
  '/my-events',
  authenticate,
  getMyEvents
);

/**
 * PATCH /api/events/:id/contract-id
 * Update contract event ID after blockchain creation
 * Authentication required, must be event owner
 */
router.patch(
  '/:id/contract-id',
  authenticate,
  updateContractEventId
);

/**
 * GET /api/events/:id
 * Get single event by ID
 * Authentication optional (Meet link only shown to organizer/ticket holders)
 */
router.get(
  '/:id',
  optionalAuth,
  getEventById
);

/**
 * PUT /api/events/:id
 * Update event
 * Authentication required, must be event owner
 * Accepts multipart/form-data with optional image
 */
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  updateEvent
);

/**
 * DELETE /api/events/:id
 * Delete event (only if no tickets sold)
 * Authentication required, must be event owner
 */
router.delete(
  '/:id',
  authenticate,
  deleteEvent
);

module.exports = router;

