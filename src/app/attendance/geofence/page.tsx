import { GeoFenceCheckIn } from "@/components/geofence-checkin";
import { MapPin } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoFence Check-In - Ticketopia",
  description: "Check in and out of job sites using geofencing.",
};

export default function GeoFencePage() {
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
      </div>
      <GeoFenceCheckIn siteId="site-001" userId="user-123" />
    </div>
  );
}
