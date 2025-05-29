import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { RoutePoint } from "@/lib/types";
import db from "@/lib/db.json"; // Import the new db.json file

// Mock data - in a real app, this would come from a database
// const mockRouteData: { [key: string]: RoutePoint[] } = { ... }; // Removed mockRouteData

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const engineerId = searchParams.get("engineerId");
  const date = searchParams.get("date"); // Expects YYYY-MM-DD format

  if (!engineerId || !date) {
    return NextResponse.json(
      { error: "Engineer ID and date are required" },
      { status: 400 }
    );
  }

  const key = `${engineerId}-${date}`;
  // Access routeData from the imported db.json
  const data = (db.routeData as { [key: string]: RoutePoint[] })[key] || [];

  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 1000 + 200)
  );

  return NextResponse.json(data);
}
