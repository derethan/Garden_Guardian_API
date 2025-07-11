import { Request, Response } from 'express';
import { readDataFromInfluxDB } from "../db/influxConnect";

async function getLastReading(req: Request, res: Response) {
  const deviceID: string = req.query.device_id as string;
  const measurement: string = req.query.measurement as string;

  const query: string = `from(bucket: "sensorData")
      |> range(start: -100y)
      |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
      |> last()`;

  try {
    const resultData: any[] = await readDataFromInfluxDB(query);
    const sensorValue: number = parseFloat(resultData[0]._value.toFixed(2));

    res.status(200).json({ value: sensorValue });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

const getLastReadingAll = async (req: Request, res: Response) => {
  const deviceID: string = req.query.device_id as string;

  const query: string = `from(bucket: "sensorData")
      |> range(start: -100y)
      |> filter(fn: (r) => r.deviceName == "${deviceID}")
      |> group(columns: ["_measurement"])
      |> last()`;

  try {
    const resultData: any[] = await readDataFromInfluxDB(query);

    const sensorData: { [key: string]: number } = {};
    resultData.forEach((sensor: any) => {
      sensorData[sensor._measurement] = parseFloat(sensor._value.toFixed(2));
    });

    res.status(200).json(sensorData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
};

async function getSensorReading(req: Request, res: Response) {
  const deviceID: string = req.query.device_id as string;
  const measurement: string = req.query.measurement as string;
  const duration: string = req.query.duration as string;
  const frequency: string = req.query.frequency as string;

  const query: string = `from(bucket: "sensorData")
    |> range(start: -${duration})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r.deviceName == "${deviceID}")
    |> aggregateWindow(every: ${frequency}, fn: mean)
    `;

  try {
    const resultData: any[] = await readDataFromInfluxDB(query);
    const sensorData: any[] = [];

    resultData.map((sensor: any) => {
      if (sensor._value) {
        sensorData.push({
          name: sensor._measurement,
          time: sensor._time,
          value: parseFloat(sensor._value.toFixed(2)),
        });
      }
    });

    res.status(200).json(sensorData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

export {
  getLastReading,
  getLastReadingAll,
  getSensorReading,
};