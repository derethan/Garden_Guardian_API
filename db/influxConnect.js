/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/
//import the InfluxConnection
const { InfluxDB } = require("@influxdata/influxdb-client");

const token =
  "W27HQvatOjRtq7wn7QRykCQoT0PTRU6aGE4i06IfsS9R_lkZhRmxO6fZSLsbso5p7gF3sr0G76OXP8q-c4fMfA==";
const url = "http://192.168.0.150:8086";

let org = "batech";
let bucket = "sensorData";

//create connection to database
const InfluxClient = new InfluxDB({ url, token });

//Setup the Query API - Queries data from the database
const queryAPI = InfluxClient.getQueryApi(org);

//Setup the Write API - Writes data to the database
const writeApi = InfluxClient.getWriteApi(org, bucket, "ns");

/***************************************
 *   Function to write data to InfluxDB
 * ************************************/
function writeDataToInfluxDB(point) {
  writeApi.writePoint(point);

  writeApi
    .close()
    .then(() => {
      console.log("Write complete");
    })
    .catch((e) => {
      console.error(e);
      console.log("\\nFinished ERROR");
    });
}

/***************************************
 *   Function to read data from InfluxDB
 * ************************************/

function readDataFromInfluxDB(query) {
  let data = [];

  return new Promise((resolve, reject) => {
    queryAPI.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(data);
      },
    });
  });
} //end of readDataFromInfluxDB

//export connection
module.exports = { writeDataToInfluxDB, readDataFromInfluxDB };
