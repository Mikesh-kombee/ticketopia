"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EngineerStatus } from "@/lib/types";
import { SURAT_CENTER } from "@/hooks/use-google-maps-api";
import { ChevronDown, Filter, MapPin, RefreshCw, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Engineer {
  id: string;
  name: string;
  status: EngineerStatus;
  currentLocation: string;
  avatar?: string;
  lastActive?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  vehicleId?: string;
  vehicleType?: string;
  assignedTickets?: number;
}

const statusColors: Record<EngineerStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Offline: "bg-gray-100 text-gray-700",
  "On Break": "bg-yellow-100 text-yellow-700",
  "On Route": "bg-blue-100 text-blue-700",
};

export default function LiveMapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedEngineerId = searchParams.get("engineer");

  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<EngineerStatus | "All">(
    "All"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Mock locations for the map display
  const mockLocations = [
    { id: "1", lat: SURAT_CENTER.lat, lng: SURAT_CENTER.lng }, // Surat Municipal Corporation
    { id: "2", lat: 21.2167, lng: 72.8667 }, // Varachha Diamond Market
    { id: "3", lat: 21.19, lng: 72.79 }, // Adajan Area
    { id: "4", lat: 21.195, lng: 72.845 }, // City Light Area
    { id: "5", lat: 21.1822, lng: 72.83 }, // Ring Road Area
  ];

  const fetchEngineers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use mock data or db data
      const mockEngineers: Engineer[] = [
        {
          id: "1",
          name: "Rajesh Kumar",
          status: "Active",
          currentLocation: "Surat Municipal Corporation",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
          lastActive: new Date().toISOString(),
          coordinates: mockLocations[0],
          vehicleId: "V001",
          vehicleType: "Truck",
          assignedTickets: 3,
        },
        {
          id: "2",
          name: "Priya Patel",
          status: "On Route",
          currentLocation: "Varachha Diamond Market",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
          lastActive: new Date().toISOString(),
          coordinates: mockLocations[1],
          vehicleId: "V002",
          vehicleType: "Van",
          assignedTickets: 2,
        },
        {
          id: "3",
          name: "Amit Shah",
          status: "On Break",
          currentLocation: "Adajan Area",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit",
          lastActive: new Date().toISOString(),
          coordinates: mockLocations[2],
          vehicleId: "V003",
          vehicleType: "Car",
          assignedTickets: 1,
        },
        {
          id: "4",
          name: "Meera Singh",
          status: "Active",
          currentLocation: "City Light Area",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera",
          lastActive: new Date().toISOString(),
          coordinates: mockLocations[3],
          vehicleId: "V004",
          vehicleType: "Truck",
          assignedTickets: 4,
        },
        {
          id: "5",
          name: "Ankit Patel",
          status: "Offline",
          currentLocation: "Ring Road Area",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ankit",
          lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          coordinates: mockLocations[4],
          vehicleId: "V005",
          vehicleType: "Van",
          assignedTickets: 0,
        },
      ];

      setEngineers(mockEngineers);

      // Set selected engineer from URL param or default to first active engineer
      if (selectedEngineerId) {
        const engineer = mockEngineers.find((e) => e.id === selectedEngineerId);
        if (engineer) {
          setSelectedEngineer(engineer);
        }
      }
    } catch (error) {
      console.error("Error fetching engineers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEngineerId]);

  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  const handleRefresh = () => {
    fetchEngineers();
  };

  const handleEngineerSelect = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    router.push(`/live-map?engineer=${engineer.id}`);
  };

  const filteredEngineers = engineers.filter(
    (engineer) => filterStatus === "All" || engineer.status === filterStatus
  );

  return (
    <PrivateRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-8 w-8" /> Live Map
            </h1>
            <p className="text-muted-foreground">
              Track and manage field engineer locations in real-time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={filterStatus === "All" ? "default" : "outline"}
                  onClick={() => setFilterStatus("All")}
                  size="sm"
                >
                  All Engineers
                </Button>
                <Button
                  variant={filterStatus === "Active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("Active")}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Active
                </Button>
                <Button
                  variant={filterStatus === "On Route" ? "default" : "outline"}
                  onClick={() => setFilterStatus("On Route")}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  On Route
                </Button>
                <Button
                  variant={filterStatus === "On Break" ? "default" : "outline"}
                  onClick={() => setFilterStatus("On Break")}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  On Break
                </Button>
                <Button
                  variant={filterStatus === "Offline" ? "default" : "outline"}
                  onClick={() => setFilterStatus("Offline")}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  Offline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar with engineer list */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Engineers
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="p-2 border-b last:border-0 flex items-center gap-3"
                      >
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : filteredEngineers.length > 0 ? (
                  <>
                    {filteredEngineers.map((engineer) => (
                      <div
                        key={engineer.id}
                        className={`p-3 border-b last:border-0 flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md ${
                          selectedEngineer?.id === engineer.id
                            ? "bg-muted/50"
                            : ""
                        }`}
                        onClick={() => handleEngineerSelect(engineer)}
                      >
                        {engineer.avatar ? (
                          <img
                            src={engineer.avatar}
                            alt={engineer.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {engineer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{engineer.name}</div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={statusColors[engineer.status]}
                            >
                              {engineer.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {engineer.assignedTickets} tickets
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No engineers match the current filter
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right content with map and details */}
          <div className="md:col-span-3 space-y-6">
            <Card className="min-h-[400px] relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedEngineer
                    ? `${selectedEngineer.name}'s Location`
                    : "All Engineers"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  // Map placeholder - in a real app, you'd integrate with a mapping library
                  <div className="h-[400px] bg-gray-100 rounded-md flex items-center justify-center relative">
                    <div className="text-center text-muted-foreground">
                      <p className="mb-2">Interactive Map Would Appear Here</p>
                      <p className="text-sm">
                        This would be implemented using Google Maps, Mapbox or
                        similar
                      </p>

                      {/* Mock map with engineer markers */}
                      <div className="mt-6 border border-dashed border-muted-foreground rounded-md p-4 mx-auto max-w-md relative h-64">
                        <div
                          className="absolute inset-0 opacity-10 bg-cover bg-center"
                          style={{
                            backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${SURAT_CENTER.lat},${SURAT_CENTER.lng}&zoom=12&size=600x400&key=YOUR_API_KEY')`,
                          }}
                        ></div>

                        {/* City names */}
                        <div className="absolute top-1/4 left-1/4 text-xs font-medium">
                          Surat Municipal Corporation
                        </div>
                        <div className="absolute bottom-1/4 left-1/5 text-xs font-medium">
                          Adajan Area
                        </div>
                        <div className="absolute top-1/3 right-1/4 text-xs font-medium">
                          Varachha Diamond Market
                        </div>
                        <div className="absolute bottom-1/3 right-1/5 text-xs font-medium">
                          City Light Area
                        </div>
                        <div className="absolute top-1/2 right-1/3 text-xs font-medium">
                          Ring Road Area
                        </div>

                        {/* Engineer markers */}
                        {engineers.map((eng) => (
                          <div
                            key={eng.id}
                            className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                              selectedEngineer?.id === eng.id
                                ? "w-6 h-6 border-2 border-primary animate-pulse"
                                : ""
                            }`}
                            style={{
                              backgroundColor:
                                eng.status === "Active"
                                  ? "rgb(34, 197, 94)"
                                  : eng.status === "On Route"
                                  ? "rgb(59, 130, 246)"
                                  : eng.status === "On Break"
                                  ? "rgb(234, 179, 8)"
                                  : "rgb(156, 163, 175)",
                              top:
                                eng.id === "1"
                                  ? "25%"
                                  : eng.id === "2"
                                  ? "33%"
                                  : eng.id === "3"
                                  ? "50%"
                                  : eng.id === "4"
                                  ? "66%"
                                  : "50%",
                              left:
                                eng.id === "1"
                                  ? "25%"
                                  : eng.id === "2"
                                  ? "75%"
                                  : eng.id === "3"
                                  ? "20%"
                                  : eng.id === "4"
                                  ? "80%"
                                  : "66%",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedEngineer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engineer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    {selectedEngineer.avatar ? (
                      <img
                        src={selectedEngineer.avatar}
                        alt={selectedEngineer.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                        {selectedEngineer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {selectedEngineer.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <Badge
                            variant="secondary"
                            className={statusColors[selectedEngineer.status]}
                          >
                            {selectedEngineer.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Current Location
                          </p>
                          <p>{selectedEngineer.currentLocation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Assigned Tickets
                          </p>
                          <p>{selectedEngineer.assignedTickets}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vehicle
                          </p>
                          <p>
                            {selectedEngineer.vehicleType} (
                            {selectedEngineer.vehicleId})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Coordinates
                          </p>
                          <p>
                            {selectedEngineer.coordinates?.lat.toFixed(4)},
                            {selectedEngineer.coordinates?.lng.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Last Active
                          </p>
                          <p>
                            {selectedEngineer.lastActive
                              ? new Date(
                                  selectedEngineer.lastActive
                                ).toLocaleTimeString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <Button>Contact Engineer</Button>
                        <Button variant="outline">Assign Ticket</Button>
                        <Button variant="outline">View Routes</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
