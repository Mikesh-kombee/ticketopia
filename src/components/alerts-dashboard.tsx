"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  Firestore,
} from "firebase/firestore";
import { AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import MapView from "./map-view";

interface Alert {
  id: string;
  type: string;
  message?: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  engineerId: string;
  engineerName: string;
  status: "new" | "acknowledged" | "resolved" | "Active" | "Resolved";
}

interface RoutePoint {
  lat: number;
  lng: number;
}

async function fetchRouteForAlert(
  db: Firestore,
  engineerId: string,
  alertTimestamp: string
): Promise<RoutePoint[]> {
  const alertTime = new Date(alertTimestamp);
  if (isNaN(alertTime.getTime())) {
    throw new Error("Invalid alert timestamp provided.");
  }
  const startTime = new Date(alertTime.getTime() - 15 * 60 * 1000); // 15 mins before
  const endTime = new Date(alertTime.getTime() + 15 * 60 * 1000); // 15 mins after

  const routeRef = collection(db, "route-data");
  const q = query(
    routeRef,
    where("engineerId", "==", engineerId),
    where("timestamp", ">=", startTime),
    where("timestamp", "<=", endTime),
    orderBy("timestamp")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return snapshot.docs.map((doc) => (doc.data() as any).location);
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [routePath, setRoutePath] = useState<RoutePoint[] | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const alertsRef = collection(db, "alerts");
        const q = query(alertsRef, orderBy("timestamp", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No alerts found.");
        }

        const alertsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp;

            if (!data.engineerId || !timestamp) {
              console.warn(
                "Skipping incomplete alert data:",
                `ID: ${doc.id}`,
                data
              );
              return null;
            }

            const date =
              timestamp instanceof Timestamp
                ? timestamp.toDate()
                : new Date(timestamp);

            if (isNaN(date.getTime())) {
              console.warn(
                "Skipping alert with invalid timestamp:",
                `ID: ${doc.id}`,
                data
              );
              return null;
            }

            return {
              id: doc.id,
              ...data,
              timestamp: date.toISOString(),
            } as Alert;
          })
          .filter((alert): alert is Alert => alert !== null);

        setAlerts(alertsData);
      } catch (error: any) {
        console.error("Error fetching alerts:", error);
        setError(
          "Failed to fetch alerts. Please check the console for more details."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const handleOpenMap = useCallback(
    async (alert: Alert) => {
      setRouteError(null);
      setRoutePath(null);
      setSelectedAlert(alert);

      // This check is now redundant due to filtering, but kept as a safeguard.
      if (!alert.engineerId || !alert.timestamp) {
        setRouteError(
          "Could not load route. Essential data is missing for this alert."
        );
        return;
      }

      setIsRouteLoading(true);
      try {
        const route = await fetchRouteForAlert(
          db,
          alert.engineerId,
          alert.timestamp
        );
        if (route.length === 0) {
          setRouteError(
            "No route data found for this engineer around the time of the alert."
          );
        }
        setRoutePath(route);
      } catch (e: any) {
        console.error(
          "Failed to fetch route data. This likely requires a composite index in Firestore.",
          e
        );
        if (e.message?.includes("composite index")) {
          setRouteError(
            "A database index is required. Please check the browser console for a link to create it."
          );
        } else {
          setRouteError(
            "An unexpected error occurred while fetching route data."
          );
        }
      } finally {
        setIsRouteLoading(false);
      }
    },
    []
  );

  const handleCloseMap = () => {
    setSelectedAlert(null);
    setRoutePath(null);
    setRouteError(null);
  };

  if (isLoading) {
    return <div>Loading alerts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <>
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
                    <button
                      className="flex items-center gap-1 hover:underline cursor-pointer"
                      onClick={() => handleOpenMap(alert)}
                    >
                      <MapPin className="h-4 w-4" />
                      {alert.type}
                    </button>
                  </TableCell>
                  <TableCell>{alert.engineerName}</TableCell>
                  <TableCell>{alert.message || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        alert.status.toLowerCase() === "new" ||
                        alert.status.toLowerCase() === "active"
                          ? "bg-red-100 text-red-800"
                          : alert.status.toLowerCase() === "acknowledged"
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

      <Dialog
        open={!!selectedAlert}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseMap();
          }
        }}
      >
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAlert?.type} Alert for {selectedAlert?.engineerName}
            </DialogTitle>
          </DialogHeader>
          {isRouteLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2">Loading route data...</p>
            </div>
          ) : routeError ? (
            <div className="text-center text-red-500 p-8">{routeError}</div>
          ) : (
            selectedAlert && (
              <MapView
                alertLocation={selectedAlert.location}
                routePath={routePath ?? []}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
