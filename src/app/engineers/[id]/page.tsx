"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/client";
import type { Alert, Engineer, Ticket } from "@/lib/types";
import { format } from "date-fns";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  MapPinned,
  Ticket as TicketIcon,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EngineerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadEngineerData = async () => {
      try {
        // Load engineer details
        const engineerDoc = await getDoc(doc(db, "engineers", params.id));
        if (!engineerDoc.exists()) {
          throw new Error("Engineer not found");
        }
        setEngineer({ id: engineerDoc.id, ...engineerDoc.data() } as Engineer);

        // Load recent tickets
        const ticketsRef = collection(db, "tickets");
        const ticketsQuery = query(
          ticketsRef,
          where("assignedEngineerId", "==", params.id)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const tickets = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];
        setRecentTickets(tickets);

        // Load recent alerts
        const alertsRef = collection(db, "alerts");
        const alertsQuery = query(
          alertsRef,
          where("engineerId", "==", params.id)
        );
        const alertsSnapshot = await getDocs(alertsQuery);
        const alerts = alertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Alert[];
        setRecentAlerts(alerts);
      } catch (err) {
        console.error("Error loading engineer data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load engineer data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadEngineerData();
  }, [params.id]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "On Route":
        return "bg-blue-500";
      case "On Break":
        return "bg-yellow-500";
      case "Offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading engineer details...</p>
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">{error || "Engineer not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          {engineer.name}
        </h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Engineers
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Engineer Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                className={`${getStatusColor(engineer.status)} text-white`}
              >
                {engineer.status || "Offline"}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Specialization</h3>
              <p>{engineer.specialization?.join(", ") || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Current Task</h3>
              <p>{engineer.currentTask || "No current task"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Location</h3>
              {engineer.location ? (
                <div className="flex items-center gap-1">
                  <MapPinned className="h-4 w-4" />
                  {engineer.location.lat.toFixed(4)},{" "}
                  {engineer.location.lng.toFixed(4)}
                </div>
              ) : (
                <p>Unknown</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <TicketIcon className="h-4 w-4" />
                Recent Tickets
              </h3>
              {recentTickets.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {recentTickets.slice(0, 3).map((ticket) => (
                    <li key={ticket.id} className="text-sm">
                      {ticket.customerName} - {ticket.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent tickets
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Alerts
              </h3>
              {recentAlerts.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {recentAlerts.slice(0, 3).map((alert) => (
                    <li key={alert.id} className="text-sm">
                      {alert.type} - {format(new Date(alert.timestamp), "PPp")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
