import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import type { GeoFenceSite } from "@/lib/types";

export async function addGeoFenceSite(site: Omit<GeoFenceSite, "id">) {
  try {
    const docRef = await addDoc(collection(db, "geofences"), {
      ...site,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding geofence site:", error);
    throw error;
  }
}

export async function getAllGeoFenceSites() {
  try {
    const querySnapshot = await getDocs(collection(db, "geofences"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GeoFenceSite[];
  } catch (error) {
    console.error("Error getting geofence sites:", error);
    throw error;
  }
}

export async function updateGeoFenceSite(
  id: string,
  data: Partial<GeoFenceSite>
) {
  try {
    const siteRef = doc(db, "geofences", id);
    await updateDoc(siteRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating geofence site:", error);
    throw error;
  }
}

export async function deleteGeoFenceSite(id: string) {
  try {
    const siteRef = doc(db, "geofences", id);
    await deleteDoc(siteRef);
  } catch (error) {
    console.error("Error deleting geofence site:", error);
    throw error;
  }
}
