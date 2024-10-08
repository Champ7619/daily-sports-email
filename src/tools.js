var config = require('./config');
module.exports = {
  theDate: function (pretty = false, showLabel = false) {
    const dateObj = new Date();
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const monthPretty = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();

    const nthNumber = (number) => {
      if (number > 3 && number < 21) return `${number}th`;
      switch (number % 10) {
        case 1:
          return `${number}st`;
        case 2:
          return `${number}nd`;
        case 3:
          return `${number}rd`;
        default:
          return `${number}th`;
      }
    };

    if (pretty === true) {
      return `${monthPretty} ${nthNumber(day)}, ${year}`;
    } else if (showLabel === true) {
      return (month >= 8) ? true : false;
    } else {
      return `${year}-${('0' + month).slice(-2)}-${('0' + day).slice(-2)}`
    }
  },

  theTime: (gameDate) => new Date(gameDate).toLocaleTimeString('en-US', {timeZone: config.user.time_zone, hour: '2-digit', minute: '2-digit', hour12: !!+config.user.time_hour}),

  teamClass: (teamName) => teamName.replace(/\s+/g, '-').replace(/\./g, '').toLowerCase(),

  teamConfig: (teamName) => config.mlb[teamName.replace(/\s+/g, '_').replace(/\./g, '').toLowerCase()]
};