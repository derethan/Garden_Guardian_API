const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const sensorDBFunctions = require('../controllers/sensorDBFunctions');

// Define sensor data routes
router.post('/sendData', sensorController.storeSensorData);


// Define routes to retrieve sensor data
router.get('/readSensor/latest', sensorDBFunctions.getLastReading);
router.get('/readSensor/all', sensorDBFunctions.getLastReadingAll);

// Define a GET route to test connection and perform setup tasks
router.get('/testconnection', sensorController.testconnection);

//Deine a GET route to retrieve device status
router.get('/status', sensorController.getDeviceStatus);

// Define a GET route to recieve a device ping
router.get('/ping', sensorController.updateDevicePing);


module.exports = router;
