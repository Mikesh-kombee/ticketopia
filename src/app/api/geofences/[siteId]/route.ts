
import { NextResponse } from 'next/server';
import type { GeoFenceSite } from '@/lib/types';

const mockGeoFences: Record<string, GeoFenceSite> = {
  "site-001": {
    id: "site-001",
    name: "Downtown Office",
    // Polygon around a small area in Los Angeles for testing
    polygon: [
      { lat: 34.0522, lng: -118.2437 }, // LA City Hall approx
      { lat: 34.0532, lng: -118.2427 },
      { lat: 34.0522, lng: -118.2417 },
      { lat: 34.0512, lng: -118.2427 },
    ],
    center: { lat: 34.0522, lng: -118.2430 } // Center for map view
  },
  "site-002": {
    id: "site-002",
    name: "Warehouse District Hub",
    polygon: [
      { lat: 34.0390, lng: -118.2360 },
      { lat: 34.0400, lng: -118.2350 },
      { lat: 34.0390, lng: -118.2340 },
      { lat: 34.0380, lng: -118.2350 },
    ],
    center: { lat: 34.0385, lng: -118.2350 }
  }
};

type RouteParams = {
  params: {
    siteId: string;
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const { siteId } = params;

  if (!siteId) {
    return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
  }

  const geofence = mockGeoFences[siteId];

  if (!geofence) {
    return NextResponse.json({ error: 'Geofence not found for this site ID' }, { status: 404 });
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(geofence);
}
