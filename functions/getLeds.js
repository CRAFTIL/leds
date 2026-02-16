const { UUID_CONTROL_CHARACTERISTIC, led_mac } = require("../config.json");
const noble = require("../../noble/index");

const TIMEOUT = 10000

async function getLeds() {

  return new Promise((resolve, reject) => {

    let timer;

    const onDiscover = (peripheral) => {
      const mac = peripheral.address.toLowerCase();
      if (mac === led_mac.toLowerCase()) {
        noble.stopScanning();

        peripheral.connect((err) => {
          if (err) {
            cleanup()
            return reject("Failed to connect: " + err);
          }

          peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) {
              cleanup()
              return reject("Discovery error: " + err);
            }

            const controlChar = characteristics.find(
              (c) => c.uuid === UUID_CONTROL_CHARACTERISTIC.replaceAll("-", "")
            );

            if (!controlChar) {
              cleanup()
              return reject("Control characteristic not found!");
            }

            cleanup(); // remove event listeners
            resolve({controlChar, peripheral}); //returning both so the main func can disconnect later
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
    clearTimeout(timer)
    noble.stopScanning()
    noble.removeAllListeners("stateChange");
    noble.removeAllListeners("discover");
    }

    timer = setTimeout(() => {
      try {
      cleanup();
      reject("LED device not found (timeout)");
      } catch (err) {
        console.error(err)
      }

    }, TIMEOUT);


    noble.on("stateChange", onStateChange);
    noble.on("discover", onDiscover);


    if (noble.state === "poweredOn") {
      noble.startScanning();
    }

  });
}



module.exports = { getLeds }    