const { getLeds } = require("./getLeds");

var leds = null;
var ledTimeout = null;

function resetTimer() {
  if (ledTimeout) clearTimeout(ledTimeout);

  ledTimeout = setTimeout(() => {
    if (leds?.peripheral) {
      leds.peripheral.disconnect();
    }
    leds = null;
  }, 1000 * 60 * 2);
}


async function ensureConnected() {
  // if already connected
  if (leds?.controlChar) {
    resetTimer();
    return leds;
  }

  // connect
  leds = await getLeds();

  leds.peripheral.once("disconnect", () => {
    leds = null;
  });

  resetTimer();

  return leds;
}


function getCurrent() {
  return leds;
}

module.exports = {
  ensureConnected,
  getCurrent
};
