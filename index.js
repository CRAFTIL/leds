const { getLeds } = require("./functions/getLeds")
const { port } = require("./config.json")
const control = require("./functions/controlLeds")
const events = require("./functions/events")
const {color2rgb} = require("./functions/packets")

const express = require("express")
const app = express();
app.use(express.json()); // Add this at the top

const fs = require("node:fs");
const path = require("node:path");

app.use("/static", express.static(path.join(__dirname, "static")));


var leds = null
var ledTimeout = null;
var ledKeepAlive = null;

function resetLed() {
  if (ledTimeout) {
    clearTimeout(ledTimeout);
    ledTimeout = null;
  }
  ledTimeout = setTimeout(() => {
    if (leds && leds.peripheral) {
      leds.peripheral.disconnect();
      leds = null; // cleanup reference 
    }
  }, 1000 * 60 * 5)

    if (ledKeepAlive) {
    clearInterval(ledKeepAlive);
    ledKeepAlive = null;
  }

  ledKeepAlive = setInterval(() => {
  if (leds?.controlChar) {
    try {
      control.sendCustomCommand(leds, "aa010000000000000000000000000000000000ab") //keep alive packet
    } catch (err) {
      console.warn("Ping failed:", err);
    }
  }
}, 5000); // every 5 seconds

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
    resetLed()
  } else {
    res.status(400).send("idk")
  }

  } catch (err) {
    console.error("Connection error:" + err)
    res.status(500).send(err.toString())
  }

  leds?.peripheral?.once("disconnect", () => {
  // console.log("LEds now disconnecting!!")
  leds = null;
  if (ledTimeout) {
    clearTimeout(ledTimeout);
    ledTimeout = null;
  }
  if (ledKeepAlive) {
    clearInterval(ledKeepAlive);
    ledKeepAlive = null;
  }
})

})


app.post("/leds", (req, res) => {
  if(leds == null) res.status(400).send("Leds not connected! go to /connect first.")
    else {
  try {
    const {command, data} = req.body

      switch (command) {

        case "power":
          control.setState(leds, data)
          break;

          case "color": 
          control.setColor(leds, data)
          break;

          case "brightness": 
          control.setBrightness(leds, data)
          break;

          case "custom":
          control.sendCustomCommand(leds, data)
          break;

          case "buildCustom":
          control.buildCustomCommand(leds, data.command, data.payload)
          break;

          case "scene":
          control.setScene(leds, data)
          break;

          default:
          return res.status(400).send("Invalid command");
          
      }
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

app.get("/timers", (req, res) => {
  res.write(fs.readFileSync(path.join(__dirname, "static/html/timer.html")))
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

app.get("/disconnected", (req, res) => {
  res.redirect("/remote")
})

app.listen(port, () => {
  console.log("Server running on port " + port);
});

/* -- Shaon Shabbat logic -- */

app.get("/getAllTimers", (req, res) => {
  const events = JSON.parse(fs.readFileSync("./events.json", "utf8"));
  return res.json(events)
})

app.post("/newTimer", (req, res) => {
  try {
    const body = req.body;

    if (!body.id || !body.timer?.time)
      return res.status(400).send("Invalid request");

    events.addEvent(body.id, body.timer);

    res.status(200).send("saved the new timer!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/deleteTimer", (req, res) => {
  try {
    events.removeEvent(req.body.id);
    res.status(200).send("deleted");
  } catch (err) {
    res.status(500).send(err.message);
  }
});



setInterval(async () => {
  try {
    await events.shaonShabbat()
  } catch (err) {
    console.error("shaonShabbat error:", err)
  }
}, 60_000)
