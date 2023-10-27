const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// Define sensor data routes
router.post('/store', sensorController.storeSensorData);

// Define a GET route to retrieve sensor data
router.get('/retrieve', sensorController.sendDataToClient);

module.exports = router;
