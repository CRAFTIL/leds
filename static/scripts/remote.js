
  var connected = false;

  connect()

  //super basic rn
  var picker = document.getElementById("colorPicker")
  var hex = document.getElementById("hexInput")
  
  var statusBox = document.getElementById("statusBox")

  picker.addEventListener("input", () => {
    hex.value = picker.value
  })

    hex.addEventListener("input", () => {
    picker.value = hex.value
  })


function connect() {
fetch('/connect', {method: 'POST'}).then(res => {
  if (res.status == 200) {
    statusBox.innerText = "Connected!";
    connected = true
  } else {
    statusBox.innerText = "Connection error. Try again.";
    connected = false;
  }
});

}

function sendLEDCommand(command, data, status = command + " " + data) {

   fetch('/leds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // or 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({
          command,
          data
        })
      })

    statusBox.innerText = "Sent: " + status
}


const colorPallete = [
  { name: "Red",     hex: "#FF0000" },
  { name: "Green",   hex: "#00FF00" },
  { name: "Blue",    hex: "#0000FF" },
  { name: "Yellow",  hex: "#FFFF00" },
  { name: "Orange",  hex: "#FFA500" },
  { name: "Purple",  hex: "#800080" },
  { name: "Aqua",    hex: "#00FFFF" },
  { name: "Pink",    hex: "#FFC0CB" },
  { name: "White",   hex: "#FFFFFF" },
  { name: "Gray",    hex: "#808080" }
]

//basic stuff

var power = "off"
var brightness = 40
var colorIndex = -1

var debounceTimer = null;

function debounce(fn) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, 500); // adjust delay as needed
}

function action(actionType) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    ActionHelper(actionType);
  }, 300); // 700ms after the last click
}

function ActionHelper(action) {

  fetch("/status")
    .then(res => res.json())
    .then(data => {
      if (!data.connected) {
        window.location.href = "/disconnected"; //self explanatory
        return;
      }
    });

  switch (action) {

    case "power":
      power = (power == "off" ? "on" : "off")
      sendLEDCommand("power", power)
    break;

    case "customColor":
      sendLEDCommand("color", hex.value)
    break;

    case "brightnessUP":
      if(brightness != 100) brightness += 10
      statusBox.innerText = "Sent: " + "Brightness " + brightness + "%"
      debounce(() => {sendLEDCommand("brightness", brightness, "Brightness " + brightness + "%")})
    break;

    case "brightnessDOWN": 
    if(brightness != 10) brightness -= 10
     statusBox.innerText = "Sent: " + "Brightness " + brightness + "%"
      debounce(() => {sendLEDCommand("brightness", brightness, "Brightness " + brightness + "%")})
    break;

    case "colorUP":
      if(colorIndex == 9) colorIndex = 0
      else colorIndex++
      sendLEDCommand("color", colorPallete[colorIndex].hex, "Color " + colorPallete[colorIndex].name)
    break;

    case "colorDOWN": 
    if(colorIndex < 1) colorIndex = 9
    else colorIndex--
    sendLEDCommand("color", colorPallete[colorIndex].hex, "Color " + colorPallete[colorIndex].name)
    break;

    case "W":
      sendLEDCommand("color", "white")
      break;

    case "R":
      sendLEDCommand("color", "red")
    break;

    case "G":
      sendLEDCommand("color", "green")
    break;

    case "B": 
    sendLEDCommand("color", "blue")
    break;

  }

}

window.addEventListener("beforeunload", function () {
  navigator.sendBeacon("/disconnect");
});


/* for frontend console playing */

let commands = {
    "turnOn": "3301010000000000000000000000000000000033",
    "turnOff": "3301000000000000000000000000000000000032",
    "keepAlive": "aa010000000000000000000000000000000000ab",
    //music
    "energetic": "3305130563000000000000000000000000000043",
    "spectrum": "3305130463000000000000000000000000000042",
    "rythm": "3305130363000000000000000000000000000045",
    "separation": "3305133263000000000000000000000000000074",
    "rolling": "3305130663000000000000000000000000000040",

    //scenes
    "sunrise": "3305040000000000000000000000000000000032",
    "sunset": "3305040100000000000000000000000000000033",
    "movie": "3305040400000000000000000000000000000036",
    "dating": "3305040500000000000000000000000000000037",
    "romantic": "3305040700000000000000000000000000000035",
    "blinking": "330504080000000000000000000000000000003a",
    "candlelight": "330504090000000000000000000000000000003b",
    "snowflake": "3305040f0000000000000000000000000000003d",
    "rainbow": "3305041600000000000000000000000000000024"
}

async function sendCustomCommand(data) {
  try {
    const res = await fetch("/leds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        command: "custom",
        data: data
      })
    });

    const text = await res.text();
    console.log("Server response:", text);
    return text;
  } catch (err) {
    console.error("Request failed:", err);
  }
}