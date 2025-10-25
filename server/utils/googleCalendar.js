const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./googleAuth');

/**
 * Create a calendar event with Google Meet link
 * @param {Object} user - User document with Google Calendar tokens
 * @param {Object} eventData - Event details
 * @returns {Object} Calendar event with Meet link
 */
const createCalendarEvent = async (user, eventData) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    const { title, description, dateTime, duration } = eventData;

    // Calculate end time
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC'
      },
      conferenceData: {
        createRequest: {
          requestId: `ticketify-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        },
        // Allow attendees to join directly without asking
        conferenceProperties: {
          allowedConferenceSolutionTypes: ['hangoutsMeet']
        }
      },
      // Set organizer as the only one who needs to admit guests = false
      // This ensures attendees can join directly
      anyoneCanAddSelf: false,
      guestsCanInviteOthers: false,  // Prevent attendees from inviting others
      guestsCanSeeOtherGuests: false,  // Privacy: attendees can't see each other
      guestsCanModify: false  // Attendees can't modify event
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,  // Required for Meet link creation
      sendNotifications: false  // Don't send email for initial creation
    });

    const createdEvent = response.data;

    return {
      calendarId: createdEvent.id,
      meetLink: createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: createdEvent.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create Google Calendar event');
  }
};

/**
 * Add attendee to calendar event
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @param {String} attendeeEmail - Email of attendee to add
 * @returns {Boolean} Success status
 */
const addAttendee = async (user, calendarEventId, attendeeEmail) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get current event
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: calendarEventId
    });

    const currentEvent = event.data;

    // Add new attendee to existing attendees list
    const attendees = currentEvent.attendees || [];
    
    // Check if attendee already exists
    const existingAttendee = attendees.find(
      a => a.email.toLowerCase() === attendeeEmail.toLowerCase()
    );

    if (existingAttendee) {
      console.log('Attendee already exists in calendar event');
      return true;
    }

    attendees.push({
      email: attendeeEmail,
      responseStatus: 'needsAction'
    });

    // Update event with new attendee
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendarEventId,
      resource: {
        attendees: attendees
      },
      conferenceDataVersion: 1,  // Maintain conference data and settings
      sendNotifications: true  // Send email notification to new attendee
    });

    console.log(`Added attendee ${attendeeEmail} to calendar event ${calendarEventId}`);
    return true;
  } catch (error) {
    console.error('Error adding attendee to calendar:', error);
    throw new Error('Failed to add attendee to Google Calendar event');
  }
};

/**
 * Remove attendee from calendar event
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @param {String} attendeeEmail - Email of attendee to remove
 * @returns {Boolean} Success status
 */
const removeAttendee = async (user, calendarEventId, attendeeEmail) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get current event
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: calendarEventId
    });

    const currentEvent = event.data;

    // Remove attendee from list
    const attendees = (currentEvent.attendees || []).filter(
      a => a.email.toLowerCase() !== attendeeEmail.toLowerCase()
    );

    // Update event without the removed attendee
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendarEventId,
      resource: {
        attendees: attendees
      },
      sendNotifications: true  // Notify attendee of removal
    });

    console.log(`Removed attendee ${attendeeEmail} from calendar event ${calendarEventId}`);
    return true;
  } catch (error) {
    console.error('Error removing attendee from calendar:', error);
    throw new Error('Failed to remove attendee from Google Calendar event');
  }
};

/**
 * Get calendar event details
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @returns {Object} Event details
 */
const getCalendarEvent = async (user, calendarEventId) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: calendarEventId
    });

    return response.data;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    throw new Error('Failed to get Google Calendar event');
  }
};

/**
 * Update calendar event details
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated event
 */
const updateCalendarEvent = async (user, calendarEventId, updates) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    const updateData = {};

    if (updates.title) {
      updateData.summary = updates.title;
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    if (updates.dateTime && updates.duration) {
      const startTime = new Date(updates.dateTime);
      const endTime = new Date(startTime.getTime() + updates.duration * 60 * 1000);

      updateData.start = {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC'
      };
      updateData.end = {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC'
      };
    }

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendarEventId,
      resource: updateData,
      sendNotifications: true  // Notify attendees of changes
    });

    console.log(`Updated calendar event ${calendarEventId}`);
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update Google Calendar event');
  }
};

/**
 * Delete calendar event
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @returns {Boolean} Success status
 */
const deleteCalendarEvent = async (user, calendarEventId) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: calendarEventId,
      sendNotifications: true  // Notify attendees of cancellation
    });

    console.log(`Deleted calendar event ${calendarEventId}`);
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete Google Calendar event');
  }
};

/**
 * Get all attendees for a calendar event
 * @param {Object} user - User document with Google Calendar tokens
 * @param {String} calendarEventId - Google Calendar event ID
 * @returns {Array} List of attendees
 */
const getEventAttendees = async (user, calendarEventId) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: calendarEventId
    });

    return response.data.attendees || [];
  } catch (error) {
    console.error('Error getting event attendees:', error);
    throw new Error('Failed to get event attendees');
  }
};

module.exports = {
  createCalendarEvent,
  addAttendee,
  removeAttendee,
  getCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getEventAttendees
};

