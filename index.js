const {colorPacket, brightnessPacket, powerPacket} = require("./functions/packets")
const { getLeds } = require("./functions/getLeds")
const { port } = require("./config.json")

const express = require("express")
const app = express();
app.use(express.json()); // Add this at the top

const fs = require("node:fs");
const path = require("node:path");

app.use("/static", express.static(path.join(__dirname, "static")));


var leds = null
var ledTimeout = null;
function resetLed() {
  if (ledTimeout) {
    clearTimeout(ledTimeout);
  }
  ledTimeout = setTimeout(() => {
    if (leds && leds.peripheral) {
      leds.peripheral.disconnect();
      leds = null; // cleanup reference 
    }
  }, 1000 * 60 * 2)
}


app.post("/connect", async (req, res) => {

  if(leds && leds?.controlChar)  {
    res.status(200).send("Connected successfully")
    resetLed()
    return;
  }

  try {
    const response = await getLeds()
   if(response) {
    //res.send("Connected successfully!")
    res.status(200).send("Connected successfully")
    leds = response
    leds.state = 1
    resetLed()
  } else {
    res.status(400).send("idk")
  }

  } catch (err) {
    res.status(500).send(err)
  }

  leds.peripheral.on("disconnect", () => {
  console.warn("LED device disconnected!");
  leds = null;
})

setInterval(() => {
  if (leds?.controlChar) {
    try {
      const ping = powerPacket(leds.state); // power on packet
      leds.controlChar.write(ping, true); 
    } catch (err) {
      console.warn("Ping failed:", err);
    }
  }
}, 5000); // every 5 seconds


})


app.post("/leds", (req, res) => {
  if(leds == null) res.status(400).send("Leds not connected! go to /connect first.")
    else {
  try {
    var packetToSend;
      const data = req.body
      switch (data.command) {

        case "power":
          packetToSend = powerPacket(data.data)
          leds.state = data.data
          break;

          case "color": 
          packetToSend = colorPacket(data.data)
          break;

          case "brightness": 
          packetToSend = brightnessPacket(data.data)
          break;

          default:
          return res.status(400).send("Invalid command");
          
      }
      leds.controlChar.write(packetToSend)
      resetLed()
      res.status(200).send("command sent!")
    
  } catch (err) {
    res.status(500).send(err)
  }
}
})


app.get("/remote", (req, res) => {
  res.write(fs.readFileSync(path.join(__dirname, "static/html/remote.html")))
  res.end()
})

app.post("/disconnect", (req, res) => {
  if (leds && leds.peripheral) {
    leds.peripheral.disconnect();
    leds = null;
    res.status(200).send("Disconnected");
  } else {
    res.status(400).send("No device connected");
  }
});

app.get("/status", (req, res) => {
  res.json({ connected: (leds && leds?.controlChar) ? true : false });
});


app.listen(port, () => {
  console.log("Server running on port " + port);
});