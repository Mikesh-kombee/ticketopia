import { db } from "./server";
import { Geofence, GeofenceLog } from "../types";

// Geofence Management
export async function createGeofence(
  geofence: Omit<Geofence, "id" | "createdAt" | "updatedAt">
) {
  const geofenceRef = db.collection("geofences").doc();
  const now = new Date().toISOString();

  const newGeofence: Geofence = {
    ...geofence,
    id: geofenceRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await geofenceRef.set(newGeofence);
  return newGeofence;
}

export async function updateGeofence(
  id: string,
  updates: Partial<Omit<Geofence, "id" | "createdAt" | "createdBy">>
) {
  const geofenceRef = db.collection("geofences").doc(id);
  const now = new Date().toISOString();

  await geofenceRef.update({
    ...updates,
    updatedAt: now,
  });

  const updatedDoc = await geofenceRef.get();
  return updatedDoc.data() as Geofence;
}

export async function deleteGeofence(id: string) {
  await db.collection("geofences").doc(id).delete();
}

export async function getGeofences() {
  const snapshot = await db.collection("geofences").get();
  return snapshot.docs.map((doc) => doc.data() as Geofence);
}

export async function getGeofenceById(id: string) {
  const doc = await db.collection("geofences").doc(id).get();
  return doc.data() as Geofence;
}

// Geofence Logging
export async function logGeofenceEvent(log: Omit<GeofenceLog, "id">) {
  const logRef = db.collection("geofenceLogs").doc();
  const newLog: GeofenceLog = {
    ...log,
    id: logRef.id,
  };

  await logRef.set(newLog);
  return newLog;
}

export async function getGeofenceLogs(engineerId: string, date: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection("geofenceLogs")
    .where("engineerId", "==", engineerId)
    .where("timestamp", ">=", startOfDay.toISOString())
    .where("timestamp", "<=", endOfDay.toISOString())
    .get();

  return snapshot.docs.map((doc) => doc.data() as GeofenceLog);
}
