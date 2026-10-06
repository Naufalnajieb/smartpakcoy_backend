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