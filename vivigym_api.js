const fetch = require('node-fetch');

async function login(email, password) {
    return await fetch('https://api.vivagym.net:44301//User/Login', {
        credentials: 'omit',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'sec-fetch-mode': 'cors' },
        body: JSON.stringify({ Username: email, Password: password }),
        method: 'POST',
        mode: 'cors'
    })
        .then(res => res.json())
        .catch(console.error);
}

async function getClasses(token, clubNo, contractPersonId) {
    const currentDate = encodeURI(new Date().toISOString());

    return await fetch(`https://api.vivagym.net:44301//Class/ListClubClassesForPerson?classDateFrom=${currentDate}&clubNo=${clubNo}&contractPersonId=${contractPersonId}&noOfDays=7&studioNo=0`, {
        credentials: 'include',
        headers: {
            'accept': 'application/json',
            'authorization': `Basic ${token}`,
            'content-type': 'application/json',
            'sec-fetch-mode': 'cors'
        },
        method: 'GET',
        mode: 'cors'
    })
        .then(res => res.json())
        .catch(console.error);
}

async function addBooking(token, clubClassId, contractPersonId) {
    return await fetch('https://api.vivagym.net:44301//Class/AddBooking', {
        credentials: 'include',
        headers: {
            'accept': 'application/json',
            'authorization': `Basic ${token}`,
            'content-type': 'application/json',
            'sec-fetch-mode': 'cors'
        },
        body: JSON.stringify({ contractPersonId, clubClassId, equipmentNo: null, isInduction: false }),
        method: 'POST',
        mode: 'cors'
    })
        .then(res => res.json())
        .catch(() => {
            return { error: 'Unable to book class' };
        });
}

async function cancelBooking(token, clubClassId, contractPersonId) {
    return await fetch('https://api.vivagym.net:44301//Class/CancelBooking', {
        credentials: 'include',
        headers: {
            'accept': 'application/json',
            'authorization': `Basic ${token}`,
            'content-type': 'application/json',
            'sec-fetch-mode': 'cors'
        },
        body: JSON.stringify({ contractPersonId, clubClassId }),
        method: 'POST',
        mode: 'cors'
    })
        .then(res => res.json())
        .catch(console.error);
}

module.exports = {
    login,
    getClasses,
    addBooking,
    cancelBooking
};
