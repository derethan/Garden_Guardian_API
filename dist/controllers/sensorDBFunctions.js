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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastReadingAll = void 0;
exports.getLastReading = getLastReading;
exports.getSensorReading = getSensorReading;
const influxConnect_1 = require("../db/influxConnect");
function getLastReading(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const deviceID = req.query.device_id;
        const measurement = req.query.measurement;
        const query = `from(bucket: "sensorData")
      |> range(start: -100y)
      |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
      |> last()`;
        try {
            const resultData = yield (0, influxConnect_1.readDataFromInfluxDB)(query);
            const sensorValue = parseFloat(resultData[0]._value.toFixed(2));
            res.status(200).json({ value: sensorValue });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the server" });
        }
    });
}
const getLastReadingAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deviceID = req.query.device_id;
    const query = `from(bucket: "sensorData")
      |> range(start: -100y)
      |> filter(fn: (r) => r.deviceName == "${deviceID}")
      |> group(columns: ["_measurement"])
      |> last()`;
    try {
        const resultData = yield (0, influxConnect_1.readDataFromInfluxDB)(query);
        const sensorData = {};
        resultData.forEach((sensor) => {
            sensorData[sensor._measurement] = parseFloat(sensor._value.toFixed(2));
        });
        res.status(200).json(sensorData);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "There was an error communication with the server" });
    }
});
exports.getLastReadingAll = getLastReadingAll;
function getSensorReading(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const deviceID = req.query.device_id;
        const measurement = req.query.measurement;
        const duration = req.query.duration;
        const frequency = req.query.frequency;
        const query = `from(bucket: "sensorData")
    |> range(start: -${duration})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
    |> aggregateWindow(every: ${frequency}, fn: mean)
    `;
        try {
            const resultData = yield (0, influxConnect_1.readDataFromInfluxDB)(query);
            const sensorData = [];
            resultData.map((sensor) => {
                if (sensor._value) {
                    sensorData.push({
                        name: sensor._measurement,
                        time: sensor._time,
                        value: parseFloat(sensor._value.toFixed(2)),
                    });
                }
            });
            res.status(200).json(sensorData);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "There was an error communication with the server" });
        }
    });
}
