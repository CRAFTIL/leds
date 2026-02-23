const { ensureConnected, disconnect, isConnected } = require("./functions/connection")
const { port } = require("./config.json")
const control = require("./functions/controlLeds")
const events = require("./functions/events")

// const timestamp = () => new Date().toLocaleString("he-il").replace(",", " |")
// const log = (stuff) => console.log("$ " +  timestamp() + " $: " + stuff)

const express = require("express")
const app = express();
app.use(express.json()); // Add this at the top

const fs = require("node:fs");
const path = require("node:path");

app.use("/static", express.static(path.join(__dirname, "static")));

app.post("/connect", async (req, res) => {
  try {
    await ensureConnected()
    res.status(200).send("Connected successfully")
  } catch(err) {
    res.status(500).send(err.toString())
  }
})

app.post("/leds", async (req, res) => {
  var leds = await ensureConnected()
  //if(leds == null) res.status(400).send("Leds not connected! go to /connect first.")
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
      res.status(200).send("command sent!")
    
  } catch (err) {
    res.status(500).send(err)
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
  disconnect()
  res.status(200).send("Disconnected")
});

app.get("/status", (req, res) => {
  res.json({ connected: isConnected() });
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
