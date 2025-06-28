const { UUID_CONTROL_CHARACTERISTIC, led_mac } = require("../config.json");
const noble = require("../../noble/index");

async function getLeds() {

  return new Promise((resolve, reject) => {
    const onDiscover = (peripheral) => {
      const mac = peripheral.address.toLowerCase();
      if (mac === led_mac.toLowerCase()) {
        noble.stopScanning();

        peripheral.connect((err) => {
          if (err) return reject("Failed to connect: " + err);

          peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) return reject("Discovery error: " + err);

            const controlChar = characteristics.find(
              (c) => c.uuid === UUID_CONTROL_CHARACTERISTIC.replaceAll("-", "")
            );

            if (!controlChar) return reject("Control characteristic not found!");

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
      noble.removeListener("stateChange", onStateChange);
      noble.removeListener("discover", onDiscover);
    }

    noble.on("stateChange", onStateChange);
    noble.on("discover", onDiscover);
  });
}


module.exports = { getLeds }    