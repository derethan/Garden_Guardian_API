/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/

//import the InfluxConnection
const { writeDataToInfluxDB, readDataFromInfluxDB } = require("../db/influxConnect");
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
    // log the full request
    console.log("Test Connection Request Received");
    // console.log("Request Headers:", req.headers);
    // console.log("Request Query:", req.query);

    // Get the device ID from the route
    let deviceID = req.query.deviceID;

    // log the deviceID
    console.log("Device ID:", deviceID);

    // Validate deviceID
    if (!deviceID || deviceID.trim() === "") {
      return res.status(400).json({ message: "Device ID is required" });
    }

    // Check if the device exists in the database
    const deviceExists = await checkdeviceID(deviceID);

    // Log the device existence check
    console.log("Device Exists:", deviceExists);

    // If the device does not exist, add it to the database
    if (!deviceExists) {
      const result = await addDevice(deviceID);
      if (result) {
        console.log(deviceID + " added to the database");
      } else {
        console.log("Failed to add device to the database");
      }
    }

    // Update the device ping in the database
    const pingUpdated = await updateDevicePing(deviceID);
    if (!pingUpdated) {
      console.log("Failed to update device ping");
      return res.status(500).json({ message: "Failed to update device ping" });
    }

    res.status(200).json({ message: "API connection status: OK. Device communication verified." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
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

/***************************************
 * Helper Function to update the device status
 *
 * ************************************/
async function updateDevicePing(deviceID) {
  try {
    // Update the latest ping timestamp
    const sql = "UPDATE devices SET last_ping = CURRENT_TIMESTAMP WHERE device_id = ?";
    const VALUES = [deviceID];

    const result = await dbQueryPromise(sql, VALUES);

    if (!result) {
      console.log("Failed to update the last ping timestamp");
    }

    console.log("Device ping updated successfully");
    return true;
  } catch (error) {
    console.error(error);
    return false;
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
    res.status(500).json({ message: "There was an error communication with the Database" });
  }
}

/***************************************
 * Route handler to get the Sensor status
 * ************************************/
async function getSensorStatus(req, res) {
  // Get the Header Data
  const deviceID = req.headers.device_id;

  //Query the InfluxDB for the latest reading
  const query = `from(bucket: "sensorData")
    |> range(start: -100y)
    |> filter(fn: (r) => r.deviceName == "${deviceID}")
    |> group(columns: ["_measurement"])
    |> last()`;

  try {
    //Read the data from the InfluxDB
    const resultData = await readDataFromInfluxDB(query);

    // For each sensor, get the Measurement Name (Sensor Name) and the latest reading Timestamp
    const sensorData = [];
    resultData.forEach((sensor) => {
      // Last time the Sensor was read
      const lastReading = new Date(sensor._time);
      let status = "Offline";

      // If the last reading was more then 5 min ago, set the status to "Offline", otherwise set it to "Online"
      const currentTime = new Date();
      const timeDifference = currentTime - lastReading;

      if (timeDifference > 300000) {
        // 5 minutes
        status = "Offline";
      } else {
        status = "Online";
      }

      sensorData.push({
        sensor: sensor._measurement,
        sensorStatus: status,
      });
    });

    res.status(200).json(sensorData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

/***************************************
 *  Sensor Route Handler to store
 * sensor Data from Garden Gardian Device
 * ************************************/
async function storeSensorData(req, res) {
  //Store data from post request
  const responseData = req.body;

  // log the full request
  console.log("Test Connection Request Received");
  console.log("Response Data:", responseData);

  // Validate the sensor data using the helper function
  const validation = validateSensorData(responseData);

  if (!validation.isValid) {
    const errorResponse = {
      message: "Invalid sensor data",
      errors: validation.errors,
    };

    // Add missing fields to response if they exist
    if (validation.missingFields) {
      errorResponse.missingFields = validation.missingFields;
    }

    return res.status(400).json(errorResponse);
  }

  // // Log the received data after validation
  // console.log("Sensor Data Received and Validated:");
  // console.log(JSON.stringify(responseData, null, 2));

  //Get the current time
  const currentTime = new Date();

  //Loop through the data and destructure it for Database Storage
  const DeviceID = responseData.deviceId;
  const sensorName = responseData.sensorId;
  const sensorType = responseData.sensorType;
  const sensorStatus = responseData.sensorStatus || "400"; // Default to "400" if not provided
  const unit = responseData.unit || "unknown"; // Default to "unknown" if not provided
  const sensorValues = responseData.values || []; // Array of sensor values
  const readTime = responseData.timestamp || currentTime; // Default to current time if not provided

  //Log the data to the console
  console.log("New Sensor Reading:");
  console.log("DeviceID:", DeviceID);

  try {
    //Store the data in the InfluxDB
    const point = new Point(sensorName)
      .tag("deviceName", DeviceID)
      .tag("sensor", sensorName)
      .tag("sensorType", sensorType)
      .tag("sensorStatus", sensorStatus)
      .tag("unit", unit);

    // Add each sensor value as a separate field
    // If there's only one value, use "value" as the field name
    // If there are multiple values, use "value_0", "value_1", etc.
    if (sensorValues.length === 1) {
      point.floatField("value", sensorValues[0]);
    } else {
      sensorValues.forEach((value, index) => {
        point.floatField(`value_${index}`, value);
      });
    }

    // Set the timestamp
    point.timestamp(readTime > 1000000 ? readTime : currentTime);

    writeDataToInfluxDB(point).then((result) => {
      if (!result) {
        console.log("Failed to store the " + { reading } + " in the database");

        throw new Error("Failed to store the reading in the database");
      }

      console.log("Sensor Data Stored Successfully in InfluxDB");

      //log result
      console.log("InfluxDB Write Result:", result);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "There was an error communication with the Influx server",
    });
  }

  // Log the successful storage of sensor data
  console.log("Sensor Data Successfully Stored in InfluxDB");
  res.status(200).json({ message: "Sensor Data Successfully Stored" });
}

/***************************************
 * Helper Function to validate sensor data
 * ************************************/
function validateSensorData(responseData) {
  const errors = [];

  // Check if responseData exists
  if (!responseData) {
    console.log("Error: No sensor data received in request body");
    errors.push("No sensor data received");
    return { isValid: false, errors };
  }

  // Check if responseData is an object
  if (typeof responseData !== "object") {
    console.log("Error: Invalid data format - expected object, received:", typeof responseData);
    errors.push("Invalid data format - expected JSON object");
    return { isValid: false, errors };
  }

  // Validate required fields based on the sample structure
  const requiredFields = ["deviceId", "sensorId", "sensorType", "timestamp", "values"];
  const missingFields = requiredFields.filter((field) => !(field in responseData));

  if (missingFields.length > 0) {
    console.log("Error: Missing required fields:", missingFields);
    errors.push(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Validate data types and values
  if (responseData.deviceId !== undefined) {
    if (typeof responseData.deviceId !== "string" || responseData.deviceId.trim() === "") {
      console.log("Error: Invalid deviceId - must be a non-empty string");
      errors.push("Invalid deviceId - must be a non-empty string");
    }
  }

  if (responseData.sensorId !== undefined) {
    if (typeof responseData.sensorId !== "string" || responseData.sensorId.trim() === "") {
      console.log("Error: Invalid sensorId - must be a non-empty string");
      errors.push("Invalid sensorId - must be a non-empty string");
    }
  }

  if (responseData.sensorType !== undefined) {
    if (typeof responseData.sensorType !== "string" || responseData.sensorType.trim() === "") {
      console.log("Error: Invalid sensorType - must be a non-empty string");
      errors.push("Invalid sensorType - must be a non-empty string");
    }
  }

  if (responseData.values !== undefined) {
    if (!Array.isArray(responseData.values) || responseData.values.length === 0) {
      console.log("Error: Invalid values - must be a non-empty array");
      errors.push("Invalid values - must be a non-empty array");
    } else {
      // Check if all values are numbers
      const invalidValues = responseData.values.filter(
        (value) => typeof value !== "number" || isNaN(value)
      );
      if (invalidValues.length > 0) {
        console.log("Error: Invalid sensor values - all values must be numbers:", invalidValues);
        errors.push("Invalid sensor values - all values must be numbers");
      }
    }
  }

  if (responseData.timestamp !== undefined) {
    if (typeof responseData.timestamp !== "number" || responseData.timestamp <= 0) {
      console.log("Error: Invalid timestamp - must be a positive number");
      errors.push("Invalid timestamp - must be a positive number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

// Export the functions
module.exports = {
  testconnection,
  storeSensorData,
  checkdeviceID,
  getDeviceStatus,
  updateDevicePing,
  getSensorStatus,
};
