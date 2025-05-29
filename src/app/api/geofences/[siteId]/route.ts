import type { GeoFenceSite } from "@/lib/types";
import { NextResponse } from "next/server";

// Mock data for circular geofences
const mockCircularGeoFences: Record<string, GeoFenceSite> = {
  "site-001": {
    id: "site-001",
    name: "Surat Municipal Corporation Office",
    center: { lat: 21.1702, lng: 72.8311 }, // Surat city center
    radiusKm: 15, // 15 km radius
  },
  "site-002": {
    id: "site-002",
    name: "Diamond Market Hub",
    center: { lat: 21.1825, lng: 72.821 },
    radiusKm: 1.0, // 1 km radius
  },
  "user-current-location": {
    // Example for a geofence dynamically set around a user
    id: "user-current-location",
    name: "Dynamic User Zone",
    center: { lat: 21.165, lng: 72.84 }, // This would be set dynamically
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
