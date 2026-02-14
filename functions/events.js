const fs = require("node:fs")
const control = require("./controlLeds")
const { ensureConnected } = require("./connection")

/* -- helpers -- */

function loadEvents() {
  return JSON.parse(fs.readFileSync("../events.json", "utf8"));
}

function saveEvents(events) {
  fs.writeFileSync("../events.json", JSON.stringify(events, null, 4));
}

function nowHHMM() {
  return new Date().toTimeString().slice(0, 5);
}

function weekday() {
  return new Date().getDay() + 1; //Sunday = 1, Saturday = 7
}

function addEvent(id, event) { 
    /*{
    repeating,
    days,
    time,
    action
    }*/
  const events = loadEvents();
  if(events[id]) throw new Error("Event with this name already exists!")
  events[id] = event

  saveEvents(events)
  
}

function removeEvent(id) {
    const events = loadEvents();
    if(!events[id]) throw new Error("Event with this name not found!")
    events[id] = null
    delete events[id]

    saveEvents(events)
}

async function shaonShabbat() {
  const events = loadEvents()
  
  const timeNow = nowHHMM()
  const today = weekday()

  for (const [id, event] of Object.entries(events)) {
    
    if(event.time == timeNow) {
        if(!event.repeating || event.days.includes(today) || event.days == "all") {
            console.log("Executing event")
            const leds = await ensureConnected()
            control.doAction(leds, event.action)
            if(!event.repeating) {
                removeEvent(id)
            }
        }
    }

  }
  
}

module.exports = {
    addEvent, removeEvent, shaonShabbat
}