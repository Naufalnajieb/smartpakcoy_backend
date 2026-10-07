import { env, database } from "../config/webconfig.js";

function getDeviceReference(deviceId) {
//   return database.ref(
//     `${env.firebase.dataRoot}/${deviceId}`
//   );
  return database.ref(deviceId);
}

export async function getLatestReading(deviceId) {
  const snapshot = await getDeviceReference(deviceId)
    .child("latest")
    .once("value");

  return snapshot.exists()
    ? snapshot.val()
    : null;
}

export async function getReadingHistory(deviceId, limit = 100) {
  const snapshot = await getDeviceReference(deviceId)
    .child("history")
    .orderByChild("timestamp")
    .limitToLast(limit)
    .once("value");

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data)
    .map(([id, value]) => ({
      id,
      ...value
    }))
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

export function listenLatestReading(deviceId, callback) {
  const reference = getDeviceReference(deviceId).child("latest");

  const listener = (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  };

  reference.on("value", listener);

  return () => {
    reference.off("value", listener);
  };
}

export async function getHistoryByRange(deviceId, startTimestamp, endTimestamp) {
  const snapshot = await getDeviceReference(deviceId)
    .child("history")
    .orderByChild("timestamp")
    .startAt(startTimestamp)
    .endAt(endTimestamp)
    .once("value");

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  return Object.entries(data)
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}