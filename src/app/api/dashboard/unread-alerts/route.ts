import type { DashboardAlertSummary } from "@/lib/types";
import { NextResponse } from "next/server";
import db from "@/lib/db.json"; // Import db.json

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // Filter alerts from db.json
  const unreadAlerts = (db.alerts as DashboardAlertSummary[]).filter(
    (a) => a.status === "new"
  );
  return NextResponse.json(unreadAlerts);
}
