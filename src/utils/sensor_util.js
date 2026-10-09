export function toNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid sensor value for field: ${fieldName}`);
  }

  return number;
}

export function normalizeTimestamp(timestamp) {
  if (timestamp === undefined || timestamp === null) {
    return new Date().toISOString();
  }

  const numericTimestamp = Number(timestamp);

  if (Number.isFinite(numericTimestamp)) {
    // Jika timestamp berasal dari Unix seconds.
    if (numericTimestamp < 1_000_000_000_000) {
      return new Date(numericTimestamp * 1000).toISOString();
    }

    // Jika timestamp berasal dari Unix milliseconds.
    return new Date(numericTimestamp).toISOString();
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp");
  }

  return date.toISOString();
}

export function calculateAverage(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateTrend(values) {
  if (values.length < 2) return "stable";

  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const firstAverage = calculateAverage(firstHalf);
  const secondAverage = calculateAverage(secondHalf);

  if (firstAverage === null || secondAverage === null || firstAverage === 0) {
    return "stable";
  }

  const change = (secondAverage - firstAverage) / Math.abs(firstAverage);

  if (change > 0.02) return "increasing";
  if (change < -0.02) return "decreasing";

  return "stable";
}

export function calculateSensorStats(history, sensorField) {
  const values = history
    .map((item) => Number(item[sensorField]))
    .filter(Number.isFinite);

  if (!values.length) {
    return {
      average: null,
      min: null,
      max: null,
      trend: "no-data"
    };
  }

  const min = values.reduce((currentMin, value) =>
    Math.min(currentMin, value)
  );

  const max = values.reduce((currentMax, value) =>
    Math.max(currentMax, value)
  );

  return {
    average: calculateAverage(values),
    min,
    max,
    trend: calculateTrend(values)
  };
}
export function aggregateHistoryByMinute(history) {
  const buckets = new Map();

  for (const item of history) {
    const timestamp = new Date(item.timestamp).getTime();
    if (!Number.isFinite(timestamp)) continue;

    const minuteTimestamp = Math.floor(timestamp / 60000) * 60000;
    const current = buckets.get(minuteTimestamp) || {
      timestamp: new Date(minuteTimestamp).toISOString(),
      temperature: [],
      humidity: [],
      lightIntensity: []
    };

    if (Number.isFinite(Number(item.temperature))) {
      current.temperature.push(Number(item.temperature));
    }

    if (Number.isFinite(Number(item.humidity))) {
      current.humidity.push(Number(item.humidity));
    }

    if (Number.isFinite(Number(item.lightIntensity))) {
      current.lightIntensity.push(Number(item.lightIntensity));
    }

    buckets.set(minuteTimestamp, current);
  }

  const average = (values) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  return [...buckets.values()]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((item) => ({
      timestamp: item.timestamp,
      temperature: average(item.temperature),
      humidity: average(item.humidity),
      lightIntensity: average(item.lightIntensity)
    }));
}

const DEVICE_ACTIVE_MS = 15 * 1000;
const DEVICE_DELAYED_MS = 60 * 1000;

export function getTelemetryStatus(timestamp) {
  const timestampMs = new Date(timestamp).getTime();

  if (!Number.isFinite(timestampMs)) {
    return "no-data";
  }

  const age = Date.now() - timestampMs;

  if (age <= DEVICE_ACTIVE_MS) {
    return "active";
  }

  if (age <= DEVICE_DELAYED_MS) {
    return "delayed";
  }

  return "no-data";
}

export function calculateDeviceStatus({
  timestamp,
  temperature,
  humidity,
  lightIntensity
}) {
  const telemetryStatus = getTelemetryStatus(timestamp);

  return {
    esp32: telemetryStatus,
    dht11: Number.isFinite(Number(temperature))
      ? telemetryStatus
      : "no-data",
    bh1750: Number.isFinite(Number(lightIntensity))
      ? telemetryStatus
      : "no-data"
  };
}