const getDayMD = (date) => {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDay();
    return {
        year,
        month,
        day
    }
}
const getDate = (year, month, day) => {
    return new Date(year, month, day)
}
export {
    getDayMD,
    getDate
}