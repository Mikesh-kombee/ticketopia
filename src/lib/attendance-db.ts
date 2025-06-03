import { db } from "@/lib/firebase/client";
import type { AttendanceLog } from "@/lib/types";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// Add a new attendance log
export async function addAttendanceLog(log: Omit<AttendanceLog, "id">) {
  try {
    const docRef = await addDoc(collection(db, "attendance"), {
      ...log,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding attendance log:", error);
    throw error;
  }
}

// Get attendance log by logId
export async function getAttendanceLogByLogId(logId: string) {
  try {
    const q = query(collection(db, "attendance"), where("logId", "==", logId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AttendanceLog;
  } catch (error) {
    console.error("Error getting attendance log:", error);
    throw error;
  }
}

// Get pending attendance logs
export async function getPendingAttendanceLogs() {
  try {
    const q = query(
      collection(db, "attendance"),
      where("syncStatus", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceLog[];
  } catch (error) {
    console.error("Error getting pending attendance logs:", error);
    throw error;
  }
}

// Update an attendance log
export async function updateAttendanceLog(
  id: string,
  data: Partial<AttendanceLog>
) {
  try {
    const logRef = doc(db, "attendance", id);
    await updateDoc(logRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating attendance log:", error);
    throw error;
  }
}
