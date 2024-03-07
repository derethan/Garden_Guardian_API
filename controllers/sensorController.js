/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/

//import the InfluxConnection
const {writeDataToInfluxDB, readDataFromInfluxDB} = require("../db/influxConnect");
const { Point } = require('@influxdata/influxdb-client');


let sensorType = "DHT";
let sensorName = "Sensor1";
let temperature = 22; // in Celsius
let humidity = 33; // in percentage
let location = "Garden";
let deviceName = "GG-001";

const point = new Point("DHT Sensor1")
.tag("sensorType", sensorType)
.tag("sensorName", sensorName)
.tag("location", location)
.tag("deviceName", deviceName)
.floatField("temperature", temperature)
.floatField("humidity", humidity);



async function testreadDataFromInfluxDB() {
  const query = `from(bucket: "sensorData") |> range(start: -30m) |> filter(fn: (r) => r._measurement == "DHT Sensor1")`;

  const resultData = await readDataFromInfluxDB(query);
  console.log(resultData);
}
testreadDataFromInfluxDB ();
/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js
const { text } = require("express");

/***************************************
 *  Sensor Route Handler to store
 * sensor Data from Garden Gardian Device
 * ************************************/

async function storeSensorData(req, res) {
  // Implement sensor data storage logic, e.g., write data to the database.

  //Store data from post request
  const responseData = req.body;

  //Loop through the data and destructure it for Database Storage
  responseData.Data.forEach((reading) => {
    const DeviceID = reading.Device.DeviceID;

    //Log the data to the console
    console.log(" ");
    console.log("New Sensor Reading:");
    console.log("DeviceID:", DeviceID);

    reading.SensorReadings.forEach((sensor) => {
      const sensorName = sensor.Name;
      const sensorValue = sensor.Value;
      const readTime = sensor.Time;

      //Log the data to the console
      console.log("Sensor Name:", sensorName);
      console.log("Sensor Value:", sensorValue);
      console.log("Reading Time:", readTime);
      console.log("=======================================");
    });
  });

  try {
    // Database operation here
    res.status(201).json({ message: "Sensor data stored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Data storage failed" });
  }
}

async function sendDataToClient(req, res) {
  // Implement sensor data storage logic, e.g., write data to the database.
}

/***************************************
 *  Test Connection between Route handler
 * and GardenGuardian Device
 * ************************************/
async function testconnection(req, res) {
  try {
    // Get the device ID from the route
    let deviceID = req.query.deviceID;

    // Check if the device exists in the database
    const deviceExists = await checkdeviceID(deviceID);

    // If the device does not exist, add it to the database
    if (!deviceExists) {
      const result = addDevice(deviceID);
      if (result) {
        console.log(deviceID + " added to the database");
      } else {
        console.log("Failed to add device to the database");
      }
    }

    res
      .status(201)
      .json({ message: "Connection to the GardenGuardian Network succesfull" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the server" });
  }
}

/***************************************
 * Function to Add and verify The devices in the database
 * ************************************/

// Check if the device exists in the database
async function checkdeviceID(deviceID) {
  // Check if the device exists in the database
  const sql = "SELECT * FROM devices WHERE device_id = ?";
  const VALUES = [deviceID];

  const deviceExists = await dbQueryPromise(sql, VALUES);

  return deviceExists.length > 0 ? true : false;
}

// Add the device to the database
async function addDevice(deviceID) {
  // Add the device to the database
  const sql = "INSERT INTO devices (device_id) VALUES (?)";
  const VALUES = [deviceID];

  const result = await dbQueryPromise(sql, VALUES);

  return result;
}

//A Route Handler to check the status of the device
async function getDeviceStatus(req, res) {
  //get the device_id from the header
  const deviceID = req.headers.device_id;

  try {
    //check the latest ping timestamp in the devices table for the device
    const sql = "SELECT last_ping FROM devices WHERE device_id = ?";
    const VALUES = [deviceID];

    const result = await dbQueryPromise(sql, VALUES);

    //if the device is not found
    if (result.length === 0) {
      res.status(404).json({ message: "Device Not Found" });
    }

    //Get the Last Ping Timestamp
    const lastPing = result[0].last_ping;

    //Get the current time
    const currentTime = new Date();

    //Calculate the time difference
    const timeDifference = currentTime - lastPing;

    //If the time difference is greater than 1 minutes
    if (timeDifference > 60000) {
      res.status(201).json({
        message: "Device is Offline",
        status: "Offline",
      });
    } else {
      res.status(201).json({
        message: "Device is Online",
        status: "online",
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the Database" });
  }
}

//Route handler to recieve Pings from the device and update the latest ping timestamp
async function updateDevicePing(req, res) {
  try {
    const deviceID = req.query.deviceID;
    console.log("Ping Recieved From ", deviceID);

    // Update the latest ping timestamp
    const sql =
      "UPDATE devices SET last_ping = CURRENT_TIMESTAMP WHERE device_id = ?";
    const VALUES = [deviceID];

    const result = await dbQueryPromise(sql, VALUES);

    if (!result) {
      console.log("Failed to update the last ping timestamp");
    }

    res
      .status(201)
      .json({ message: "Ping Recieved and Device Status Updated" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error communication with the server" });
  }
}

// Export the functions
module.exports = {
  storeSensorData,
  sendDataToClient,
  testconnection,
  checkdeviceID,
  getDeviceStatus,
  updateDevicePing,
};
