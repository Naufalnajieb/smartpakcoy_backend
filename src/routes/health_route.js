import { Router } from "express";

import {
  getHealthHandler
} from "../handlers/health_handler.js";

const router = Router();

router.get("/", getHealthHandler);

export default router;