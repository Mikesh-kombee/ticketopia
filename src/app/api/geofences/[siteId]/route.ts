import type { GeoFenceSite } from "@/lib/types";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

// const mockCircularGeoFences: Record<string, GeoFenceSite> = { ... }; // Removed

type RouteParams = {
  params: {
    siteId: string;
  };
};

export async function GET(request: Request, { params }: RouteParams) {
  const { siteId } = params;

  if (!siteId) {
    return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
  }

  try {
    const geofenceRef = doc(db, "geofences", siteId);
    const geofenceDoc = await getDoc(geofenceRef);

    if (!geofenceDoc.exists()) {
      return NextResponse.json(
        { error: "Geofence not found for this site ID" },
        { status: 404 }
      );
    }

    const geofence = {
      id: geofenceDoc.id,
      ...geofenceDoc.data(),
    } as GeoFenceSite;
    return NextResponse.json(geofence);
  } catch (error) {
    console.error("Error fetching geofence:", error);
    return NextResponse.json(
      { error: "Failed to fetch geofence" },
      { status: 500 }
    );
  }
}
