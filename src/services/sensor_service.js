import {
  getLatestReading,
  getReadingHistory,
  listenLatestReading
} from "../repositories/db_sensor.js";

import { SensorReading } from "../models/sensor.js";
import {
  toNumber,
  normalizeTimestamp
} from "../utils/sensor_util.js";

function mapReading(deviceId, raw) {
  if (!raw) {
    return null;
  }

  return new SensorReading({
    deviceId,

    temperature: toNumber(
      raw.temperature,
      "temperature"
    ),

    humidity: toNumber(
      raw.humidity,
      "humidity"
    ),

    lightIntensity: toNumber(
      raw.lux,
      "lightIntensity"
    ),

    timestamp: normalizeTimestamp(
      raw.timestamp
    )
  });
}

export async function getLatestSensor(deviceId) {
  const raw = await getLatestReading(deviceId);

  return mapReading(deviceId, raw);
}

export async function getSensorHistory(deviceId, limit) {
  const rawHistory = await getReadingHistory(
    deviceId,
    limit
  );

  return rawHistory.map((item) => ({
    id: item.id,
    ...mapReading(deviceId, item)
  }));
}

export function subscribeLatestSensor(
  deviceId,
  callback
) {
  return listenLatestReading(deviceId, (raw) => {
    const reading = mapReading(deviceId, raw);

    callback(reading);
  });
}