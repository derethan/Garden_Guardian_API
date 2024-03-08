/***************************************
 *  Influx Database Connection
 *  - Used for storing sensor data and other time-series data
 * ************************************/
//import the InfluxConnection
const { InfluxDB } = require("@influxdata/influxdb-client");
require("dotenv").config();

const token = process.env.INFLUX_API;
const url = process.env.INFLUX_HOST;

let org = process.env.INFLUX_ORG;
let bucket = process.env.INFLUX_BUCKET;

//create connection to database
const InfluxClient = new InfluxDB({ url, token });

//Setup the Query API - Queries data from the database
const queryAPI = InfluxClient.getQueryApi(org);

//Setup the Write API - Writes data to the database
const writeApi = InfluxClient.getWriteApi(org, bucket, "s");

/***************************************
 *   Function to write data to InfluxDB
 * ************************************/
function writeDataToInfluxDB(point) {
  writeApi.writePoint(point);

 return writeApi
    .flush()
    .then(() => {
        //if successful
      return true;
    })
    .catch((e) => {
      console.error(e);
        return false;
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
} //end of readDataFromInfluxDB

//export connection
module.exports = { writeDataToInfluxDB, readDataFromInfluxDB };
