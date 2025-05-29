import { NextResponse } from "next/server";
import type { AttendanceRecordSummary } from "@/lib/types";
// import { attendanceStatuses } from "@/lib/types"; // No longer needed
// import { format } from "date-fns"; // No longer needed
import db from "@/lib/db.json"; // Import db.json

// const engineerNames = [ ... ]; // Removed

// const mockTodaysAttendance: AttendanceRecordSummary[] = engineerNames.map( ... ); // Removed

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Return data from db.json
  return NextResponse.json(db.todaysAttendance as AttendanceRecordSummary[]);
}
