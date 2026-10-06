import { Router } from "express";

import {
  getLatestSensorHandler,
  getSensorHistoryHandler
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

export default router;