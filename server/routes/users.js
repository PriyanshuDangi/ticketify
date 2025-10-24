const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/userController');
const { connectGoogleCalendar, handleGoogleCallback, isGoogleCalendarConnected } = require('../calendar/gCalendar');

/**
 * POST /api/auth/register
 * Register new user
 * No authentication required
 */
// router.post('/auth/register', register);

/**
 * POST /api/auth/login
 * Login with wallet signature
 * No authentication required
 */
// router.post('/auth/login', login);

/**
 * GET /api/users/me
 * Get current user profile
 * Authentication required
 */
router.get('/me', authenticate, getProfile);

/**
 * PUT /api/users/me
 * Update user profile
 * Authentication required
 */
router.put('/me', authenticate, updateProfile);

/**
 * GET /api/users/connect-google
 * Get Google OAuth authorization URL
 * Authentication required
 */
router.get('/connect-google', authenticate, connectGoogleCalendar);

/**
 * GET /api/users/google-callback
 * Handle Google OAuth callback
 * Authentication required
 */
router.get('/google-callback', authenticate, handleGoogleCallback);

// /**
//  * POST /api/users/disconnect-google
//  * Disconnect Google Calendar
//  * Authentication required
//  */
// router.post('/disconnect-google', authenticate, disconnectGoogle);

// * GET /api/users/is-google-calendar-connected
// * Check Google Calendar
router.get('/is-google-calendar-connected', authenticate, isGoogleCalendarConnected);

module.exports = router;

