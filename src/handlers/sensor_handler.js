import {getLatestSensor,getSensorHistory, getSensorAnalytics, getSensorAlerts} from "../services/sensor_service.js";

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

export async function getSensorAnalyticsHandler(req, res) {
  try {
    const { deviceId } = req.params;
    const { start, end, period } = req.query;

    const hasCustomRange = start !== undefined || end !== undefined;

    if (hasCustomRange && (start === undefined || end === undefined)) {
      return res.status(400).json({
        success: false,
        message: "Both start and end timestamps are required."
      });
    }

    const startTimestamp = hasCustomRange ? Number(start) : undefined;
    const endTimestamp = hasCustomRange ? Number(end) : undefined;

    const data = await getSensorAnalytics(deviceId, {
      startTimestamp,
      endTimestamp,
      period: period || "24h"
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("GET SENSOR ANALYTICS ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function getSensorAlertsHandler(req, res) {
  try {
    const { deviceId } = req.params;
    const { start, end } = req.query;

    const hasCustomRange =
      start !== undefined || end !== undefined;

    if (
      hasCustomRange &&
      (start === undefined || end === undefined)
    ) {
      return res.status(400).json({
        success: false,
        message: "Both start and end timestamps are required."
      });
    }

    const data = await getSensorAlerts(deviceId, {
      startTimestamp: hasCustomRange ? Number(start) : undefined,
      endTimestamp: hasCustomRange ? Number(end) : undefined
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("GET SENSOR ALERTS ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}