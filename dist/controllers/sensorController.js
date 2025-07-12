"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testconnection = testconnection;
exports.storeSensorData = storeSensorData;
exports.checkdeviceID = checkdeviceID;
exports.getDeviceStatus = getDeviceStatus;
exports.updateDevicePing = updateDevicePing;
exports.getSensorStatus = getSensorStatus;
const dbConnect_1 = __importDefault(require("../db/dbConnect"));
const influxConnect_1 = require("../db/influxConnect");
const influxdb_client_1 = require("@influxdata/influxdb-client");
function testconnection(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deviceID = req.query.deviceID;
            const deviceExists = yield checkdeviceID(deviceID);
            if (!deviceExists) {
                const result = yield addDevice(deviceID);
                if (result) {
                    console.log(deviceID + " added to the database");
                }
                else {
                    console.log("Failed to add device to the database");
                }
            }
            res.status(201).json({ message: "Connection to the GardenGuardian Network succesfull" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the server" });
        }
    });
}
function checkdeviceID(deviceID) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = "SELECT * FROM devices WHERE device_id = ?";
        const VALUES = [deviceID];
        const deviceExists = yield (0, dbConnect_1.default)(sql, VALUES);
        return deviceExists.length > 0 ? true : false;
    });
}
function addDevice(deviceID) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = "INSERT INTO devices (device_id) VALUES (?)";
        const VALUES = [deviceID];
        const result = yield (0, dbConnect_1.default)(sql, VALUES);
        return result;
    });
}
function updateDevicePing(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deviceID = req.query.deviceID;
            console.log("Ping Recieved From ", deviceID);
            const sql = "UPDATE devices SET last_ping = CURRENT_TIMESTAMP WHERE device_id = ?";
            const VALUES = [deviceID];
            const result = yield (0, dbConnect_1.default)(sql, VALUES);
            if (!result) {
                console.log("Failed to update the last ping timestamp");
            }
            res.status(201).json({ message: "Ping Recieved and Device Status Updated" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the server" });
        }
    });
}
function getDeviceStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const deviceID = req.headers.device_id;
        try {
            const sql = "SELECT last_ping FROM devices WHERE device_id = ?";
            const VALUES = [deviceID];
            const result = yield (0, dbConnect_1.default)(sql, VALUES);
            if (result.length === 0) {
                res.status(404).json({ message: "Device Not Found" });
            }
            const lastPing = result[0].last_ping;
            const currentTime = new Date();
            const timeDifference = currentTime.getTime() - lastPing.getTime();
            if (timeDifference > 90000) {
                res.status(201).json({
                    message: "Device is Offline",
                    status: "Offline",
                });
            }
            else {
                res.status(201).json({
                    message: "Device is Online",
                    status: "online",
                });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the Database" });
        }
    });
}
function getSensorStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const deviceID = req.headers.device_id;
        const query = `from(bucket: "sensorData")
    |> range(start: -100y)
    |> filter(fn: (r) => r.deviceName == "${deviceID}")
    |> group(columns: ["_measurement"])
    |> last()`;
        try {
            const resultData = yield (0, influxConnect_1.readDataFromInfluxDB)(query);
            const sensorData = [];
            resultData.forEach((sensor) => {
                const lastReading = new Date(sensor._time);
                let status = "Offline";
                const currentTime = new Date();
                const timeDifference = currentTime.getTime() - lastReading.getTime();
                if (timeDifference > 300000) {
                    status = "Offline";
                }
                else {
                    status = "Online";
                }
                sensorData.push({
                    sensor: sensor._measurement,
                    sensorStatus: status,
                });
            });
            res.status(200).json(sensorData);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the server" });
        }
    });
}
function storeSensorData(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const responseData = req.body;
        console.log("Test Connection Request Received");
        console.log("Response Data:", responseData);
        const validation = validateSensorData(responseData);
        if (!validation.isValid) {
            const errorResponse = {
                message: "Invalid sensor data",
                errors: validation.errors,
            };
            if (validation.missingFields) {
                errorResponse.missingFields = validation.missingFields;
            }
            return res.status(400).json(errorResponse);
        }
        const currentTime = new Date();
        const DeviceID = responseData.deviceId;
        const sensorName = responseData.sensorId;
        const sensorType = responseData.sensorType;
        const sensorStatus = responseData.status || "400";
        const unit = responseData.unit || "unknown";
        const sensorValues = responseData.values || [];
        const readTime = responseData.timestamp || currentTime;
        console.log("New Sensor Reading:");
        console.log("DeviceID:", DeviceID);
        try {
            const point = new influxdb_client_1.Point(sensorName)
                .tag("deviceName", DeviceID)
                .tag("sensor", sensorName)
                .tag("sensorType", sensorType)
                .tag("sensorStatus", String(sensorStatus))
                .tag("unit", unit);
            if (sensorValues.length === 1) {
                point.floatField("value", sensorValues[0]);
            }
            else {
                sensorValues.forEach((value, index) => {
                    point.floatField(`value_${index}`, value);
                });
            }
            const timestamp = typeof readTime === 'number' && readTime > 1000000 ? readTime : currentTime;
            point.timestamp(timestamp);
            (0, influxConnect_1.writeDataToInfluxDB)(point).then((result) => {
                if (!result) {
                    console.log("Failed to store the " + { reading: sensorName } + " in the database");
                    throw new Error("Failed to store the reading in the database");
                }
                console.log("Sensor Data Stored Successfully in InfluxDB");
                console.log("InfluxDB Write Result:", result);
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "There was an error communication with the Influx server",
            });
        }
        console.log("Sensor Data Successfully Stored in InfluxDB");
        res.status(200).json({ message: "Sensor Data Successfully Stored" });
    });
}
function validateSensorData(responseData) {
    const errors = [];
    if (!responseData) {
        console.log("Error: No sensor data received in request body");
        errors.push("No sensor data received");
        return { isValid: false, errors };
    }
    if (typeof responseData !== "object") {
        console.log("Error: Invalid data format - expected object, received:", typeof responseData);
        errors.push("Invalid data format - expected JSON object");
        return { isValid: false, errors };
    }
    const requiredFields = ["deviceId", "sensorId", "sensorType", "timestamp", "values", "status", "unit"];
    const missingFields = requiredFields.filter((field) => !(field in responseData));
    if (missingFields.length > 0) {
        console.log("Error: Missing required fields:", missingFields);
        errors.push(`Missing required fields: ${missingFields.join(", ")}`);
    }
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
        }
        else {
            const invalidValues = responseData.values.filter((value) => typeof value !== "number" || isNaN(value));
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
    if (responseData.status !== undefined) {
        if (typeof responseData.status !== "number") {
            console.log("Error: Invalid status - must be a number");
            errors.push("Invalid status - must be a number");
        }
    }
    if (responseData.unit !== undefined) {
        if (typeof responseData.unit !== "string") {
            console.log("Error: Invalid unit - must be a string");
            errors.push("Invalid unit - must be a string");
        }
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
    };
}
