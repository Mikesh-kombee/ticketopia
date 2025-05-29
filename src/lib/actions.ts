"use server";

import type { Ticket, TicketFormValues, Coordinates, IssueType } from "./types";
import { ticketFormSchema } from "./schema";
import { categorizeIssue } from "@/ai/flows/issue-categorization"; // Corrected import
import { engineerEtaCalculation } from "@/ai/flows/engineer-eta";

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
    // Example of using AI-based issue categorization.
    // This can be enabled if desired for the "Other" issue type or for all types.
    const aiCategorizedIssueType: IssueType = validatedData.issueType;
    if (validatedData.notes) {
      try {
        const categorization = await categorizeIssue({
          notes: validatedData.notes,
        });
        console.log("AI Categorization:", categorization);
        // Potentially use categorization.category if confidence is high,
        // or suggest it to the user. For now, just logging.
        // if (categorization.category && categorization.confidence > 0.7) {
        //   aiCategorizedIssueType = categorization.category as IssueType;
        // }
      } catch (aiError) {
        console.warn("AI issue categorization failed:", aiError);
        // Proceed with user-selected issue type if AI fails
      }
    }

    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      customerName: validatedData.customerName,
      address: validatedData.address,
      coordinates,
      issueType: aiCategorizedIssueType, // Use AI categorized or original
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
    const result = await engineerEtaCalculation({
      engineerLocation: `${engineerLocation.lat},${engineerLocation.lng}`,
      ticketLocation: `${ticketLocation.lat},${ticketLocation.lng}`,
      engineerName,
    });
    return { etaMinutes: result.etaMinutes, explanation: result.explanation };
  } catch (error) {
    console.error("Error calculating ETA:", error);

    // Handle specific API errors
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status: number; message?: string };

      if (apiError.status === 429) {
        return {
          error:
            "AI service is temporarily busy due to high demand. The ETA calculation will be available shortly. Please try again in a moment.",
        };
      }

      if (apiError.status === 401) {
        return {
          error: "AI service authentication issue. Please contact support.",
        };
      }

      if (apiError.status >= 500) {
        return {
          error:
            "AI service is temporarily unavailable. Please try again later.",
        };
      }
    }

    // Generic fallback error
    return {
      error:
        "ETA calculation is temporarily unavailable. The ticket has been created successfully.",
    };
  }
}
