const {google} = require('googleapis');
const express = require('express');

const router = new express.Router();

const OAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const connectGoogleCalendar = async (req, res) => {
    try {
        const user = req.user;
        if (user?.isGoogleCalendarAdded == true) {
            //ToDo: put a req to check whether the old credentials are working or not

            return res.status(200).send({
                success: true,
                message: 'Your calendar is already added',
                isAlreadyConnected: true
            });
        }
        const authUrl = OAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
            login_hint: user?.email,
        });
        // Return the auth URL instead of redirecting
        res.status(200).json({
            success: true,
            authUrl: authUrl
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            error: {
                code: 'GOOGLE_CALENDAR_ERROR',
                message: 'Unable to generate Google Calendar authorization URL'
            }
        });
    }
}

const handleGoogleCallback = async (req, res) => {
    try {
        if (!req.query.code) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Authorization code is required'
                }
            });
        }
        
        OAuth2Client.getToken(req.query.code, async (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'GOOGLE_AUTH_ERROR',
                        message: 'Invalid or expired authorization code'
                    }
                });
            }
            
            OAuth2Client.setCredentials(token);
            const {access_token, refresh_token, expiry_date, scope, token_type} = token;
            
            if (!access_token || !refresh_token || !expiry_date) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'GOOGLE_AUTH_ERROR',
                        message: 'Unable to get the tokens. Please try again.'
                    }
                });
            }
            
            req.user.isGoogleCalendarAdded = true;
            req.user.googleCalendar = {
                access_token,
                refresh_token,
                expiry_date,
                scope,
                token_type,
            };
            await req.user.save();

            return res.status(200).json({
                success: true,
                data: {
                    user: {
                        _id: req.user._id,
                        isGoogleCalendarAdded: req.user.isGoogleCalendarAdded
                    }
                },
                message: 'Google Calendar connected successfully'
            });
        });
    } catch (err) {
        console.error('Google callback error:', err);
        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to connect Google Calendar. Please try again.'
            }
        });
    }
}

const isGoogleCalendarConnected = async (req, res) => {
    try {
        const user = req.user;
        if (user.isGoogleCalendarAdded === false) {
            return res.status(200).json({
                success: true,
                data: {
                    isConnected: false
                }
            });
        }
        // ToDo:  Check is tokens revoked
        // const token = req.user.googleCalendar;
        // OAuth2Client.setCredentials(token);
        // const calendar = google.calendar({
        //     version: 'v3',
        //     auth: OAuth2Client,
        // });
        // try {
        //     const event = await calendar.events.list({
        //         calendarId: 'primary',
        //         maxResults: 1,
        //     });
        // } catch (err) {
        //     console.log(err.response?.data);
        //     if (err.response && err.response.data && err.response.data.error === 'invalid_grant') {
        //         user.isGoogleCalendarAdded = false;
        //         await user.save();
        //     }
        //     return res.status(200).json({
        //         success: true,
        //         data: {
        //             isConnected: false
        //         }
        //     });
        // }
        res.status(200).json({
            success: true,
            data: {
                isConnected: true
            }
        });
    } catch (err) {
        console.error(err);
        console.log(err.response?.data);
        res.status(500).json({
            success: false,
            error: {
                code: 'GOOGLE_CALENDAR_ERROR',
                message: 'Unable to check Google Calendar connection'
            }
        });
    }
}

const createMeet = async (eventDetails, user) => {
    const {title, description, dateTime, duration, freeEvent, ticketPrice, monetize, maxUser} = eventDetails;
    const token = user.googleCalendar;
    console.log(token);          
    OAuth2Client.setCredentials(token);
    let eventEndTime = new Date(dateTime);

    // ToDo: Fix this if day change
    eventEndTime.setHours(eventEndTime.getHours() + parseInt(duration / 60));
    eventEndTime.setMinutes(eventEndTime.getMinutes() + (duration % 60));
    var event = {
        summary: title,
        description,
        start: {
            dateTime: new Date(dateTime).toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: eventEndTime.toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        conferenceData: {
            createRequest: {
                requestId: 'zzz',
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: false,
        sendUpdates: 'all',
        attendees: [],
        reminders: {
            useDefault: false,
            overrides: [
                {method: 'email', minutes: 24 * 60},
                {method: 'popup', minutes: 10},
            ],
        },
    };
    const calendar = google.calendar({
        version: 'v3',
        auth: OAuth2Client,
    });
    return await calendar.events.insert(
        {
            auth: OAuth2Client,
            calendarId: 'primary',
            conferenceDataVersion: '1',
            resource: event,
        }
        // ,
        // function (err, event) {
        //     if (err) {
        //         // req.flash('error_msg', 'There was an error contacting the Calendar service');
        //         // res.redirect('/dashboard');
        //         console.log('There was an error contacting the Calendar service: ' + err);
        //         throw new Error();
        //     }
        //     // req.flash('success_msg', 'event added to google calendar successfully');
        //     // res.redirect('/dashboard');
        //     console.log(event);
        //     fs.writeFile('./src/calendar/output.json', JSON.stringify(event), (err) => {
        //         if (err) return console.error(err);
        //         console.log('event stored');
        //     });
        // }
    );
};

//ToDo: function to update the attendees of the event
const addAttendee = async (eventId, user, attendeeEmail) => {
    const token = user.googleCalendar;
    OAuth2Client.setCredentials(token);
    const calendar = google.calendar({
        version: 'v3',
        auth: OAuth2Client,
    });
    let event = await calendar.events.get({calendarId: 'primary', eventId: eventId});

    if (!event.data.attendees) {
        event.data.attendees = [];
    }
    event.data.attendees.push({email: attendeeEmail, responseStatus: 'needsAction'});

    return await calendar.events.patch({
        auth: OAuth2Client,
        calendarId: 'primary',
        eventId: eventId,
        resource: event.data,
        sendUpdates: 'all',
    });
};

const fetchEvent = async (eventId, user) => {
    try {
        const token = user.googleCalendar;
        OAuth2Client.setCredentials(token);
        const calendar = google.calendar({
            version: 'v3',
            auth: OAuth2Client,
        });
        const event = await calendar.events.get({calendarId: 'primary', eventId: eventId});
        return event;
    } catch (err) {
        // console.log(err);
        // console.log(err.response.data)
        if (err.response && err.response.data && err.response.data.error === 'invalid_grant') {
            // this means tokens are revoked
        }
        return null;
    }
};

module.exports = {router, createMeet, addAttendee, fetchEvent, connectGoogleCalendar, isGoogleCalendarConnected, handleGoogleCallback};