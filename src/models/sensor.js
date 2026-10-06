export class SensorReading {
  constructor({
    deviceId,
    temperature,
    humidity,
    lightIntensity,
    timestamp
  }) {
    this.deviceId = deviceId;
    this.temperature = temperature;
    this.humidity = humidity;
    this.lightIntensity = lightIntensity;
    this.timestamp = timestamp;
  }
}