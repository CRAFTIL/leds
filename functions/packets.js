const config = require("../config.json")
const colors = require("../colorNames.json")

function hexToRGB(hexCode = "#ffffff") {
    hexCode = hexCode.replace('#', '')
    if(hexCode.length != 6) throw new Error("Invalid hex code!")

    var red = hexCode[0] + hexCode[1]
    var green = hexCode[2] + hexCode[3]
    var blue = hexCode[4] + hexCode[5]

    red = parseInt(red, 16)
    green = parseInt(green, 16)
    blue = parseInt(blue, 16)

    return [red, green, blue]
}

function color2rgb(color) {
    color = color.replace('#', '')
  let search = colors.colors.filter(c => c.name.toLowerCase() == color.toLowerCase() || c.hex.toLowerCase() == color.toLowerCase())
  if(search[0]) return [search[0].r, search[0].g, search[0].b]
  else return hexToRGB(color)
}


function buildPacket(command, payload, starter) { 

    if (!starter) starter = config.starter

    if(typeof command == "string") command = config.commands[command] //power, brightness, color

    var frame = [starter, command, ...payload] //basic data

    let amount = 19 - frame.length //padding

    for(let i = 0; i < amount; i++) {
        frame.push(0x00)
    }

    var checksum = frame.reduce((acc, val) => acc ^ val, 0) //XOR checksum

    frame.push(checksum)

    return Buffer.from(frame)
}


function colorPacket(color) {
    return buildPacket("color", [config.modes.manual, ...color2rgb(color)])
}

function brightnessPacket(brightness) { //between 1 and 100
 if (brightness < 1 || brightness > 100) {
    throw new Error("Brightness must be between 1 and 100");
  }

  brightness = Math.round((brightness / 100) * 255)
  
  return buildPacket("brightness", [brightness])
}

function powerPacket(power) { //on or off, 1 or 0

    if(typeof power == "string") {
        if(power.toLowerCase() == "off") power = 0
        else if (power.toLowerCase() == "on") power = 1
    } else {
        if(power == true) power = 1
        else if(power == false) power = 0
    }

    if(![0,1].includes(power)) throw new Error("Invalid power argument! please input true or false")

    return buildPacket("power", [power])
}


module.exports = {
    colorPacket,
    brightnessPacket,
    powerPacket,
    buildPacket
}