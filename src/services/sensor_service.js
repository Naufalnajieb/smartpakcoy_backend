import {
  getLatestReading,
  getReadingHistory,
  listenLatestReading,
  getHistoryByRange } from "../repositories/db_sensor.js";
import {
  toNumber,
  normalizeTimestamp,
  calculateSensorStats,
  aggregateHistoryByMinute, 
  calculateDeviceStatus, 
  detectAlerts } from "../utils/sensor_util.js";
import {SensorReading } from "../models/sensor.js";

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
  const reading = mapReading(deviceId, raw);

  if (!reading) return null;

  return {
    ...reading,
    deviceStatus: calculateDeviceStatus(reading)
  };
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

export function subscribeLatestSensor(deviceId, callback) {
  return listenLatestReading(deviceId, (raw) => {
    const reading = mapReading(deviceId, raw);

    if (!reading) {
      callback(null);
      return;
    }

    callback({
      ...reading,
      deviceStatus: calculateDeviceStatus(reading)
    });
  });
}

export async function getSensorAnalytics(
  deviceId,
  { startTimestamp, endTimestamp, period = "24h" } = {}
) {
  let start = startTimestamp;
  let end = endTimestamp;

  if (start == null || end == null) {
    const durations = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };

    const duration = durations[period];

    if (!duration) {
      throw new Error("Invalid analytics period");
    }

    end = Date.now();
    start = end - duration;
  }

  if (!Number.isFinite(Number(start)) || !Number.isFinite(Number(end))) {
    throw new Error("Invalid analytics timestamp range");
  }

  if (end <= start) {
    throw new Error("End timestamp must be greater than start timestamp");
  }

  if (end - start > 24 * 60 * 60 * 1000) {
    throw new Error("Analytics range cannot exceed 24 hours");
  }

  const rawHistory = await getHistoryByRange(
    deviceId,
    start,
    end
  );

  const normalizedHistory = rawHistory.map((item) => ({
    id: item.id,
    ...mapReading(deviceId, item)
  }));

  const statistics = {
    temperature: calculateSensorStats(
      normalizedHistory,
      "temperature"
    ),
    humidity: calculateSensorStats(
      normalizedHistory,
      "humidity"
    ),
    lightIntensity: calculateSensorStats(
      normalizedHistory,
      "lightIntensity"
    )
  };

  const history = aggregateHistoryByMinute(
    normalizedHistory
  );

  return {
    period,
    startTimestamp: new Date(start).toISOString(),
    endTimestamp: new Date(end).toISOString(),
    count: normalizedHistory.length,
    history,
    statistics
  };
}

export async function getSensorAlerts(
  deviceId,
  { startTimestamp, endTimestamp } = {}
) {
  let start = startTimestamp;
  let end = endTimestamp;

  if (start == null || end == null) {
    end = Date.now();
    start = end - 24 * 60 * 60 * 1000;
  }

  if (
    !Number.isFinite(Number(start)) ||
    !Number.isFinite(Number(end))
  ) {
    throw new Error("Invalid alert timestamp range");
  }

  if (end <= start) {
    throw new Error("End timestamp must be greater than start timestamp");
  }

  if (end - start > 24 * 60 * 60 * 1000) {
    throw new Error("Alert range cannot exceed 24 hours");
  }

  const rawHistory = await getHistoryByRange(
    deviceId,
    start,
    end
  );

  const normalizedHistory = rawHistory.map((item) => ({
    id: item.id,
    ...mapReading(deviceId, item)
  }));

  const minuteHistory = aggregateHistoryByMinute(
    normalizedHistory
  );

  const alerts = detectAlerts(minuteHistory);

  return {
    startTimestamp: new Date(start).toISOString(),
    endTimestamp: new Date(end).toISOString(),
    count: alerts.length,
    alerts
  };
}