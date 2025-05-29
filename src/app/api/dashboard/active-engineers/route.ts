import { NextResponse } from "next/server";
import type { ActiveEngineerSummary } from "@/lib/types";
import { engineerStatuses } from "@/lib/types";

const mockEngineers: ActiveEngineerSummary[] = [
  {
    id: "eng1",
    name: "Alice Smith",
    status: "Active",
    avatar: "https://placehold.co/40x40.png?text=AS",
    currentTask: "Servicing Ticket #T1001",
  },
  {
    id: "eng2",
    name: "Bob Johnson",
    status: "On Route",
    avatar: "https://placehold.co/40x40.png?text=BJ",
    currentTask: "En route to Downtown",
  },
  {
    id: "eng3",
    name: "Charlie Brown",
    status: "On Break",
    avatar: "https://placehold.co/40x40.png?text=CB",
  },
  {
    id: "eng4",
    name: "Diana Prince",
    status: "Offline",
    avatar: "https://placehold.co/40x40.png?text=DP",
  },
  {
    id: "eng5",
    name: "Edward Nygma",
    status: "Active",
    avatar: "https://placehold.co/40x40.png?text=EN",
    currentTask: "Awaiting Assignment",
  },
];

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate some status changes
  const updatedEngineers = mockEngineers.map((eng) => {
    if (Math.random() < 0.2) {
      // 20% chance to change status
      return {
        ...eng,
        status:
          engineerStatuses[Math.floor(Math.random() * engineerStatuses.length)],
      };
    }
    return eng;
  });

  return NextResponse.json(updatedEngineers);
}
