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
        .catch(err => {
            console.error(err);
        });

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
        .catch(err => {
            console.error(err);
        });
}

async function addBooking(token, clubClassId, contractPersonId) {
    const { result } = await fetch("https://api.vivagym.net:44301//Class/AddBooking", {
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
        .catch(err => {
            console.error(err);
        });
    return result;
}

async function getDayOfWeek(classesDates) {
    const { dayOfweek } = await inquirer.prompt([
        {
            type: "list",
            message: "Select a date",
            name: "dayOfweek",
            choices: classesDates
        }
    ]);
    return { dayOfweek };
}

async function getClass(classes) {
    const { clubClassId } = await inquirer.prompt([
        {
            type: "list",
            message: "Select a class",
            name: "clubClassId",
            choices: classes
        }
    ]);
    return { clubClassId };
}

async function main() {
    const { clubNo, contractPersonId, token } = await fetchCredentials();

    const allClasses = await fetchClasses(token, clubNo, contractPersonId);
    const classesDates = allClasses.map(c => {
        return {
            name: new Date(c.date).toDateString(),
            value: c.day
        };
    });

    const { dayOfweek } = await getDayOfWeek(classesDates);
    const dateObj = allClasses.find(c => c.day === dayOfweek);

    const classNamesHour = dateObj.clubClasses.map(c => {
        return {
            name: `${c.name} ${c.startTime} (${c.spacesAvailable})`,
            value: c.id
        };
    });
    const { clubClassId } = await getClass(classNamesHour);

    const response = await addBooking(token, clubClassId, contractPersonId);
    console.log("response: ", response);
}

main();
