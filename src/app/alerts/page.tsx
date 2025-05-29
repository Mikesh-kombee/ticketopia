import { AlertsDashboard } from "@/components/alerts-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts Dashboard - Ticketopia",
  description: "Monitor real-time operational alerts.",
};

export default function AlertsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Alerts Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
      </div>
      <AlertsDashboard />
    </div>
  );
}
