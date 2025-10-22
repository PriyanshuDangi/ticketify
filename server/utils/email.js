const sgMail = require('@sendgrid/mail');
const ics = require('ics');
const moment = require('moment');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generate calendar invite (.ics file)
 * @param {Object} eventData - Event details
 * @returns {String} ICS file content
 */
const generateCalendarInvite = (eventData) => {
  const { title, description, dateTime, duration, meetLink, organizerName, organizerEmail } = eventData;

  const start = moment(dateTime).utc();
  const startArray = [
    start.year(),
    start.month() + 1,  // ics library uses 1-indexed months
    start.date(),
    start.hour(),
    start.minute()
  ];

  const event = {
    start: startArray,
    duration: { minutes: duration },
    title: title,
    description: `${description}\n\nJoin Google Meet: ${meetLink}`,
    location: meetLink,
    url: meetLink,
    organizer: { name: organizerName, email: organizerEmail },
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    productId: 'ticketify/calendar'
  };

  const { error, value } = ics.createEvent(event);

  if (error) {
    console.error('Error generating calendar invite:', error);
    throw new Error('Failed to generate calendar invite');
  }

  return value;
};

/**
 * Send ticket confirmation email
 * @param {Object} ticketData - Ticket and event details
 */
const sendTicketConfirmation = async (ticketData) => {
  try {
    const {
      buyerEmail,
      buyerName,
      eventTitle,
      eventDescription,
      eventDateTime,
      eventDuration,
      meetLink,
      price,
      organizerName,
      organizerEmail,
      transactionHash
    } = ticketData;

    // Format date and time
    const formattedDateTime = moment(eventDateTime).format('MMMM D, YYYY [at] h:mm A [UTC]');
    const formattedDuration = eventDuration >= 60 
      ? `${Math.floor(eventDuration / 60)} hour${Math.floor(eventDuration / 60) > 1 ? 's' : ''}`
      : `${eventDuration} minutes`;

    // Generate calendar invite
    const calendarInvite = generateCalendarInvite({
      title: eventTitle,
      description: eventDescription,
      dateTime: eventDateTime,
      duration: eventDuration,
      meetLink,
      organizerName,
      organizerEmail
    });

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Confirmation - ${eventTitle}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px; }
    .event-details { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .detail-row { margin: 12px 0; }
    .detail-label { font-weight: 600; color: #555; display: inline-block; min-width: 120px; }
    .detail-value { color: #333; }
    .meet-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; margin: 20px 0; font-weight: 600; text-align: center; }
    .meet-button:hover { opacity: 0.9; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .transaction { font-size: 11px; color: #999; margin-top: 20px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 Ticket Confirmed!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${buyerName || 'there'},</p>
      
      <p>Your ticket purchase has been confirmed! You're all set to attend <strong>${eventTitle}</strong>.</p>
      
      <div class="event-details">
        <h3 style="margin-top: 0; color: #667eea;">Event Details</h3>
        
        <div class="detail-row">
          <span class="detail-label">Event:</span>
          <span class="detail-value">${eventTitle}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${formattedDateTime}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${formattedDuration}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Price Paid:</span>
          <span class="detail-value">${price} PYUSD</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Organizer:</span>
          <span class="detail-value">${organizerName}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${meetLink}" class="meet-button">Join Google Meet</a>
      </div>
      
      <p style="margin-top: 30px;"><strong>What's Next?</strong></p>
      <ul>
        <li>You've been added to the Google Calendar event</li>
        <li>You'll receive a reminder 24 hours before the event</li>
        <li>Click the link above or use the calendar invite to join</li>
        <li>No additional registration required</li>
      </ul>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Note:</strong> The Google Meet link is private and only accessible to ticket holders. 
        Please do not share this link with others.
      </p>
      
      <div class="transaction">
        <strong>Transaction Hash:</strong><br>
        ${transactionHash}
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated email from Ticketify. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} Ticketify. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Ticket Confirmed!

Hi ${buyerName || 'there'},

Your ticket purchase has been confirmed! You're all set to attend ${eventTitle}.

Event Details:
- Event: ${eventTitle}
- Date & Time: ${formattedDateTime}
- Duration: ${formattedDuration}
- Price Paid: ${price} PYUSD
- Organizer: ${organizerName}

Join Google Meet: ${meetLink}

What's Next?
- You've been added to the Google Calendar event
- You'll receive a reminder 24 hours before the event
- Click the link above or use the calendar invite to join
- No additional registration required

Transaction Hash: ${transactionHash}

---
This is an automated email from Ticketify. Please do not reply.
© ${new Date().getFullYear()} Ticketify. All rights reserved.
    `;

    // Send email with calendar attachment
    const msg = {
      to: buyerEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ticketify.xyz',
        name: process.env.SENDGRID_FROM_NAME || 'Ticketify'
      },
      subject: `Ticket Confirmation: ${eventTitle}`,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          content: Buffer.from(calendarInvite).toString('base64'),
          filename: 'event.ics',
          type: 'text/calendar',
          disposition: 'attachment'
        }
      ]
    };

    await sgMail.send(msg);
    console.log(`Ticket confirmation email sent to ${buyerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error('Failed to send ticket confirmation email');
  }
};

/**
 * Send event update notification to all attendees
 * @param {Object} updateData - Update details
 */
const sendEventUpdate = async (updateData) => {
  try {
    const { attendeeEmails, eventTitle, updateMessage, organizerName } = updateData;

    if (!attendeeEmails || attendeeEmails.length === 0) {
      console.log('No attendees to notify');
      return true;
    }

    // HTML template for update
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border: 1px solid #ddd; }
    .header { background-color: #667eea; color: #ffffff; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Event Update: ${eventTitle}</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>The organizer of <strong>${eventTitle}</strong> has sent you an update:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
        ${updateMessage}
      </div>
      <p>Best regards,<br>${organizerName}</p>
    </div>
    <div class="footer">
      <p>This is an automated email from Ticketify.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send to all attendees
    const msg = {
      to: attendeeEmails,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ticketify.xyz',
        name: organizerName || 'Ticketify'
      },
      subject: `Update: ${eventTitle}`,
      html: htmlContent
    };

    await sgMail.sendMultiple(msg);
    console.log(`Event update sent to ${attendeeEmails.length} attendees`);
    return true;
  } catch (error) {
    console.error('Error sending event update:', error);
    throw new Error('Failed to send event update');
  }
};

/**
 * Send event reminder (24 hours before)
 * @param {Object} reminderData - Reminder details
 */
const sendEventReminder = async (reminderData) => {
  try {
    const { attendeeEmail, eventTitle, eventDateTime, meetLink, organizerName } = reminderData;

    const formattedDateTime = moment(eventDateTime).format('MMMM D, YYYY [at] h:mm A [UTC]');
    const timeUntil = moment(eventDateTime).fromNow();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; }
    .header { background-color: #667eea; color: #ffffff; padding: 20px; text-align: center; }
    .button { display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⏰ Event Reminder</h2>
    </div>
    <div style="padding: 20px;">
      <p>Hello,</p>
      <p>This is a reminder that <strong>${eventTitle}</strong> is starting ${timeUntil}.</p>
      <p><strong>Event Time:</strong> ${formattedDateTime}</p>
      <div style="text-align: center;">
        <a href="${meetLink}" class="button">Join Google Meet</a>
      </div>
      <p>See you there!</p>
      <p>Best regards,<br>${organizerName}</p>
    </div>
  </div>
</body>
</html>
    `;

    const msg = {
      to: attendeeEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ticketify.xyz',
        name: 'Ticketify'
      },
      subject: `Reminder: ${eventTitle} starts ${timeUntil}`,
      html: htmlContent
    };

    await sgMail.send(msg);
    console.log(`Event reminder sent to ${attendeeEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending event reminder:', error);
    throw new Error('Failed to send event reminder');
  }
};

module.exports = {
  sendTicketConfirmation,
  sendEventUpdate,
  sendEventReminder,
  generateCalendarInvite
};

