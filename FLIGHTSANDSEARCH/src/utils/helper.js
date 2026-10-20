function compareTime(timeString1, timeString2) {
    let dateTime1 = new Date(timeString1);
    let dateTime2 = new Date(timeString2);
    return dateTime1.getTime() > dateTime2.getTime();
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

function isFutureDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date.getTime() > now.getTime();
}

module.exports = {
    compareTime,
    isValidDate,
    isFutureDate
}