const fetch = require('node-fetch');

async function getEvents(accessToken, calendarId, q) {
    return await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${q}`, {
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(res => res.json());
}

async function insertEvent(accessToken, calendarId, body) {
    return await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body),
        method: 'POST'
    })
        .then(res => res.json())
        .catch(err => {
            console.error(err);
        });
}

module.exports = {
    getEvents,
    insertEvent
};
