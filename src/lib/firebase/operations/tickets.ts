import { db } from "../server";
import type { Ticket } from "@/lib/types";
import { handleFirestoreError } from "../utils/error-handler";

export async function getAllTickets(): Promise<Ticket[]> {
  return handleFirestoreError(async () => {
    const snapshot = await db.collection("tickets").get();
    return snapshot.docs.map((doc) => doc.data() as Ticket);
  }, "Error fetching tickets");
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  return handleFirestoreError(async () => {
    const doc = await db.collection("tickets").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Ticket;
  }, `Error fetching ticket ${id}`);
}

export async function createTicket(
  ticket: Omit<Ticket, "id">
): Promise<Ticket | null> {
  return handleFirestoreError(async () => {
    const id = crypto.randomUUID();
    const newTicket = { id, ...ticket };
    await db.collection("tickets").doc(id).set(newTicket);
    return newTicket;
  }, "Error creating ticket");
}

export async function updateTicket(
  id: string,
  data: Partial<Ticket>
): Promise<boolean> {
  return handleFirestoreError(async () => {
    await db
      .collection("tickets")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    return true;
  }, `Error updating ticket ${id}`);
}
