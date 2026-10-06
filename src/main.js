import express from "express";
import cors from "cors";
import { createServer } from "node:http";

import { Server } from "socket.io";
import { env } from "./config/webconfig.js";
import sensorRoute from "./routes/sensor_route.js";
import healthRoute from "./routes/health_route.js";
import { initializeSensorSocket } from "./scheduler/websocket.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: env.corsOrigin
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Pakcoy Backend is running"
  });
});

app.use(
  "/api/health",
  healthRoute
);

app.use(
  "/api/sensors",
  sensorRoute
);

const unsubscribeSensorListener =
  initializeSensorSocket(io);

httpServer.listen(
  env.port,
  () => {
    console.log(`
========================================
 Smart Pakcoy Backend
========================================
 Environment : ${env.nodeEnv}
 Port        : ${env.port}
 URL         : http://localhost:${env.port}
 Device      : ${env.firebase.deviceId}
========================================
    `);
  }
);

function shutdown() {
  console.log("Shutting down server...");

  unsubscribeSensorListener();

  io.close();

  httpServer.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);