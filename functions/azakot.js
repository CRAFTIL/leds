const axios = require("axios");

const city = require("../secrets.json").city

const url =
  "https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=1&city_0=" +
  encodeURIComponent(city);

let currentRID = 0;

async function fetchAlerts() {
  const { data } = await axios.get(url);
  return data;
}

async function setup() {
  while (true) {
    try {
      let alerts = await fetchAlerts();
      currentRID = alerts[0].rid;
      console.log("Alert system activated");
      return;
    } catch (err) {
      console.error("Setup failed, retrying in 5s:", err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function getAlert(callback) {
    const alerts = await fetchAlerts()
    if(!alerts?.length) return
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