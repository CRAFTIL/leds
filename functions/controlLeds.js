const {colorPacket, brightnessPacket, powerPacket, buildPacket} = require("./packets")

function setColor(leds, color) {
    const packet = colorPacket(color)
    leds.controlChar.write(packet)
}

function turnOn(leds) {
    const packet = powerPacket(true)
    leds.controlChar.write(packet)
    leds.state = 1
}

function turnOff(leds) {
    const packet = powerPacket(false)
    leds.controlChar.write(packet)
    leds.state = 0
}

function setBrightness(leds, brightness) {
    const packet = brightnessPacket(brightness)
    leds.controlChar.write(packet)
}

function setState(leds, state, whateverThisIs = false) {
    const packet = powerPacket(state)
    whateverThisIs ? leds.controlChar.write(packet, true) : leds.controlChar.write(packet)
    leds.state = state
}

function doAction(leds, action = {}) {
    if (!action || typeof action !== "object") return;

    const { state, color, brightness } = action;

    if (state === false) {
        turnOff(leds);
        return; // nothing else matters
    }

    if (state === true && leds.state !== 1) {
        turnOn(leds);
    }

    if (typeof brightness === "number") {
        setBrightness(leds, brightness);
    }

    if (color) {
        setColor(leds, color);
    }
}

function convertString(string) {
       return new Uint8Array(
             string.match(/[\da-f]{2}/gi).map(function (h) {
                 return parseInt(h, 16);
            })
        );
 }

function sendCustomCommand(leds, command) {
    const packet = Buffer.from(convertString(command))
    leds.controlChar.write(packet)
}

function buildCustomCommand(leds, command, payload, starter) {
    const packet = buildPacket(command, payload, starter)
    leds.controlChar.write(packet)
}

module.exports = {
    setColor, setBrightness, setState, turnOff, turnOn, doAction, sendCustomCommand, buildCustomCommand
}