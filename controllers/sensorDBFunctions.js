const { readDataFromInfluxDB } = require("../db/influxConnect");

/***************************************
 * Function to Get the latest sensor reading for a specific sensor
 * ************************************/

async function getLastReading(req, res) {
  //Get the Parameters from the URL
  const deviceID = req.query.device_id;
  const measurement = req.query.measurement;

  //Query the InfluxDB for the latest reading
  const query = `from(bucket: "sensorData")
      |> range(start: -1d)
      |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
      |> last()`;

  try {
    //Read the data from the InfluxDB
    const resultData = await readDataFromInfluxDB(query);
    const sensorValue = parseFloat(resultData[0]._value.toFixed(2));

    res.status(200).json({ value: sensorValue });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the server" });
  }
}

/***************************************
 * Function to read the latest sensor reading for all sensors for a specific device
 * ************************************/
const getLastReadingAll = async () => {
  //Get the Parameters from the URL
  const deviceID = req.query.device_id;

  //Query the InfluxDB for the latest reading
  const query = `from(bucket: "sensorData")
      |> range(start: -1d)
      |> filter(fn: (r) => r.deviceName == "${deviceID}")
      |> group(columns: ["_measurement"])
      |> last()`;

  try {
    //Read the data from the InfluxDB
    const resultData = await readDataFromInfluxDB(query);

    // For each sensor, get the latest reading and create an object to store them
    const sensorData = {};
    resultData.forEach((sensor) => {
      sensorData[sensor._measurement] = parseFloat(sensor._value.toFixed(2));
    });

    console.log("Latest Sensor Reading: ", sensorData);

    res.status(200).json(sensorData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the server" });
  }
};


/***************************************
 * Function to query the InfluxDB for a specific sensor
 * ************************************/

module.exports = {
  getLastReading,
  getLastReadingAll,
};
