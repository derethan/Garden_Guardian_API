/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/
//const influx = require('../influx'); // Use the appropriate library for your database

/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js

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

// Export the functions
module.exports = {
  storeSensorData,
  sendDataToClient,
  testconnection,
};
