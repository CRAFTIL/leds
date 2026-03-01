const { getLeds } = require("./getLeds");
const control = require("./controlLeds")
const {ledTimeoutMS, ledKeepAliveMS, keepAlivePacket} = require("../config.json")


var leds = null;
var inactivityTimeout = null;
var keepAliveInterval = null;

function clearTimers() {
  clearTimeout(inactivityTimeout)
  clearInterval(keepAliveInterval)
  inactivityTimeout = null
  keepAliveInterval = null
}

function resetTimers() {
  clearTimers()
  
  inactivityTimeout = setTimeout(() => {
    disconnect()
  }, ledTimeoutMS)

  keepAliveInterval = setInterval(() => {
    keepAlive()
  }, ledKeepAliveMS)

}

function disconnect() {
  if(!isConnected()) return;
  leds?.peripheral?.disconnect()
  leds = null
  clearTimers()
}

function keepAlive() {
  if(!isConnected()) return false; //should i connect here?
  control.sendCustomCommand(leds, keepAlivePacket)
}

// function sendPacket(packet) {
//   if(!isConnected()) return false
//   leds.controlChar.write(packet, true)
//   return true
// }

function isConnected() {
  return !!(leds?.controlChar)
}


async function ensureConnected() {
  // if already connected
  if (isConnected()) {
    resetTimers();
    return leds;
  }

  // connect
  leds = await getLeds();

  leds.peripheral.once("disconnect", () => {
    clearTimers()
    leds = null;
  });

  resetTimers();

  return leds;
}

async function fireAndForget(action) {   //action syntax: {state, color, brightness}
  let leds = await ensureConnected()
  control.doAction(leds, action)
  //Will disconnect automatically after 5 minutes because of the timeout
}

module.exports = {
  ensureConnected,
  disconnect,
  isConnected,
  fireAndForget
};
