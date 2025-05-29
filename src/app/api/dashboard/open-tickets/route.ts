import { NextResponse } from "next/server";
import type { OpenTicketSummary } from "@/lib/types";
import { ticketStatuses, ticketPriorities } from "@/lib/types";

const mockOpenTickets: OpenTicketSummary[] = [
  {
    id: "T1001",
    customerName: "John Doe",
    status: "Assigned",
    priority: "High",
    issueType: "Plumbing",
    assignedEngineerName: "Alice Smith",
    lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "T1002",
    customerName: "Jane Smith",
    status: "In Progress",
    priority: "Urgent",
    issueType: "Electrical",
    assignedEngineerName: "Bob Johnson",
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "T1003",
    customerName: "Mike Williams",
    status: "Pending",
    priority: "Medium",
    issueType: "HVAC",
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "T1004",
    customerName: "Lisa Brown",
    status: "Assigned",
    priority: "Low",
    issueType: "Appliance Repair",
    assignedEngineerName: "Charlie Brown",
    lastUpdate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "T1005",
    customerName: "David Wilson",
    status: "Pending",
    priority: "Medium",
    issueType: "Other",
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  // Simulate some status/priority changes
  const updatedTickets = mockOpenTickets
    .map((ticket) => {
      if (Math.random() < 0.15) {
        // 15% chance to update
        return {
          ...ticket,
          status:
            ticketStatuses[
              Math.floor(
                Math.random() *
                  ticketStatuses.filter(
                    (s) => s !== "Completed" && s !== "Cancelled"
                  ).length
              )
            ], // Keep it open
          priority:
            ticketPriorities[
              Math.floor(Math.random() * ticketPriorities.length)
            ],
          lastUpdate: new Date().toISOString(),
        };
      }
      return ticket;
    })
    .filter(
      (ticket) => ticket.status !== "Completed" && ticket.status !== "Cancelled"
    );

  return NextResponse.json(updatedTickets);
}
