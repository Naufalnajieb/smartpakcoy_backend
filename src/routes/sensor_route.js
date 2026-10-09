import { Router } from "express";

import {
  getLatestSensorHandler,
  getSensorHistoryHandler,
  getSensorAnalyticsHandler,
  getSensorAlertsHandler
} from "../handlers/sensor_handler.js";

const router = Router();

router.get(
  "/:deviceId/latest",
  getLatestSensorHandler
);

router.get(
  "/:deviceId/history",
  getSensorHistoryHandler
);

router.get(
  "/:deviceId/analytics",
  getSensorAnalyticsHandler
);

router.get(
  "/:deviceId/alerts",
  getSensorAlertsHandler
);

export default router;