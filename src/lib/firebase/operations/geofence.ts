import { db } from "../server";
import type { Geofence, GeofenceLog } from "@/lib/types";
import { handleFirestoreError } from "../utils/error-handler";

export async function createGeofence(
  geofence: Omit<Geofence, "id" | "createdAt" | "updatedAt">
): Promise<Geofence> {
  return handleFirestoreError(async () => {
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
  }, "Error creating geofence");
}

export async function updateGeofence(
  id: string,
  updates: Partial<Omit<Geofence, "id" | "createdAt" | "createdBy">>
): Promise<Geofence> {
  return handleFirestoreError(async () => {
    const geofenceRef = db.collection("geofences").doc(id);
    const now = new Date().toISOString();

    await geofenceRef.update({
      ...updates,
      updatedAt: now,
    });

    const updatedDoc = await geofenceRef.get();
    return updatedDoc.data() as Geofence;
  }, `Error updating geofence ${id}`);
}

export async function deleteGeofence(id: string): Promise<void> {
  return handleFirestoreError(async () => {
    await db.collection("geofences").doc(id).delete();
  }, `Error deleting geofence ${id}`);
}

export async function getGeofences(): Promise<Geofence[]> {
  return handleFirestoreError(async () => {
    const snapshot = await db.collection("geofences").get();
    return snapshot.docs.map((doc) => doc.data() as Geofence);
  }, "Error fetching geofences");
}

export async function getGeofenceById(id: string): Promise<Geofence | null> {
  return handleFirestoreError(async () => {
    const doc = await db.collection("geofences").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Geofence;
  }, `Error fetching geofence ${id}`);
}

export async function logGeofenceEvent(
  log: Omit<GeofenceLog, "id">
): Promise<GeofenceLog> {
  return handleFirestoreError(async () => {
    const logRef = db.collection("geofenceLogs").doc();
    const newLog: GeofenceLog = {
      ...log,
      id: logRef.id,
    };

    await logRef.set(newLog);
    return newLog;
  }, "Error logging geofence event");
}

export async function getGeofenceLogs(
  engineerId: string,
  date: string
): Promise<GeofenceLog[]> {
  return handleFirestoreError(async () => {
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
  }, `Error fetching geofence logs for engineer ${engineerId} on ${date}`);
}
