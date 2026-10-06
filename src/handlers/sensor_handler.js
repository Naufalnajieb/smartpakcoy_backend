import {
  getLatestSensor,
  getSensorHistory
} from "../services/sensor_service.js";

export async function getLatestSensorHandler(req, res) {
  try {
    const { deviceId } = req.params;

    const data = await getLatestSensor(deviceId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No sensor data found"
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("GET LATEST SENSOR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve latest sensor data"
    });
  }
}

export async function getSensorHistoryHandler(req, res) {
  try {
    const { deviceId } = req.params;

    const requestedLimit = Number(req.query.limit) || 100;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      500
    );

    const data = await getSensorHistory(
      deviceId,
      limit
    );

    return res.json({
      success: true,
      data,
      meta: {
        count: data.length,
        limit
      }
    });
  } catch (error) {
    console.error("GET SENSOR HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sensor history"
    });
  }
}