"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/client";
import { format } from "date-fns";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { AlertTriangle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

interface Alert {
  id: string;
  type: string;
  message: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  engineerId: string;
  engineerName: string;
  status: "new" | "acknowledged" | "resolved";
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const alertsRef = collection(db, "alerts");
        const q = query(alertsRef, orderBy("timestamp", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        const alertsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toISOString(),
        })) as Alert[];

        setAlerts(alertsData);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  if (isLoading) {
    return <div>Loading alerts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Engineer</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {format(new Date(alert.timestamp), "MMM d, h:mm a")}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {alert.type}
                  </span>
                </TableCell>
                <TableCell>{alert.engineerName}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      alert.status === "new"
                        ? "bg-red-100 text-red-800"
                        : alert.status === "acknowledged"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {alert.status.charAt(0).toUpperCase() +
                      alert.status.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
