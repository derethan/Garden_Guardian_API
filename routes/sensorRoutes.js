const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// Define sensor data routes
router.post('/store', sensorController.storeSensorData);

module.exports = router;
