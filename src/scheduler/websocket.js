import {
  getLatestSensor,
  subscribeLatestSensor
} from "../services/sensor_service.js";

import { env } from "../config/webconfig.js";

export function initializeSensorSocket(io) {
  io.on("connection", async (socket) => {
    console.log(
      `Socket connected: ${socket.id}`
    );

    try {
      const latest = await getLatestSensor(
        env.firebase.deviceId
      );

      if (latest) {
        socket.emit(
          "sensor:latest",
          latest
        );
      }
    } catch (error) {
      console.error(
        "INITIAL SENSOR SOCKET ERROR:",
        error
      );
    }

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id}`,
        reason
      );
    });
  });

  const unsubscribe = subscribeLatestSensor(
    env.firebase.deviceId,
    (reading) => {
      if (!reading) {
        return;
      }

      io.emit(
        "sensor:update",
        reading
      );
    }
  );

  return unsubscribe;
}