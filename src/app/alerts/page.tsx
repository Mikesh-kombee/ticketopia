import { AlertsDashboard } from "@/components/alerts-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts Dashboard - Ticketopia",
  description: "Monitor real-time operational alerts.",
};

export default function AlertsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <AlertsDashboard />
    </div>
  );
}
