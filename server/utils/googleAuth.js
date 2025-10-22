const { google } = require('googleapis');

/**
 * Create OAuth2 client
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate Google OAuth authorization URL
 * @returns {String} Authorization URL
 */
const getAuthUrl = () => {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // Request refresh token
    scope: scopes,
    prompt: 'consent'  // Force consent screen to get refresh token
  });
};

/**
 * Exchange authorization code for tokens
 * @param {String} code - Authorization code from OAuth callback
 * @returns {Object} Tokens object with access_token, refresh_token, etc.
 */
const getTokensFromCode = async (code) => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens from code:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
};

/**
 * Refresh access token using refresh token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New tokens object
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};

/**
 * Create authenticated OAuth2 client for a user
 * @param {Object} user - User document with googleCalendar tokens
 * @returns {Object} Authenticated OAuth2 client
 */
const getAuthenticatedClient = async (user) => {
  const oauth2Client = createOAuth2Client();

  // Check if user has Google Calendar connected
  if (!user.isGoogleCalendarAdded || !user.googleCalendar.access_token) {
    throw new Error('Google Calendar not connected');
  }

  // Set credentials
  oauth2Client.setCredentials({
    access_token: user.googleCalendar.access_token,
    refresh_token: user.googleCalendar.refresh_token,
    scope: user.googleCalendar.scope,
    token_type: user.googleCalendar.token_type,
    expiry_date: user.googleCalendar.expiry_date ? 
      new Date(user.googleCalendar.expiry_date).getTime() : null
  });

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiryDate = user.googleCalendar.expiry_date ? 
    new Date(user.googleCalendar.expiry_date).getTime() : 0;
  const fiveMinutes = 5 * 60 * 1000;

  if (expiryDate - now < fiveMinutes) {
    console.log('Access token expired or expiring soon, refreshing...');
    
    try {
      // Refresh the token
      const newTokens = await refreshAccessToken(user.googleCalendar.refresh_token);
      
      // Update user's tokens in database
      user.googleCalendar.access_token = newTokens.access_token;
      user.googleCalendar.expiry_date = new Date(newTokens.expiry_date);
      
      // Update refresh token if a new one was provided
      if (newTokens.refresh_token) {
        user.googleCalendar.refresh_token = newTokens.refresh_token;
      }
      
      await user.save();
      
      // Update client credentials
      oauth2Client.setCredentials(newTokens);
      
      console.log('Access token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Failed to refresh Google Calendar access token');
    }
  }

  return oauth2Client;
};

/**
 * Revoke Google OAuth tokens
 * @param {String} accessToken - Access token to revoke
 */
const revokeToken = async (accessToken) => {
  try {
    const oauth2Client = createOAuth2Client();
    await oauth2Client.revokeToken(accessToken);
    console.log('Token revoked successfully');
  } catch (error) {
    console.error('Error revoking token:', error);
    throw new Error('Failed to revoke token');
  }
};

module.exports = {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  refreshAccessToken,
  getAuthenticatedClient,
  revokeToken
};

