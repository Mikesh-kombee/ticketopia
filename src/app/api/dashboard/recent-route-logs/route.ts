import { NextResponse } from "next/server";
import type { RecentRouteLogSummary } from "@/lib/types";
// import { format } from 'date-fns'; // No longer needed
import db from "@/lib/db.json"; // Import db.json

// const engineerNames = [ ... ]; // Removed
// const mockRecentRouteLogs: RecentRouteLogSummary[] = Array.from( ... ); // Removed

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 700));
  // Return data from db.json
  return NextResponse.json(db.recentRouteLogs as RecentRouteLogSummary[]);
}
