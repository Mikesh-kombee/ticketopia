"use server";

import type { Ticket, TicketFormValues, Coordinates } from "./types";
import { ticketFormSchema } from "./schema";
import { категоріIssue } from "@/ai/flows/issue-categorization"; // Corrected import from issue-categorization
import { engineerEtaCalculation } from "@/ai/flows/engineer-eta"; // Corrected import from engineer-eta

// This is a mock in-memory store for demonstration.
// In a real app, you'd use a database.
// For the purpose of this scaffold and to interact with useTicketStore,
// this server action will return the created ticket data,
// and the client will handle adding it to localStorage via the store.

export async function createTicketAction(
  data: TicketFormValues,
  coordinates?: Coordinates
): Promise<{ success: boolean; ticket?: Ticket; error?: string; validationErrors?: any }> {
  const validationResult = ticketFormSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, validationErrors: validationResult.error.flatten().fieldErrors };
  }

  const validatedData = validationResult.data;

  try {
    // Optional: AI-based issue categorization (example)
    // const categorization = await categorizeIssue({ notes: validatedData.notes });
    // console.log("AI Categorization:", categorization);

    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      customerName: validatedData.customerName,
      address: validatedData.address,
      coordinates,
      issueType: validatedData.issueType,
      notes: validatedData.notes,
      photoFileName: validatedData.photo?.[0]?.name, // Storing only file name as placeholder
      assignedEngineerId: validatedData.assignedEngineerId,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate saving to a database
    console.log("Ticket created:", newTicket);

    // In a real app, this ticket would be saved to a DB.
    // For this example, we return the ticket so the client can update its local store.
    return { success: true, ticket: newTicket };

  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket. Please try again." };
  }
}

export async function getEngineerEta(
  engineerLocation: Coordinates,
  ticketLocation: Coordinates,
  engineerName: string
): Promise<{ etaMinutes?: number; explanation?: string; error?: string }> {
  try {
    const result = await engineerEtaCalculation({
      engineerLocation: `${engineerLocation.lat},${engineerLocation.lng}`,
      ticketLocation: `${ticketLocation.lat},${ticketLocation.lng}`,
      engineerName,
    });
    return { etaMinutes: result.etaMinutes, explanation: result.explanation };
  } catch (error) {
    console.error("Error calculating ETA:", error);
    return { error: "Failed to calculate ETA." };
  }
}
