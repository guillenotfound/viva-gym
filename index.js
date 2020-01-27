// Usage node index.js <email> <password>

const fetch = require('node-fetch');
const inquirer = require('inquirer');

const googleCalendarApi = require('./google_calendar_api');
const vivagymApi = require('./vivigym_api');

const [EMAIL, PASSWORD] = process.argv.slice(2);
const CALENDAR_ID = '';
const ACCESS_TOKEN_ENDPOINT = '';

async function addBooking(token, clubClassId, contractPersonId, { name, classDate, startTime, endTime }) {
    const { result, error } = await vivagymApi.addBooking(token, clubClassId, contractPersonId);

    if (CALENDAR_ID) {
        const { accessToken } = await fetch(ACCESS_TOKEN_ENDPOINT).then(res => res.json());

        const { items } = await googleCalendarApi.getEvents(accessToken, CALENDAR_ID, clubClassId);

        if (items.length === 0) {
            const startDateTime = new Date(classDate);
            const [startHour, startMinutes] = startTime.split(':').map(e => Number.parseInt(e));
            startDateTime.setHours(startHour);
            startDateTime.setMinutes(startMinutes);

            const endDateTime = new Date(classDate);
            const [endHour, endMinutes] = endTime.split(':').map(e => Number.parseInt(e));
            endDateTime.setHours(endHour);
            endDateTime.setMinutes(endMinutes);

            await googleCalendarApi.insertEvent(accessToken, CALENDAR_ID, {
                description: clubClassId,
                summary: name,
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Europe/Madrid'
                },
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Europe/Madrid'
                },
                reminders: {
                    useDefault: true
                }
            });
        }
    }

    return result || error;
}

async function prompt(allClasses) {
    const { clubClass } = await inquirer.prompt([
        {
            type: 'list',
            message: 'Select a date',
            name: 'dayOfweek',
            choices: () => {
                return allClasses.map(c => {
                    return {
                        name: new Date(c.date).toDateString(),
                        value: c.day
                    };
                });
            }
        },
        {
            type: 'list',
            message: 'Select a class',
            name: 'clubClass',
            choices: answers => {
                return allClasses
                    .find(c => c.day === answers.dayOfweek)
                    .clubClasses.map(c => {
                        const name = `${c.name} ${c.startTime} (${c.spacesAvailable})`;
                        return {
                            name: c.isBooked ? `>> ${name} <<` : name,
                            value: { clubClassId: c.id, isBooked: c.isBooked, raw: c }
                        };
                    });
            }
        }
    ]);

    return { ...clubClass };
}

async function main() {
    const { clubNo, contractPersonId, token } = await vivagymApi.login(EMAIL, PASSWORD);

    const allClasses = await vivagymApi.getClasses(token, clubNo, contractPersonId);
    const { clubClassId, isBooked, raw } = await prompt(allClasses);

    let response;
    if (isBooked) {
        response = await vivagymApi.cancelBooking(token, clubClassId, contractPersonId);
    } else {
        response = await addBooking(token, clubClassId, contractPersonId, raw);
    }

    console.log(response);
}

main();
