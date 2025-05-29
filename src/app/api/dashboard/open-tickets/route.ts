import { NextResponse } from "next/server";
import type { OpenTicketSummary } from "@/lib/types";
// import { ticketStatuses, ticketPriorities } from "@/lib/types"; // No longer needed
import db from "@/lib/db.json"; // Import db.json

// const mockOpenTickets: OpenTicketSummary[] = [ ... ]; // Removed

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  // const updatedTickets = mockOpenTickets.map( ... ); // Removed dynamic update logic

  // Return data from db.json
  return NextResponse.json(db.dashboardOpenTickets as OpenTicketSummary[]);
}
