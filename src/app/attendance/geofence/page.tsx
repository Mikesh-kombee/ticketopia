"use client";

import { GeoFenceCheckIn } from "@/components/geofence-checkin";
import { MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllGeoFenceSites } from "@/lib/geofence-db";
import type { GeoFenceSite } from "@/lib/types";

// export const metadata: Metadata = {
//   title: "GeoFence Check-In - Ticketopia",
//   description: "Check in and out of job sites using geofencing.",
// };

export default function GeoFencePage() {
  const [sites, setSites] = useState<GeoFenceSite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const fetchedSites = await getAllGeoFenceSites();
        setSites(fetchedSites);
      } catch (err) {
        console.error("Error fetching sites:", err);
        setError("Failed to load geofence sites");
      }
    };

    fetchSites();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              GeoFence Attendance
            </h1>
          </div>
          <p className="text-muted-foreground">
            Check in and out of job sites automatically based on your location
          </p>
        </div>
        <Link href="/admin/geofences">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Geofences
          </Button>
        </Link>
      </div>
      {error ? (
        <div className="text-red-500 mb-4">{error}</div>
      ) : (
        <GeoFenceCheckIn userId="temp-user" />
      )}
    </div>
  );
}
