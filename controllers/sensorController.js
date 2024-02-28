/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/
//const influx = require('../influx'); // Use the appropriate library for your database

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
  // Implement sensor data storage logic, e.g., write data to the database.
  try {
    // Database operation here
    console.log("Sending data to client");
    res
      .status(201)
      .json({ message: "Connection to the GardenGuardian Network succesfull" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Responce Failed" });
  }
}

// Export the functions
module.exports = {
  storeSensorData,
  sendDataToClient,
  testconnection,
};
