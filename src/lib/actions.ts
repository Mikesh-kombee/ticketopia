"use server";

import { createTicket, updateEngineerLocation } from "./firebase/api";
import { ticketFormSchema } from "./schema";
import type { Coordinates, Ticket, TicketFormValues } from "./types";

// This is a mock in-memory store for demonstration.
// In a real app, you'd use a database.
// For the purpose of this scaffold and to interact with useTicketStore,
// this server action will return the created ticket data,
// and the client will handle adding it to localStorage via the store.

export async function createTicketAction(
  data: TicketFormValues,
  coordinates?: Coordinates
): Promise<{
  success: boolean;
  ticket?: Ticket;
  error?: string;
  validationErrors?: Record<string, string[]>;
}> {
  const validationResult = ticketFormSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      validationErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedData = validationResult.data;

  try {
    const now = new Date().toISOString();

    const newTicket = await createTicket({
      customerName: validatedData.customerName,
      address: validatedData.address,
      coordinates,
      issueType: validatedData.issueType,
      notes: validatedData.notes,
      photoFileName: validatedData.photo?.[0]?.name, // Storing only file name as placeholder
      assignedEngineerId: validatedData.assignedEngineerId,
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    });

    if (!newTicket) {
      throw new Error("Failed to create ticket in Firestore");
    }

    return { success: true, ticket: newTicket };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return {
      success: false,
      error: "Failed to create ticket. Please try again.",
    };
  }
}

export async function getEngineerEta(
  engineerLocation: Coordinates,
  ticketLocation: Coordinates,
  engineerName: string
): Promise<{ etaMinutes?: number; explanation?: string; error?: string }> {
  try {
    // Simple distance-based calculation
    const latDiff = Math.abs(
      engineerLocation.latitude - ticketLocation.latitude
    );
    const lngDiff = Math.abs(
      engineerLocation.longitude - ticketLocation.longitude
    );
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Convert the geometric distance to an approximate ETA in minutes
    const etaMinutes = Math.round(distance * 100);

    // Record the calculation in the database
    // This is just for auditing purposes
    const engineerId = "unknown"; // In a real app, you'd get this from the engineer object
    await updateEngineerLocation(engineerId, {
      lat: engineerLocation.latitude,
      lng: engineerLocation.longitude,
    });

    return {
      etaMinutes,
      explanation: `Estimated travel time for ${engineerName} is ${etaMinutes} minutes based on direct distance calculation.`,
    };
  } catch (error) {
    console.error("Error calculating ETA:", error);
    return {
      error: "Could not calculate ETA. Please try again later.",
    };
  }
}
