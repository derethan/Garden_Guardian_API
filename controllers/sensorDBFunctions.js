const { readDataFromInfluxDB } = require("../db/influxConnect");

/***************************************
 * Function to Get the latest sensor reading 
 * - for a specific sensor
 * ************************************/

async function getLastReading(req, res) {
  //Get the Parameters from the URL
  const deviceID = req.query.device_id;
  const measurement = req.query.measurement;

  //Query the InfluxDB for the latest reading
  const query = `from(bucket: "sensorData")
      |> range(start: -100y)
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
 * Function to read the latest sensor reading
 *  - All sensors for a specific device
 * ************************************/
const getLastReadingAll = async (req, res) => {
  //Get the Parameters from the URL
  const deviceID = req.query.device_id;

  //Query the InfluxDB for the latest reading
  const query = `from(bucket: "sensorData")
      |> range(start: -100y)
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
 
async function getSensorReading() {
  //Get the Parameters from the URL
  const deviceID = req.query.device_id;
  const measurement = req.query.measurement;
  const duration = req.query.duration;

  //Query the InfluxDB for all reading matching the parameters
  const query = `from(bucket: "sensorData")
    |> range(start: -${duration})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
    `;

  try {
    //Read the data from the InfluxDB
    const resultData = await readDataFromInfluxDB(query);
    const sensorData = [];

    // For each sensor, get the latest reading and create an object to store them
    resultData.map((sensor) => {
      sensorData.push({
        name: sensor._measurement,
        time: sensor._time,
        value: parseFloat(sensor._value.toFixed(2)),
      });
    });

    res.status(200).json(sensorData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the server" });
  }
}



module.exports = {
  getLastReading,
  getLastReadingAll,
  getSensorReading,
};
