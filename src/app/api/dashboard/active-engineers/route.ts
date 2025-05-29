import { NextResponse } from "next/server";
import type { ActiveEngineerSummary } from "@/lib/types";
// import { engineerStatuses } from "@/lib/types"; // No longer needed
import db from "@/lib/db.json"; // Import db.json

// const mockEngineers: ActiveEngineerSummary[] = [ ... ]; // Removed

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // const updatedEngineers = mockEngineers.map( ... ); // Removed dynamic update logic

  // Return data from db.json
  return NextResponse.json(db.activeEngineers as ActiveEngineerSummary[]);
}
