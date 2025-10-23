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

            return res.status(200).send({message: 'Your calendar is already added'});
        }
        const authUrl = OAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
            login_hint: user?.email,
        });
        res.redirect(authUrl);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: 'Unable to add the google calendar'});
    }
}

const handleGoogleCallback = async (req, res) => {
    try {
        if (!req.query.code) {
            throw new Error('Unable to get the query code');
        }
        OAuth2Client.getToken(req.query.code, async (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);

                //ToDo: send error message to frontend

                return res.redirect(process.env.DOMAIN + '/dashboard');
            }
            OAuth2Client.setCredentials(token);
            // console.log(token);
            const {access_token, refresh_token, expiry_date, scope, token_type} = token;
            if (!access_token || !refresh_token || !expiry_date) {
                //ToDo: If refersh token is not recieved then revoke and ask to do the auth again

                throw new Error('Unable to get the tokens');
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

            //ToDo: Send that it is successfully authenticatd

            return res.redirect(process.env.FRONTEND_URL + '/profile');
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({message: 'Unable to connect google calendar'});
    }
}

const isGoogleCalendarConnected = async (req, res) => {
    try {
        const user = req.user;
        if (user.isGoogleCalendarAdded === false) {
            return res.status(200).send({isGoogleCalendarAdded: false});
        }
        // ToDo:  Check is tokens revoked
        const token = req.user.googleCalendar;
        OAuth2Client.setCredentials(token);
        const calendar = google.calendar({
            version: 'v3',
            auth: OAuth2Client,
        });
        try {
            const event = await calendar.events.list({
                calendarId: 'primary',
                maxResults: 1,
            });
        } catch (err) {
            console.log(err.response.data);
            if (err.response && err.response.data && err.response.data.error === 'invalid_grant') {
                user.isGoogleCalendarAdded = false;
                await user.save();
            }
            return res.status(200).send({isGoogleCalendarAdded: false});
        }
        res.status(200).send({isGoogleCalendarAdded: true});
    } catch (err) {
        console.error(err);
        console.log(err.response.data);
        res.status(500).send({message: 'Unable to check its connected or not'});
    }
}

const createMeet = async (eventDetails, user) => {
    const {title, description, startTime, duration, freeEvent, ticketPrice, monetize, maxUser} = eventDetails;
    const token = user.googleCalendar;
    // console.log(token);
    OAuth2Client.setCredentials(token);
    let eventEndTime = new Date(startTime);

    // ToDo: Fix this if day change
    eventEndTime.setHours(eventEndTime.getHours() + parseInt(duration / 60));
    eventEndTime.setMinutes(eventEndTime.getMinutes() + (duration % 60));
    var event = {
        summary: title,
        description,
        start: {
            dateTime: new Date(startTime),
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: eventEndTime,
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