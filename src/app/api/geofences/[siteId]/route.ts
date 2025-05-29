import type { GeoFenceSite } from "@/lib/types";
import { NextResponse } from "next/server";
import db from "@/lib/db.json"; // Import db.json

// const mockCircularGeoFences: Record<string, GeoFenceSite> = { ... }; // Removed

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

  // Access circularGeoFences from the imported db.json
  const geofence = (db.circularGeoFences as Record<string, GeoFenceSite>)[
    siteId
  ];

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
