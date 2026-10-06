import dotenv from "dotenv";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

dotenv.config();

const requiredEnv = [
  "FIREBASE_DATABASE_URL",
  "GOOGLE_APPLICATION_CREDENTIALS"
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
export const env = {
  port: Number(process.env.PORT) || 3000,

  nodeEnv: process.env.NODE_ENV || "development",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  firebase: {
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
    deviceId: process.env.FIREBASE_DEVICE_ID || "greenhouse",
    dataRoot: process.env.FIREBASE_DATA_ROOT || "greenhouse",
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
};

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  databaseURL: env.firebase.databaseUrl
});
const database = getDatabase(firebaseApp);
export {firebaseApp, database};