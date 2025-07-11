import { Router } from "express";
import { testconnection, storeSensorData, getDeviceStatus, updateDevicePing, getSensorStatus } from "../controllers/sensorController";
import { getLastReading, getLastReadingAll, getSensorReading } from "../controllers/sensorDBFunctions";
import { verifyToken } from "../controllers/userController";

const router = Router();

router.post("/sendData", storeSensorData);

router.get("/readSensor/latest", getLastReading);
router.get("/readSensor/latest/all", getLastReadingAll);
router.get("/readSensor", getSensorReading);

router.get("/testconnection", testconnection);

router.get("/status", getDeviceStatus);
router.get(
  "/status/sensor",
  verifyToken,
  getSensorStatus
);

router.get("/ping", updateDevicePing);

export default router;