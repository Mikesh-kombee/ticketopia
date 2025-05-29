import { GeoFenceCheckIn } from "@/components/geofence-checkin";
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            GeoFence Attendance
          </h1>
          <p className="text-muted-foreground">
            Check in and out of job sites automatically based on your location
          </p>
        </div>
      </div>
      <GeoFenceCheckIn siteId="site-001" userId="user-123" />
    </div>
  );
}
