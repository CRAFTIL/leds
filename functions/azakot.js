const axios = require("axios");

const city = require("../secrets.json").city

const url =
  "https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=1&city_0=" +
  encodeURIComponent(city);

let currentRID = 0;

async function fetchAlerts() {
  const { data } = await axios.get(url, { timeout: 5000 });
  return data;
}

async function setup() {
    let alerts = await fetchAlerts()
    let latest = alerts[0]
    currentRID = latest.rid
    console.log("Alert system activated")
}

async function getAlert(callback) {
    const alerts = await fetchAlerts()
    let event = alerts[0]
    //const newEvents = alerts.filter(a => a.rid > latestRid);
    if(event.rid > currentRID) {
        //Event!
         console.log("New alert:", event.category_desc, event.time);
         currentRID = event.rid
         callback(event.category)
    }

}

module.exports = { setup, getAlert }