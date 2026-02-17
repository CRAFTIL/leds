const { UUID_CONTROL_CHARACTERISTIC, led_mac } = require("../config.json");
const noble = require("../../noble/index");

async function getLeds() {

  return new Promise((resolve, reject) => {
    const onDiscover = (peripheral) => {
      const mac = peripheral.address.toLowerCase();
      if (mac === led_mac.toLowerCase()) {
        noble.stopScanning();

        peripheral.connect((err) => {
          if (err) return stop("Failed to connect: " + err, false);

          peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) return stop("Discovery error: " + err, false);

            const controlChar = characteristics.find(
              (c) => c.uuid === UUID_CONTROL_CHARACTERISTIC.replaceAll("-", "")
            );

            if (!controlChar) return stop("Control characteristic not found!", false);

            stop({controlChar, peripheral}, true); //returning both so the main func can disconnect later
          });
        });
      }
    };

    const onStateChange = (state) => {
      if (state === "poweredOn") {
        noble.startScanning();
      } else {
        noble.stopScanning();
      }
    };


 function cleanup() {
    noble.stopScanning()
    noble.removeAllListeners("stateChange");
    noble.removeAllListeners("discover");
    }

    function stop(stuff, success) {
      cleanup()
      success ? resolve(stuff) : reject(stuff)
    }

    noble.on("stateChange", onStateChange);
    noble.on("discover", onDiscover);


    if (noble.state === "poweredOn") {
      noble.startScanning();
    }

  });
}


module.exports = { getLeds }    