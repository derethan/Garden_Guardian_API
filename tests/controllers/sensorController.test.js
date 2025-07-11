
const { storeSensorData } = require('../../controllers/sensorController');
const influx = require('../../db/influxConnect');

jest.mock('../../db/influxConnect', () => ({
  writeDataToInfluxDB: jest.fn().mockResolvedValue(true),
}));

describe('storeSensorData', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        deviceId: 'GG-TH-A9C5ECF3',
        sensorId: 'Humidity-A9C5ECF3',
        sensorType: 'Humidity',
        status: 200,
        unit: '%',
        timestamp: 1752015565,
        values: [66.5],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should store sensor data successfully with the new structure', async () => {
    await storeSensorData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Sensor Data Successfully Stored' });
    expect(influx.writeDataToInfluxDB).toHaveBeenCalledTimes(1);
  });

  it('should return a 400 error for invalid sensor data', async () => {
    req.body = {}; // Invalid data

    await storeSensorData(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid sensor data',
    }));
    expect(influx.writeDataToInfluxDB).not.toHaveBeenCalled();
  });
});
