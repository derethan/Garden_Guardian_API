import { Request, Response } from 'express';
import dbQueryPromise from "../db/dbConnect";
import { writeDataToInfluxDB, readDataFromInfluxDB } from "../db/influxConnect";
import { Point } from "@influxdata/influxdb-client";

interface SensorData {
  deviceId: string;
  sensorId: string;
  sensorType: string;
  status: number;
  unit: string;
  timestamp: number;
  values: number[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields?: string[];
}

async function testconnection(req: Request, res: Response) {
  try {
    let deviceID: string = req.query.deviceID as string;

    const deviceExists: boolean = await checkdeviceID(deviceID);

    if (!deviceExists) {
      const result = await addDevice(deviceID);
      if (result) {
        console.log(deviceID + " added to the database");
      } else {
        console.log("Failed to add device to the database");
      }
    }

    res.status(201).json({ message: "Connection to the GardenGuardian Network succesfull" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

async function checkdeviceID(deviceID: string): Promise<boolean> {
  const sql: string = "SELECT * FROM devices WHERE device_id = ?";
  const VALUES: string[] = [deviceID];

  const deviceExists: any[] = await dbQueryPromise(sql, VALUES);

  return deviceExists.length > 0 ? true : false;
}

async function addDevice(deviceID: string): Promise<any> {
  const sql: string = "INSERT INTO devices (device_id) VALUES (?)";
  const VALUES: string[] = [deviceID];

  const result: any = await dbQueryPromise(sql, VALUES);

  return result;
}

async function updateDevicePing(req: Request, res: Response) {
  try {
    const deviceID: string = req.query.deviceID as string;
    console.log("Ping Recieved From ", deviceID);

    const sql: string = "UPDATE devices SET last_ping = CURRENT_TIMESTAMP WHERE device_id = ?";
    const VALUES: string[] = [deviceID];

    const result: any = await dbQueryPromise(sql, VALUES);

    if (!result) {
      console.log("Failed to update the last ping timestamp");
    }

    res.status(201).json({ message: "Ping Recieved and Device Status Updated" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

async function getDeviceStatus(req: Request, res: Response) {
  const deviceID: string = req.headers.device_id as string;

  try {
    const sql: string = "SELECT last_ping FROM devices WHERE device_id = ?";
    const VALUES: string[] = [deviceID];

    const result: any[] = await dbQueryPromise(sql, VALUES);

    if (result.length === 0) {
      res.status(404).json({ message: "Device Not Found" });
    }

    const lastPing: Date = result[0].last_ping;

    const currentTime: Date = new Date();

    const timeDifference: number = currentTime.getTime() - lastPing.getTime();

    if (timeDifference > 90000) {
      res.status(201).json({
        message: "Device is Offline",
        status: "Offline",
      });
    } else {
      res.status(201).json({
        message: "Device is Online",
        status: "online",
      });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the Database" });
  }
}

async function getSensorStatus(req: Request, res: Response) {
  const deviceID: string = req.headers.device_id as string;

  const query: string = `from(bucket: "sensorData")
    |> range(start: -100y)
    |> filter(fn: (r) => r.deviceName == "${deviceID}")
    |> group(columns: ["_measurement"])
    |> last()`;

  try {
    const resultData: any[] = await readDataFromInfluxDB(query);

    const sensorData: any[] = [];
    resultData.forEach((sensor: any) => {
      const lastReading: Date = new Date(sensor._time);
      let status: string = "Offline";

      const currentTime: Date = new Date();
      const timeDifference: number = currentTime.getTime() - lastReading.getTime();

      if (timeDifference > 300000) {
        status = "Offline";
      } else {
        status = "Online";
      }

      sensorData.push({
        sensor: sensor._measurement,
        sensorStatus: status,
      });
    });

    res.status(200).json(sensorData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "There was an error communication with the server" });
  }
}

async function storeSensorData(req: Request, res: Response) {
  const responseData: SensorData = req.body;

  console.log("Test Connection Request Received");
  console.log("Response Data:", responseData);

  const validation: ValidationResult = validateSensorData(responseData);

  if (!validation.isValid) {
    const errorResponse: {
      message: string;
      errors: string[];
      missingFields?: any;
    } = {
      message: "Invalid sensor data",
      errors: validation.errors,
    };

    if (validation.missingFields) {
      errorResponse.missingFields = validation.missingFields;
    }

    return res.status(400).json(errorResponse);
  }

  const currentTime: Date = new Date();

  const DeviceID: string = responseData.deviceId;
  const sensorName: string = responseData.sensorId;
  const sensorType: string = responseData.sensorType;
  const sensorStatus: number | string = responseData.status || "400";
  const unit: string = responseData.unit || "unknown";
  const sensorValues: number[] = responseData.values || [];
  const readTime: number | Date = responseData.timestamp || currentTime;

  console.log("New Sensor Reading:");
  console.log("DeviceID:", DeviceID);

  try {
    const point = new Point(sensorName)
      .tag("deviceName", DeviceID)
      .tag("sensor", sensorName)
      .tag("sensorType", sensorType)
      .tag("sensorStatus", String(sensorStatus))
      .tag("unit", unit);

    if (sensorValues.length === 1) {
      point.floatField("value", sensorValues[0]);
    } else {
      sensorValues.forEach((value, index) => {
        point.floatField(`value_${index}`, value);
      });
    }

    const timestamp = typeof readTime === 'number' && readTime > 1000000 ? readTime : currentTime;
    point.timestamp(timestamp);

    writeDataToInfluxDB(point).then((result: any) => {
      if (!result) {
        console.log("Failed to store the " + { reading: sensorName } + " in the database");
        throw new Error("Failed to store the reading in the database");
      }

      console.log("Sensor Data Stored Successfully in InfluxDB");
      console.log("InfluxDB Write Result:", result);
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "There was an error communication with the Influx server",
    });
  }

  console.log("Sensor Data Successfully Stored in InfluxDB");
  res.status(200).json({ message: "Sensor Data Successfully Stored" });
}

function validateSensorData(responseData: SensorData): ValidationResult {
  const errors: string[] = [];

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

  const requiredFields: string[] = ["deviceId", "sensorId", "sensorType", "timestamp", "values", "status", "unit"];
  const missingFields: string[] = requiredFields.filter((field) => !(field in responseData));

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
    } else {
      const invalidValues: any[] = responseData.values.filter(
        (value: any) => typeof value !== "number" || isNaN(value)
      );
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

export {
  testconnection,
  storeSensorData,
  checkdeviceID,
  getDeviceStatus,
  updateDevicePing,
  getSensorStatus,
};
