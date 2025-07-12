"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDataToInfluxDB = writeDataToInfluxDB;
exports.readDataFromInfluxDB = readDataFromInfluxDB;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const token = process.env.INFLUX_API;
const url = process.env.INFLUX_HOST;
let org = process.env.INFLUX_ORG;
let bucket = process.env.INFLUX_BUCKET;
const InfluxClient = new influxdb_client_1.InfluxDB({ url, token });
const queryAPI = InfluxClient.getQueryApi(org);
const writeApi = InfluxClient.getWriteApi(org, bucket, "s");
function writeDataToInfluxDB(point) {
    writeApi.writePoint(point);
    return writeApi
        .flush()
        .then(() => {
        return true;
    })
        .catch((e) => {
        console.error(e);
        return false;
    });
}
function readDataFromInfluxDB(query) {
    let data = [];
    return new Promise((resolve, reject) => {
        queryAPI.queryRows(query, {
            next(row, tableMeta) {
                const results = tableMeta.toObject(row);
                data.push(results);
            },
            error(error) {
                reject(error);
            },
            complete() {
                resolve(data);
            },
        });
    });
}
