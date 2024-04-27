const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController");
const sensorDBFunctions = require("../controllers/sensorDBFunctions");

const userController = require("../controllers/userController");

// Routes to send Data from the GG device to the API/Databases
router.post("/sendData", sensorController.storeSensorData);

// Routes to retrieve sensor data from the InfuxDB
router.get("/readSensor/latest", sensorDBFunctions.getLastReading);
router.get("/readSensor/latest/all", sensorDBFunctions.getLastReadingAll);
router.get("/readSensor", sensorDBFunctions.getSensorReading);

// Define a GET route to test connection and perform setup tasks
router.get("/testconnection", sensorController.testconnection);

//Deine a GET route to retrieve device status
router.get("/status", sensorController.getDeviceStatus);
router.get(
  "/status/sensor",
  userController.verifyToken,
  sensorController.getSensorStatus
);

// Define a GET route to recieve a device ping
router.get("/ping", sensorController.updateDevicePing);

module.exports = router;
