/**
 * Firebase API Layer
 *
 * This file contains server-side functions for interacting with Firestore
 * to replace the static db.json functionality.
 */

import { db } from "./server";
import type {
  Ticket,
  Engineer,
  RouteLogEntry,
  Attendance,
  Alert,
  ExpenseSubmission,
  RateConfig,
} from "../types";

// Tickets
export async function getAllTickets(): Promise<Ticket[]> {
  try {
    const snapshot = await db.collection("tickets").get();
    return snapshot.docs.map((doc) => doc.data() as Ticket);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  try {
    const doc = await db.collection("tickets").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Ticket;
  } catch (error) {
    console.error(`Error fetching ticket ${id}:`, error);
    return null;
  }
}

export async function createTicket(
  ticket: Omit<Ticket, "id">
): Promise<Ticket | null> {
  try {
    const id = crypto.randomUUID();
    const newTicket = { id, ...ticket };
    await db.collection("tickets").doc(id).set(newTicket);
    return newTicket;
  } catch (error) {
    console.error("Error creating ticket:", error);
    return null;
  }
}

export async function updateTicket(
  id: string,
  data: Partial<Ticket>
): Promise<boolean> {
  try {
    await db
      .collection("tickets")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    return true;
  } catch (error) {
    console.error(`Error updating ticket ${id}:`, error);
    return false;
  }
}

// Engineers
export async function getAllEngineers(): Promise<Engineer[]> {
  try {
    const snapshot = await db.collection("engineers").get();
    return snapshot.docs.map((doc) => doc.data() as Engineer);
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return [];
  }
}

export async function getEngineerById(id: string): Promise<Engineer | null> {
  try {
    const doc = await db.collection("engineers").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Engineer;
  } catch (error) {
    console.error(`Error fetching engineer ${id}:`, error);
    return null;
  }
}

export async function updateEngineerLocation(
  id: string,
  location: { lat: number; lng: number }
): Promise<boolean> {
  try {
    await db.collection("engineers").doc(id).update({
      location,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating engineer location ${id}:`, error);
    return false;
  }
}

// Route Logs
export async function getRouteLogsByEngineerId(
  engineerId: string
): Promise<RouteLogEntry[]> {
  try {
    const snapshot = await db
      .collection("routeLogs")
      .where("engineerId", "==", engineerId)
      .get();
    return snapshot.docs.map((doc) => doc.data() as RouteLogEntry);
  } catch (error) {
    console.error(
      `Error fetching route logs for engineer ${engineerId}:`,
      error
    );
    return [];
  }
}

export async function getRouteLogsByDate(
  date: string
): Promise<RouteLogEntry[]> {
  try {
    const snapshot = await db
      .collection("routeLogs")
      .where("date", "==", date)
      .get();
    return snapshot.docs.map((doc) => doc.data() as RouteLogEntry);
  } catch (error) {
    console.error(`Error fetching route logs for date ${date}:`, error);
    return [];
  }
}

// Attendance
export async function getTodaysAttendance(): Promise<Attendance[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  try {
    const snapshot = await db
      .collection("attendance")
      .where("date", "==", today)
      .get();
    return snapshot.docs.map((doc) => doc.data() as Attendance);
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return [];
  }
}

export async function checkInEngineer(
  engineerId: string,
  engineerName: string
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Get engineer data for the avatar
    const engineerDoc = await db.collection("engineers").doc(engineerId).get();
    const engineerData = engineerDoc.data();

    await db.collection("attendance").add({
      id: crypto.randomUUID(),
      engineerId,
      engineerName,
      date: today,
      checkInTime: time,
      status: "Checked In",
      avatar: engineerData?.avatar || "",
    });
    return true;
  } catch (error) {
    console.error(`Error checking in engineer ${engineerId}:`, error);
    return false;
  }
}

// Alerts
export async function getAlerts(): Promise<Alert[]> {
  try {
    const snapshot = await db.collection("alerts").get();
    return snapshot.docs.map((doc) => doc.data() as Alert);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}

export async function updateAlertStatus(
  alertId: string,
  status: string
): Promise<boolean> {
  try {
    await db.collection("alerts").doc(alertId).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating alert status ${alertId}:`, error);
    return false;
  }
}

// Expense Submissions
export async function getExpenseSubmissions(): Promise<ExpenseSubmission[]> {
  try {
    const snapshot = await db.collection("expenseSubmissions").get();
    return snapshot.docs.map((doc) => doc.data() as ExpenseSubmission);
  } catch (error) {
    console.error("Error fetching expense submissions:", error);
    return [];
  }
}

export async function createExpenseSubmission(
  data: Omit<ExpenseSubmission, "id" | "submissionDate" | "status">
): Promise<ExpenseSubmission | null> {
  try {
    const id = crypto.randomUUID();
    const submissionDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const newSubmission: ExpenseSubmission = {
      id,
      submissionDate,
      status: "Pending",
      ...data,
    };

    await db.collection("expenseSubmissions").doc(id).set(newSubmission);
    return newSubmission;
  } catch (error) {
    console.error("Error creating expense submission:", error);
    return null;
  }
}

// Rate Configurations
export async function getRateConfigs(): Promise<RateConfig[]> {
  try {
    const snapshot = await db.collection("rateConfigs").get();
    return snapshot.docs.map((doc) => doc.data() as RateConfig);
  } catch (error) {
    console.error("Error fetching rate configurations:", error);
    return [];
  }
}

export async function getDefaultRates(): Promise<Record<string, number>> {
  try {
    const doc = await db.collection("defaultRates").doc("config").get();
    if (!doc.exists) return {};
    return doc.data() as Record<string, number>;
  } catch (error) {
    console.error("Error fetching default rates:", error);
    return {};
  }
}
