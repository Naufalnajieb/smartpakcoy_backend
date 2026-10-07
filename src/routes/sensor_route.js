import { Router } from "express";

import {
  getLatestSensorHandler,
  getSensorHistoryHandler,
  getSensorAnalyticsHandler
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

export default router;