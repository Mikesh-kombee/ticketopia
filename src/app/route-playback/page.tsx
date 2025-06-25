"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/client";
import { format } from "date-fns";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Calendar, MapPinned, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteSummary {
  engineerId: string;
  engineerName: string;
  date: string;
  pointCount: number;
}

export default function RoutePlaybackPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRouteSummaries() {
      try {
        const routeDataRef = collection(db, "routeData");
        const q = query(routeDataRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        // Group routes by engineer and date
        const routeMap = new Map<string, RouteSummary>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const key = `${data.engineerId}_${data.date}`;

          if (!routeMap.has(key)) {
            routeMap.set(key, {
              engineerId: data.engineerId,
              engineerName: data.engineerName,
              date: data.date,
              pointCount: 1,
            });
          } else {
            const summary = routeMap.get(key)!;
            summary.pointCount++;
          }
        });

        setRoutes(Array.from(routeMap.values()));
      } catch (error) {
        console.error("Error fetching routes:", error);
    } finally {
      setIsLoading(false);
      }
    }

    fetchRouteSummaries();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Loading routes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-6 w-6" />
          Route Playback
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={`${route.engineerId}_${route.date}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{route.engineerName}</span>
                </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(route.date + "T00:00:00"), "PPP")}
                    </span>
                </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {route.pointCount} location points
              </div>
              <Button
                variant="outline"
                className="w-full"
                    onClick={() =>
                      router.push(
                        `/route-playback/${route.engineerId}_${route.date}`
                      )
                    }
                  >
                    View Route
              </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
