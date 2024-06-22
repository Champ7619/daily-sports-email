require('dotenv').config();
var config = require('./config');
var tools = require('./tools');
const fetch = require('node-fetch');
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: config.email_client.host,
  port: config.email_client.port,
  secure: config.email_client.secure === "true", // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.MAIL_USER_EMAIL,
    pass: process.env.MAIL_USER_PASSWORD,
  },
});

(async function run() {
  console.log('Running MLB Schedule');
  
  const scheduleRequest = await fetch(`http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&hydrate=probablePitcher&date=${tools.theDate()}`);
  const scheduleData = await scheduleRequest.json();
  const standingsRequest = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&hydrate=division`);
  const standingsData = await standingsRequest.json();

  const games = scheduleData.dates[0].games;
  if (games.length === 0) return;

  let i = 0;
  let r = 0;

  var todaysGames = `
    <style>
      table, th, td {border: 1px solid #aaa; border-collapse: collapse;}
      table {min-width: 50%;}
      th {background-color: #aaa;}
      td {padding: 0.5rem;}
    </style>
    <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head>
    <h1>Schedule</h1>
    <table>
    <tr>
      <th style="padding: 0.5rem;">Time</th>
      <th style="padding: 0.5rem;">Team</th>
      <th style="padding: 0.5rem;">Record</th>
      <th style="padding: 0.5rem;">Probable Starter</th>
    </tr>`;

  while (i < games.length) {
    game = games[i];

    const awayTeam = game.teams.away;
    const homeTeam = game.teams.home;
    const gameTime = tools.theTime(game.gameDate);
    const aTeamName = awayTeam.team.name;
    const aTeamW = awayTeam.leagueRecord.wins;
    const aTeamL = awayTeam.leagueRecord.losses;
    const aPitcher = awayTeam.probablePitcher ? awayTeam.probablePitcher.fullName : "TBD";
    const hTeamName = homeTeam.team.name;
    const hTeamW = homeTeam.leagueRecord.wins;
    const hTeamL = homeTeam.leagueRecord.losses;
    const hPitcher = homeTeam.probablePitcher ? homeTeam.probablePitcher.fullName : "TBD";
    const gameNum = game.doubleHeader === 'Y' ? ` (game ${game.gameNumber})` : '';

    gameContent = `
      <tr>
        <td rowspan="2">${gameTime}${gameNum}</td>
        <td><strong>${aTeamName}</strong></td>
        <td>${aTeamW}-${aTeamL}</td>
        <td>${aPitcher}</td>
      </tr>
      <tr>
        <td><strong>${hTeamName}</strong></td>
        <td>${hTeamW}-${hTeamL}</td>
        <td>${hPitcher}</td>
      </tr>
      <tr><th colspan="4">&nbsp;</th></tr>`;
    
    todaysGames += gameContent;
    i++;
  };
  
  todaysGames += `</table>`;

  const standings = standingsData.records;
  i = 0;
  var currStandings = `
  <h1>Standings</h1>
    <table>
  `

  while (i < standings.length) {
    const division = standings[i].division.nameShort;
    currStandings += `
      <tr style="height: 24px;">
        <th style="padding: 1rem 0.5rem;">${division}</th>
        <th style="padding: 1rem 0.5rem;">W</th>
        <th style="padding: 1rem 0.5rem;">L</th>
        <th style="padding: 1rem 0.5rem;">PCT</th>
        <th style="padding: 1rem 0.5rem;">STRK</th>
        <th style="padding: 1rem 0.5rem;">GB</th>
        <th style="padding: 1rem 0.5rem;">WCGB</th>
      </tr>
    `
    records = standings[i].teamRecords;
    r = 0;

    while (r < records.length) {
      team = records[r];

      const teamName = team.team.name;
      const wins = team.leagueRecord.wins;
      const losses = team.leagueRecord.losses;
      const pct = team.leagueRecord.pct;
      const streak = team.streak.streakCode;
      const gamesBack = team.gamesBack;
      const wildCardGamesBack = team.wildCardGamesBack;
      const divisionChamp = team.divisionChamp;
      const divisionLeader = team.divisionLeader;
      const hasWildcard = team.hasWildcard;
      const clinched = team.clinched;
      const eliminationNumber = team.eliminationNumber;
      // TODO: Come back to this later once we see what the endpoint is going to give us.
      // let label;
      // return;
      // if (divisionChamp) {
      //   label = "z"
      // } else if (divisionLeader) {
      //   label = "y"
      // } else if (clinched) {
      //   label = "x"
      // }

      currStandings += `
        <tr>
          <td><strong>${teamName}</strong></td>
          <td style="text-align: center">${wins}</td>
          <td style="text-align: center">${losses}</td>
          <td style="text-align: center">${pct}</td>
          <td style="text-align: center">${streak}</td>
          <td style="text-align: center">${gamesBack}</td>
          <td style="text-align: center">${wildCardGamesBack}</td>
        </tr>
      `
      r++;
    };
    
    i++;
  };

  currStandings += `</table>`;

  const bodyText = todaysGames + `<br/><hr/>` + currStandings;

  await transporter.sendMail({
    from: process.env.MAIL_FROM, // sender address
    to: process.env.MAIL_TO, // list of receivers
    subject: `MLB Schedule & Standings for ${tools.theDate(pretty=true)}`,
    text: `${bodyText}`, // plain text body
    html: `${bodyText}`, // html body
  });
  
  console.log("Message sent");
})();