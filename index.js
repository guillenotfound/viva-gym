// Usage node index.js <email> <password>

const fetch = require("node-fetch");
const inquirer = require("inquirer");

const EMAIL = process.argv[2];
const PWD = process.argv[3];

async function fetchCredentials() {
    const { clubNo, contractPersonId, token } = await fetch("https://api.vivagym.net:44301//User/Login", {
        credentials: "omit",
        headers: { accept: "application/json", "content-type": "application/json", "sec-fetch-mode": "cors" },
        body: JSON.stringify({ Username: EMAIL, Password: PWD }),
        method: "POST",
        mode: "cors"
    })
        .then(res => res.json())
        .catch(console.error);

    return {
        clubNo,
        contractPersonId,
        token
    };
}

async function fetchClasses(token, clubNo, contractPersonId) {
    const currentDate = encodeURI(new Date().toISOString());
    return await fetch(`https://api.vivagym.net:44301//Class/ListClubClassesForPerson?classDateFrom=${currentDate}&clubNo=${clubNo}&contractPersonId=${contractPersonId}&noOfDays=7&studioNo=0`, {
        credentials: "include",
        headers: {
            accept: "application/json",
            authorization: `Basic ${token}`,
            "content-type": "application/json",
            "sec-fetch-mode": "cors"
        },
        method: "GET",
        mode: "cors"
    })
        .then(res => res.json())
        .catch(console.error);
}

async function addBooking(token, clubClassId, contractPersonId) {
    const { result, error } = await fetch("https://api.vivagym.net:44301//Class/AddBooking", {
        credentials: "include",
        headers: {
            accept: "application/json",
            authorization: `Basic ${token}`,
            "content-type": "application/json",
            "sec-fetch-mode": "cors"
        },
        body: JSON.stringify({ contractPersonId, clubClassId, equipmentNo: null, isInduction: false }),
        method: "POST",
        mode: "cors"
    })
        .then(res => res.json())
        .catch(console.error);

    return result || error;
}

async function cancelBooking(token, clubClassId, contractPersonId) {
    const { result, error } = await fetch("https://api.vivagym.net:44301//Class/CancelBooking", {
        credentials: "include",
        headers: {
            accept: "application/json",
            authorization: `Basic ${token}`,
            "content-type": "application/json",
            "sec-fetch-mode": "cors"
        },
        body: JSON.stringify({ contractPersonId, clubClassId }),
        method: "POST",
        mode: "cors"
    })
        .then(res => res.json())
        .catch(console.error);

    return result || error;
}

async function prompt(allClasses) {
    const { clubClass } = await inquirer.prompt([
        {
            type: "list",
            message: "Select a date",
            name: "dayOfweek",
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
            type: "list",
            message: "Select a class",
            name: "clubClass",
            choices: answers => {
                return allClasses
                    .find(c => c.day === answers.dayOfweek)
                    .clubClasses.map(c => {
                        const name = `${c.name} ${c.startTime} (${c.spacesAvailable})`;
                        return {
                            name: c.isBooked ? `>> ${name} <<` : name,
                            value: { clubClassId: c.id, isBooked: c.isBooked }
                        };
                    });
            }
        }
    ]);

    return { ...clubClass };
}

async function main() {
    const { clubNo, contractPersonId, token } = await fetchCredentials();

    const allClasses = await fetchClasses(token, clubNo, contractPersonId);
    const { clubClassId, isBooked } = await prompt(allClasses);

    let response;
    if (isBooked) {
        response = await cancelBooking(token, clubClassId, contractPersonId);
    } else {
        response = await addBooking(token, clubClassId, contractPersonId);
    }

    console.log(response);
}

main();
