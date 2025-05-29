import { NextResponse } from "next/server";
import type { DashboardAlertSummary, AlertStatus } from "@/lib/types";
import { alertTypes, alertSeverities } from "@/lib/types";

const engineerNames = [
  "Alice Smith",
  "Bob Johnson",
  "Charlie Brown",
  "Diana Prince",
];

const mockUnreadAlerts: DashboardAlertSummary[] = Array.from(
  { length: 8 },
  (_, i) => {
    const randomType =
      alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const randomSeverity =
      alertSeverities[Math.floor(Math.random() * alertSeverities.length)];
    return {
      id: `DA${3000 + i}`,
      alertId: `alert-${Date.now() - i * 100000}-${i}`,
      type: randomType,
      engineerName: engineerNames[i % engineerNames.length],
      timestamp: new Date(
        Date.now() - Math.random() * 1000 * 60 * 60 * 3
      ).toISOString(), // within last 3 hours
      severity: randomSeverity,
      status: "new" as AlertStatus, // Assuming all fetched are 'new' or 'unread'
    };
  }
)
  .filter((_, i) => i < 5 || Math.random() > 0.3) // Show 5 to 8 alerts
  .slice(0, 5); // Max 5 for dashboard

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return NextResponse.json(mockUnreadAlerts.filter((a) => a.status === "new"));
}
