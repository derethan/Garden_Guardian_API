/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/
//const influx = require('../influx'); // Use the appropriate library for your database



/***************************************
 *  Define function below to handle the routed requests
 * 
 *  Each function requires the corresponding route in the sensorRoutes.js file
 *      - router.post('/store', sensorController.storeSensorData);
 *
 *  
 *  Below are Sample functions to handle the routed requests 
 * ************************************/

async function storeSensorData(req, res) {
  // Implement sensor data storage logic, e.g., write data to the database.

  //Store data from post request
  const data = req.body;
  console.log(data);

  try {
    // Database operation here
    res.status(201).json({ message: 'Sensor data stored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Data storage failed' });
  }
}


async function sendDataToClient (req, res) {
  // Implement sensor data storage logic, e.g., write data to the database.

}

async function testconnection (req, res) {
  // Implement sensor data storage logic, e.g., write data to the database.
  try {
    // Database operation here
    console.log('Sending data to client');
    res.status(201).json({ message: 'Connection to the GardenGuardian Network succesfull' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Responce Failed' });
  }
}



// Export the functions
module.exports = {
  storeSensorData,
  sendDataToClient,
  testconnection
};
