import { GeoFenceCheckIn } from "@/components/geofence-checkin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoFence Check-In - Ticketopia",
  description: "Check in and out of job sites using geofencing.",
};

export default function GeoFencePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">
        GeoFence Attendance
      </h1>
      <p className="text-muted-foreground mb-6">
        Check in and out of job sites automatically based on your location.
      </p>
      <GeoFenceCheckIn siteId="site-001" userId="user-123" />
    </div>
  );
}
