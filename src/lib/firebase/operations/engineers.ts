import { db } from "../server";
import type { Engineer } from "@/lib/types";
import { handleFirestoreError } from "../utils/error-handler";

export async function getAllEngineers(): Promise<Engineer[]> {
  return handleFirestoreError(async () => {
    const snapshot = await db.collection("engineers").get();
    return snapshot.docs.map((doc) => doc.data() as Engineer);
  }, "Error fetching engineers");
}

export async function getEngineerById(id: string): Promise<Engineer | null> {
  return handleFirestoreError(async () => {
    const doc = await db.collection("engineers").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Engineer;
  }, `Error fetching engineer ${id}`);
}

export async function updateEngineerLocation(
  id: string,
  location: { lat: number; lng: number }
): Promise<boolean> {
  return handleFirestoreError(async () => {
    await db.collection("engineers").doc(id).update({
      location,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }, `Error updating engineer location ${id}`);
}
