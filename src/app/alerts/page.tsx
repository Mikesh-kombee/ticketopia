
import { AlertsDashboard } from "@/components/alerts-dashboard";
import { Metadata } from "next";

// export const metadata: Metadata = { // Metadata cannot be exported from client component pages directly
//   title: "Alerts Dashboard - Ticketopia",
//   description: "Monitor real-time operational alerts.",
// };

export default function AlertsPage() {
  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8"> {/* Add container and padding */}
      <AlertsDashboard />
    </div>
  );
}
