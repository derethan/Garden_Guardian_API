/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/

//import the InfluxConnection
const {
  writeDataToInfluxDB,
  readDataFromInfluxDB,
} = require("../db/influxConnect");
const { Point } = require("@influxdata/influxdb-client");

/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js

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
      const reading = sensor.Name;
      const sensorName = sensor.Sensor;
      const sensorType = sensor.Type;
      const dataField = sensor.Field;
      const sensorValue = sensor.Value;
      const readTime = sensor.Time;
      const location = sensor.Location;

      // Log the data to the console
      console.log("=======================================");
      console.log("Sensor: ", reading);
      console.log("Sensor Name:", sensorName);
      console.log("Sensor Type:", sensorType);
      console.log("Sensor Value:", sensorValue);
      console.log("Reading Time:", readTime);
      console.log("Location:", location);
      console.log("=======================================");

      /**
       * 
       *  TODO: NEED TO REWORK DATE HANDLING TO ACCOUNT FOR LACK OF TIME SERVER ON DEVICE
       *  DEVICE WILL BE SET TO RETURN A NULL OR PLACEHOLDER VALUE
       * WHEN A REQUEST IS NULL, NEED TO CRREATE A CURRENT TIMESTAMP SERVERSIDE 
       * TO MATCH THE UTC FORMAT FOR INFLUX
       * 
       * 
       */



      //Get the current time
      const currentTime = new Date();
      // // Convert the UTC timestamp to local time
      // const localTime = moment.utc(readTime).local();

      // // Convert the local time to a Unix timestamp (seconds since epoch)
      // const timestamp = localTime.valueOf() / 1000;
      //Get the current time
      try {
        //Store the data in the InfluxDB
        const point = new Point(reading)
          .tag("sensor", sensorName)
          .tag("sensorType", sensorType)
          .tag("location", location)
          .tag("deviceName", DeviceID)
          .floatField(dataField, sensorValue)
          .timestamp(readTime > 1000000 ? readTime : currentTime);

        writeDataToInfluxDB(point).then((result) => {
          if (!result) {
            console.log(
              "Failed to store the " + { reading } + " in the database"
            );
          }
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "There was an error communication with the Influx server",
        });
      }
    });
  }); //End of Loop

  console.log("Sensor Data Stored");
  res.status(201).json({ message: "Sensor Data Stored" });
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

/***************************************
 * Route handler to update the device status
 * ************************************/
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

/***************************************
 * Route handler to get the device status
 * ************************************/
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
    if (timeDifference > 90000) {
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

// Export the functions
module.exports = {
  testconnection,
  storeSensorData,
  checkdeviceID,
  getDeviceStatus,
  updateDevicePing,
};
