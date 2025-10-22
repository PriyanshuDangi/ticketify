const User = require('../models/User');
const { generateToken, verifyWalletSignature } = require('../middleware/auth');
const { getAuthUrl, getTokensFromCode, revokeToken } = require('../utils/googleAuth');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { walletAddress, email, name } = req.body;

    // Validate required fields
    if (!walletAddress || !email || !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Wallet address, email, and name are required'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { walletAddress: walletAddress.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: existingUser.walletAddress === walletAddress.toLowerCase() 
            ? 'Wallet address already registered'
            : 'Email already registered'
        }
      });
    }

    // Create new user
    const user = await User.create({
      walletAddress: walletAddress.toLowerCase(),
      email: email.toLowerCase(),
      name
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          email: user.email,
          name: user.name,
          isGoogleCalendarAdded: user.isGoogleCalendarAdded,
          createdAt: user.createdAt
        }
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with wallet signature
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { walletAddress, signature, message, timestamp } = req.body;

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Wallet address, signature, and message are required'
        }
      });
    }

    // Verify signature
    const isValidSignature = verifyWalletSignature(walletAddress, signature, message);

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid signature'
        }
      });
    }

    // Check if message timestamp is recent (within 5 minutes)
    if (timestamp) {
      const messageAge = Date.now() - parseInt(timestamp);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (messageAge > fiveMinutes) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Signature expired. Please sign again.'
          }
        });
      }
    }

    // Find or create user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      // Auto-register user with minimal info
      // User can update profile later
      user = await User.create({
        walletAddress: walletAddress.toLowerCase(),
        email: `${walletAddress.toLowerCase()}@temp.ticketify.xyz`,  // Temporary email
        name: `User ${walletAddress.substring(0, 6)}`  // Temporary name
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          email: user.email,
          name: user.name,
          isGoogleCalendarAdded: user.isGoogleCalendarAdded
        }
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/users/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('-googleCalendar.access_token -googleCalendar.refresh_token');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/me
 */
const updateProfile = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update fields if provided
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.userId }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Email already in use'
          }
        });
      }

      user.email = email.toLowerCase();
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          email: user.email,
          name: user.name,
          isGoogleCalendarAdded: user.isGoogleCalendarAdded,
          updatedAt: user.updatedAt
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Google OAuth authorization URL
 * GET /api/users/connect-google
 */
const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const authUrl = getAuthUrl();

    res.status(200).json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Google OAuth callback
 * POST /api/users/google-callback
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Authorization code is required'
        }
      });
    }

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await getTokensFromCode(code);
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'GOOGLE_AUTH_ERROR',
          message: 'Invalid or expired authorization code'
        }
      });
    }

    // Update user with Google Calendar tokens
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    user.isGoogleCalendarAdded = true;
    user.googleCalendar = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: new Date(tokens.expiry_date)
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          isGoogleCalendarAdded: user.isGoogleCalendarAdded
        }
      },
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect Google Calendar
 * POST /api/users/disconnect-google
 */
const disconnectGoogle = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('+googleCalendar.access_token +googleCalendar.refresh_token');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.isGoogleCalendarAdded) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Google Calendar not connected'
        }
      });
    }

    // Revoke Google token
    try {
      await revokeToken(user.googleCalendar.access_token);
    } catch (error) {
      console.error('Failed to revoke Google token:', error);
      // Continue even if revocation fails
    }

    // Clear Google Calendar data
    user.isGoogleCalendarAdded = false;
    user.googleCalendar = {
      access_token: undefined,
      refresh_token: undefined,
      scope: undefined,
      token_type: undefined,
      expiry_date: undefined
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          isGoogleCalendarAdded: user.isGoogleCalendarAdded
        }
      },
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getGoogleAuthUrl,
  handleGoogleCallback,
  disconnectGoogle
};

