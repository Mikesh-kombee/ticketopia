import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { RoutePoint } from "@/lib/types";

// Mock data - in a real app, this would come from a database
const mockRouteData: { [key: string]: RoutePoint[] } = {
  "eng1-2024-07-30": [
    {
      lat: 21.1702,
      lng: 72.8311,
      timestamp: "2024-07-30T09:00:00Z",
      speed: 30,
    },
    {
      lat: 21.1712,
      lng: 72.8321,
      timestamp: "2024-07-30T09:02:00Z",
      speed: 40,
    },
    { lat: 21.1722, lng: 72.8331, timestamp: "2024-07-30T09:05:00Z", speed: 0 },
    { lat: 21.1722, lng: 72.8331, timestamp: "2024-07-30T09:12:00Z", speed: 0 },
    {
      lat: 21.1732,
      lng: 72.8341,
      timestamp: "2024-07-30T09:15:00Z",
      speed: 25,
    },
    {
      lat: 21.1742,
      lng: 72.8361,
      timestamp: "2024-07-30T09:20:00Z",
      speed: 35,
    },
    { lat: 21.1752, lng: 72.8381, timestamp: "2024-07-30T09:25:00Z", speed: 0 },
    { lat: 21.1752, lng: 72.8381, timestamp: "2024-07-30T09:28:00Z", speed: 0 },
    {
      lat: 21.1762,
      lng: 72.8401,
      timestamp: "2024-07-30T09:30:00Z",
      speed: 45,
    },
    { lat: 21.1772, lng: 72.8421, timestamp: "2024-07-30T09:35:00Z", speed: 0 },
    { lat: 21.1772, lng: 72.8421, timestamp: "2024-07-30T09:45:00Z", speed: 0 },
    { lat: 21.178, lng: 72.843, timestamp: "2024-07-30T09:47:00Z", speed: 20 },
  ],
  "eng1-2024-07-31": [
    // Different day for eng1
    { lat: 21.178, lng: 72.843, timestamp: "2024-07-31T10:00:00Z", speed: 15 },
    { lat: 21.179, lng: 72.844, timestamp: "2024-07-31T10:05:00Z", speed: 20 },
    { lat: 21.179, lng: 72.844, timestamp: "2024-07-31T10:15:00Z", speed: 0 }, // 10 min stop
    { lat: 21.18, lng: 72.845, timestamp: "2024-07-31T10:20:00Z", speed: 30 },
  ],
  "eng2-2024-07-30": [
    { lat: 21.16, lng: 72.82, timestamp: "2024-07-30T10:00:00Z", speed: 50 },
    {
      lat: 21.1612,
      lng: 72.8223,
      timestamp: "2024-07-30T10:05:00Z",
      speed: 55,
    },
    { lat: 21.1624, lng: 72.8246, timestamp: "2024-07-30T10:10:00Z", speed: 0 },
    { lat: 21.1624, lng: 72.8246, timestamp: "2024-07-30T10:20:00Z", speed: 0 },
    {
      lat: 21.1636,
      lng: 72.8269,
      timestamp: "2024-07-30T10:25:00Z",
      speed: 60,
    },
  ],
};

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
  const data = mockRouteData[key] || [];

  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 1000 + 200)
  );

  return NextResponse.json(data);
}
