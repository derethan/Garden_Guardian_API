import { InfluxDB, Point, WriteApi, QueryApi } from "@influxdata/influxdb-client";
import * as dotenv from "dotenv";

dotenv.config();

const token: string = process.env.INFLUX_API as string;
const url: string = process.env.INFLUX_HOST as string;

let org: string = process.env.INFLUX_ORG as string;
let bucket: string = process.env.INFLUX_BUCKET as string;

const InfluxClient: InfluxDB = new InfluxDB({ url, token });

const queryAPI: QueryApi = InfluxClient.getQueryApi(org);

const writeApi: WriteApi = InfluxClient.getWriteApi(org, bucket, "s");

function writeDataToInfluxDB(point: Point): Promise<boolean> {
  writeApi.writePoint(point);

  return writeApi
    .flush()
    .then(() => {
      return true;
    })
    .catch((e: Error) => {
      console.error(e);
      return false;
    });
}

function readDataFromInfluxDB(query: string): Promise<any[]> {
  let data: any[] = [];

  return new Promise((resolve, reject) => {
    queryAPI.queryRows(query, {
      next(row: string[], tableMeta: any) {
        const results: any = tableMeta.toObject(row);
        data.push(results);
      },
      error(error: Error) {
        reject(error);
      },
      complete() {
        resolve(data);
      },
    });
  });
}

export { writeDataToInfluxDB, readDataFromInfluxDB };