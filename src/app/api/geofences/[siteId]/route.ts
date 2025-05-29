import type { GeoFenceSite } from "@/lib/types";
import { NextResponse } from "next/server";

// Mock data for circular geofences
const mockCircularGeoFences: Record<string, GeoFenceSite> = {
  "site-001": {
    id: "site-001",
    name: "Downtown Office HQ",
    center: { lat: 34.0522, lng: -118.2437 }, // LA City Hall approx
    radiusKm: 0.5, // 500 meters radius
  },
  "site-002": {
    id: "site-002",
    name: "Warehouse District Hub",
    center: { lat: 34.0385, lng: -118.235 },
    radiusKm: 1.0, // 1 km radius
  },
  "user-current-location": {
    // Example for a geofence dynamically set around a user
    id: "user-current-location",
    name: "Dynamic User Zone",
    center: { lat: 34.05, lng: -118.25 }, // This would be set dynamically
    radiusKm: 0.2, // 200 meters radius
  },
};

type RouteParams = {
  params: Promise<{
    siteId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { siteId } = await params;

  if (!siteId) {
    return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
  }

  const geofence = mockCircularGeoFences[siteId];

  if (!geofence) {
    return NextResponse.json(
      { error: "Geofence not found for this site ID" },
      { status: 404 }
    );
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(geofence);
}
