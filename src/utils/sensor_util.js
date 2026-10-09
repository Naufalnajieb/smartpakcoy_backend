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


const ALERT_RULES = {
  temperature: {
    enabled: true,
    label: "Suhu",
    unit: "°C",
    min: 20,
    max: 25,
    criticalMin: 15,
    criticalMax: 32
  },
  humidity: {
    enabled: true,
    label: "Kelembapan",
    unit: "%",
    min: 60,
    max: 80,
    criticalMin: null,
    criticalMax: null
  },
  lightIntensity: {
    enabled: false,
    label: "Intensitas Cahaya",
    unit: "lux",
    min: null,
    max: null,
    criticalMin: null,
    criticalMax: null
  }
};

function evaluateSensorAlert(sensorType, value) {
  const rule = ALERT_RULES[sensorType];

  if (!rule?.enabled || !Number.isFinite(Number(value))) {
    return null;
  }

  const numericValue = Number(value);

  if (rule.min !== null && numericValue < rule.min) {
    return {
      sensorType,
      message: `${rule.label} Rendah`,
      value: numericValue,
      unit: rule.unit,
      severity:
        rule.criticalMin !== null && numericValue < rule.criticalMin
          ? "critical"
          : "warning"
    };
  }

  if (rule.max !== null && numericValue > rule.max) {
    return {
      sensorType,
      message: `${rule.label} Tinggi`,
      value: numericValue,
      unit: rule.unit,
      severity:
        rule.criticalMax !== null && numericValue > rule.criticalMax
          ? "critical"
          : "warning"
    };
  }

  return null;
}

export function detectAlerts(history) {
  const alerts = [];
  const previousSeverity = {};

  for (const reading of history) {
    const sensors = [
      ["temperature", reading.temperature],
      ["humidity", reading.humidity],
      ["lightIntensity", reading.lightIntensity]
    ];

    for (const [sensorType, value] of sensors) {
      const result = evaluateSensorAlert(sensorType, value);
      const currentSeverity = result?.severity || "normal";

      if (
        result &&
        previousSeverity[sensorType] !== currentSeverity
      ) {
        alerts.push({
          id: `${reading.timestamp}-${sensorType}`,
          timestamp: reading.timestamp,
          ...result
        });
      }

      previousSeverity[sensorType] = currentSeverity;
    }
  }

  return alerts.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}