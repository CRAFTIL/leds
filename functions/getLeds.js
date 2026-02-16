async function getLeds() {
  return new Promise((resolve, reject) => {
    let timer;
    let resolved = false; // Add this flag

    const onDiscover = (peripheral) => {
      const mac = peripheral.address.toLowerCase();
      if (mac === led_mac.toLowerCase()) {
        noble.stopScanning();

        peripheral.connect((err) => {
          if (err) {
            cleanup()
            if (!resolved) {
              resolved = true;
              return reject("Failed to connect: " + err);
            }
            return;
          }

          peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) {
              cleanup()
              if (!resolved) {
                resolved = true;
                return reject("Discovery error: " + err);
              }
              return;
            }

            const controlChar = characteristics.find(
              (c) => c.uuid === UUID_CONTROL_CHARACTERISTIC.replaceAll("-", "")
            );

            if (!controlChar) {
              cleanup()
              if (!resolved) {
                resolved = true;
                return reject("Control characteristic not found!");
              }
              return;
            }

            cleanup();
            if (!resolved) {
              resolved = true;
              resolve({controlChar, peripheral});
            }
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
      cleanup();
      if (!resolved) {
        resolved = true;
        reject("LED device not found (timeout)");
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