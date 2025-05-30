"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";
import type {
  AttendanceLog,
  Coordinates,
  Engineer,
  GeoFenceSite,
} from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
// Removed isPointInPolygon, will use distance calculation
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addAttendanceLog,
  getAttendanceLogByLogId,
  getPendingAttendanceLogs,
  updateAttendanceLog,
} from "@/lib/attendance-db";
import { cn } from "@/lib/utils";
import { differenceInMinutes, format } from "date-fns";
import {
  CheckCircle,
  Loader2,
  LocateFixed,
  LogOut,
  Navigation,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface GeoFenceCheckInProps {
  siteId: string; // Used to fetch geofence center and radius
  userId: string;
}

const NEARBY_ENGINEER_SEARCH_RADIUS_KM = 5; // Default search radius for engineers

export function GeoFenceCheckIn({ siteId, userId }: GeoFenceCheckInProps) {
  const { isLoaded: isMapsApiLoaded, error: mapsApiError } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const geofenceCircleRef = useRef<google.maps.Circle | null>(null);
  const engineerMarkersRef = useRef<google.maps.Marker[]>([]);

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null
  );
  const [geoFenceSite, setGeoFenceSite] = useState<GeoFenceSite | null>(null); // Will store center and radius
  const [isInZone, setIsInZone] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentLog, setCurrentLog] = useState<AttendanceLog | null>(null);

  const [isLoadingSite, setIsLoadingSite] = useState(true);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [allEngineers, setAllEngineers] = useState<Engineer[]>([]);
  const [nearbyEngineers, setNearbyEngineers] = useState<Engineer[]>([]);
  const [isFetchingEngineers, setIsFetchingEngineers] = useState(false);
  const [engineerSearchTerm, setEngineerSearchTerm] = useState("");
  const [searchRadiusKm, setSearchRadiusKm] = useState(
    NEARBY_ENGINEER_SEARCH_RADIUS_KM
  );

  const { toast } = useToast();

  const calculateDistanceKm = useCallback(
    (coord1: Coordinates, coord2: Coordinates): number => {
      if (
        !isMapsApiLoaded ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.geometry
      ) {
        // Fallback or throw error if API not loaded - Haversine can be used here if needed
        // For simplicity, assuming API will be loaded for this to be called meaningfully
        console.warn(
          "Google Maps Geometry library not loaded for distance calculation."
        );
        const R = 6371; // Radius of the Earth in km
        const toRad = (num: number) => (num * Math.PI) / 180;
        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lng - coord1.lng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(coord1.lat)) *
            Math.cos(toRad(coord2.lat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      const googleCoord1 = new window.google.maps.LatLng(
        coord1.lat,
        coord1.lng
      );
      const googleCoord2 = new window.google.maps.LatLng(
        coord2.lat,
        coord2.lng
      );
      return (
        window.google.maps.geometry.spherical.computeDistanceBetween(
          googleCoord1,
          googleCoord2
        ) / 1000
      ); // Convert meters to km
    },
    [isMapsApiLoaded]
  );

  const attemptSync = useCallback(async () => {
    if (isSyncing || (typeof navigator !== "undefined" && !navigator.onLine)) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast({
          title: "Offline",
          description: "Attendance logs will sync when back online.",
          variant: "default",
        });
      }
      return;
    }
    setIsSyncing(true);
    try {
      const pendingLogs = await getPendingAttendanceLogs();
      if (pendingLogs.length === 0) {
        setIsSyncing(false);
        return;
      }
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingLogs),
      });
      if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`);
      const syncResults = await response.json();
      for (const result of syncResults.results) {
        if (result.synced) {
          const logToUpdate = pendingLogs.find((l) => l.logId === result.logId);
          if (logToUpdate)
            await updateAttendanceLog({ ...logToUpdate, syncStatus: "synced" });
        } else {
          const logToUpdate = pendingLogs.find((l) => l.logId === result.logId);
          if (logToUpdate)
            await updateAttendanceLog({ ...logToUpdate, syncStatus: "failed" });
          console.warn(`Log ${result.logId} failed to sync: ${result.message}`);
        }
      }
      toast({
        title: "Sync Successful",
        description: `${pendingLogs.length} logs synced.`,
      });
    } catch (syncError) {
      console.error("Sync error:", syncError);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not sync attendance logs to server.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast]);

  const handleCheckIn = useCallback(async () => {
    if (!geoFenceSite || !isInZone) return;
    const checkInTime = new Date().toISOString();
    const newLogEntry: Omit<AttendanceLog, "id"> = {
      logId: crypto.randomUUID(),
      siteId: geoFenceSite.id,
      siteName: geoFenceSite.name,
      checkInTime,
      syncStatus: "pending",
      userId: userId,
    };
    try {
      await addAttendanceLog(newLogEntry);
      const fullLog = await getAttendanceLogByLogId(newLogEntry.logId);
      if (fullLog) {
        setCurrentLog(fullLog);
        setIsCheckedIn(true);
        setSliderValue([0]);
        toast({
          title: "Check-In Successful",
          description: `Checked in at ${geoFenceSite.name} at ${format(
            new Date(checkInTime),
            "p"
          )}.`,
        });
        attemptSync();
      } else {
        throw new Error("Failed to retrieve saved log from DB.");
      }
    } catch (dbError) {
      console.error("Failed to log check-in:", dbError);
      toast({
        variant: "destructive",
        title: "Check-In Failed",
        description: "Could not save check-in locally.",
      });
    }
  }, [geoFenceSite, isInZone, userId, toast, attemptSync]);

  const handleCheckOut = useCallback(async () => {
    if (!currentLog || !geoFenceSite) return;
    const checkOutTime = new Date().toISOString();
    const updatedLog: AttendanceLog = {
      ...currentLog,
      checkOutTime,
      syncStatus: "pending",
    };
    try {
      await updateAttendanceLog(updatedLog);
      setCurrentLog(updatedLog);
      setIsCheckedIn(false);
      toast({
        title: "Check-Out Successful",
        description: `Checked out from ${geoFenceSite.name} at ${format(
          new Date(checkOutTime),
          "p"
        )}.`,
      });
      attemptSync();
    } catch (dbError) {
      console.error("Failed to log check-out:", dbError);
      toast({
        variant: "destructive",
        title: "Check-Out Failed",
        description: "Could not save check-out locally.",
      });
    }
  }, [currentLog, geoFenceSite, toast, attemptSync]);

  useEffect(() => {
    async function fetchGeoFence() {
      setIsLoadingSite(true);
      try {
        const response = await fetch(`/api/geofences/${siteId}`);
        if (!response.ok)
          throw new Error(`Failed to fetch geofence: ${response.statusText}`);
        const data: GeoFenceSite = await response.json();
        setGeoFenceSite(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load geofence data."
        );
      } finally {
        setIsLoadingSite(false);
      }
    }
    fetchGeoFence();
  }, [siteId]);

  useEffect(() => {
    async function fetchAllEngineers() {
      setIsFetchingEngineers(true);
      try {
        const response = await fetch("/api/engineers");
        if (!response.ok) throw new Error("Failed to fetch engineers");
        const data: Engineer[] = await response.json();
        setAllEngineers(data);
      } catch (err) {
        console.error("Error fetching engineers:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch engineer data.",
        });
      } finally {
        setIsFetchingEngineers(false);
      }
    }
    fetchAllEngineers();
  }, [toast]);

  useEffect(() => {
    if (
      isMapsApiLoaded &&
      mapRef.current &&
      !mapInstanceRef.current &&
      geoFenceSite
    ) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: geoFenceSite.center,
        zoom: 14, // Adjusted zoom for circular geofence view
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    if (mapInstanceRef.current && geoFenceSite) {
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.setMap(null);
      }
      geofenceCircleRef.current = new window.google.maps.Circle({
        strokeColor: "#4681C3",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#4681C3",
        fillOpacity: 0.2,
        map: mapInstanceRef.current,
        center: geoFenceSite.center,
        radius: geoFenceSite.radiusKm * 1000, // Radius in meters
      });
      if (
        mapInstanceRef.current.getZoom() &&
        mapInstanceRef.current.getZoom()! < 10
      ) {
        // Avoid fitting bounds if map is too zoomed out
        mapInstanceRef.current.fitBounds(
          geofenceCircleRef.current.getBounds()!
        );
      } else {
        mapInstanceRef.current.setCenter(geoFenceSite.center);
      }
    }
    return () => {
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.setMap(null);
        geofenceCircleRef.current = null;
      }
    };
  }, [isMapsApiLoaded, geoFenceSite]);

  useEffect(() => {
    if (mapInstanceRef.current && currentPosition) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: currentPosition,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#9B59B6",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
          },
          title: "Your Location",
        });
      } else {
        userMarkerRef.current.setPosition(currentPosition);
      }
    }
  }, [currentPosition, isMapsApiLoaded]);

  useEffect(() => {
    setIsLoadingPosition(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoadingPosition(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(newPos);
        setError(null);
        setIsLoadingPosition(false);
      },
      (err) => {
        console.error(`Geolocation error: ${err.message}`);
        setError(
          `Geolocation error: ${err.code} - ${err.message}. Please enable location services.`
        );
        setCurrentPosition(null);
        setIsLoadingPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (currentPosition && geoFenceSite) {
      const distance = calculateDistanceKm(
        currentPosition,
        geoFenceSite.center
      );
      const currentlyInZone = distance <= geoFenceSite.radiusKm;
      if (isInZone !== currentlyInZone) {
        setIsInZone(currentlyInZone);
        if (!currentlyInZone && isCheckedIn && currentLog) {
          handleCheckOut();
          toast({
            title: "Auto Check-Out",
            description: `You have left the ${geoFenceSite.name} geofence.`,
          });
        } else if (currentlyInZone && !isCheckedIn) {
          toast({
            title: "In Zone",
            description: `You have entered ${geoFenceSite.name}. Slide to check-in.`,
          });
        }
      }
    } else {
      setIsInZone(false);
    }
  }, [
    currentPosition,
    geoFenceSite,
    isCheckedIn,
    currentLog,
    handleCheckOut,
    toast,
    isInZone,
    calculateDistanceKm,
  ]);

  useEffect(() => {
    // Filter and display nearby engineers
    if (currentPosition && allEngineers.length > 0 && isMapsApiLoaded) {
      const filtered = allEngineers
        .map((engineer) => ({
          ...engineer,
          distanceKm: calculateDistanceKm(currentPosition, engineer.location),
        }))
        .filter(
          (engineer) =>
            engineer.distanceKm <= searchRadiusKm &&
            (engineerSearchTerm === "" ||
              engineer.name
                .toLowerCase()
                .includes(engineerSearchTerm.toLowerCase()))
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);
      setNearbyEngineers(filtered);

      // Clear old engineer markers
      engineerMarkersRef.current.forEach((marker) => marker.setMap(null));
      engineerMarkersRef.current = [];

      // Add new engineer markers
      if (mapInstanceRef.current) {
        filtered.forEach((eng) => {
          const marker = new window.google.maps.Marker({
            position: eng.location,
            map: mapInstanceRef.current,
            title: `${eng.name} (${eng.distanceKm.toFixed(1)} km away)`,
            icon: {
              // Simple blue dot for engineers
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: "#007bff",
              fillOpacity: 0.8,
              strokeWeight: 1,
              strokeColor: "white",
            },
          });
          engineerMarkersRef.current.push(marker);
        });
      }
    } else {
      setNearbyEngineers([]);
      engineerMarkersRef.current.forEach((marker) => marker.setMap(null));
      engineerMarkersRef.current = [];
    }
  }, [
    currentPosition,
    allEngineers,
    calculateDistanceKm,
    isMapsApiLoaded,
    engineerSearchTerm,
    searchRadiusKm,
  ]);

  const onSliderChange = (value: number[]) => {
    setSliderValue(value);
    if (value[0] === 100 && isInZone && !isCheckedIn) handleCheckIn();
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) attemptSync();
    const handleOnline = () => attemptSync();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [attemptSync]);

  let statusMessage;
  if (isLoadingPosition || isLoadingSite) {
    statusMessage = "Loading data...";
  } else if (error) {
    statusMessage = error;
  } else if (!currentPosition) {
    statusMessage = "Waiting for location data...";
  } else if (!geoFenceSite) {
    statusMessage = "Geofence data not available.";
  } else if (isInZone) {
    statusMessage = `You are inside ${geoFenceSite.name}.`;
  } else {
    statusMessage = `You are outside ${geoFenceSite.name}. Move into the geofence to check-in.`;
  }

  const sliderDisabled =
    !isInZone || isCheckedIn || isLoadingPosition || isLoadingSite || !!error;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <Card className="w-full lg:w-2/3 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LocateFixed className="mr-2 h-6 w-6 text-primary" />
            GeoFence
          </CardTitle>
          <CardDescription>
            {geoFenceSite
              ? `Site: ${geoFenceSite.name} (Radius: ${geoFenceSite.radiusKm} km)`
              : "Loading site information..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div ref={mapRef} className="h-64 md:h-80 w-full rounded-md bg-muted">
            {!isMapsApiLoaded && !mapsApiError && (
              <p className="p-4 text-center text-muted-foreground">
                Loading map...
              </p>
            )}
            {mapsApiError && (
              <Alert variant="destructive">
                <AlertTitle>Map Error</AlertTitle>
                <AlertDescription>{mapsApiError.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <Alert
            variant={
              error ? "destructive" : isInZone ? "default" : "destructive"
            }
            className={
              isInZone && !error
                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                : ""
            }
          >
            {isInZone && !error && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {!isInZone && !error && currentPosition && geoFenceSite && (
              <XCircle className="h-4 w-4 text-orange-600" />
            )}
            {error && <ShieldAlert className="h-4 w-4" />}
            <AlertTitle>
              {error ? "Error" : isInZone ? "In Zone" : "Out of Zone"}
            </AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>

          {!isCheckedIn && (
            <div className="space-y-2">
              <Label htmlFor="checkin-slider" className="text-sm font-medium">
                {isInZone
                  ? "Slide to Check-In"
                  : "Move into geofence to enable check-in"}
              </Label>
              <TooltipProvider>
                <Tooltip
                  open={
                    sliderDisabled &&
                    !isLoadingPosition &&
                    !isLoadingSite &&
                    !error &&
                    !isInZone
                      ? undefined
                      : false
                  }
                >
                  <TooltipTrigger asChild>
                    <div className={sliderDisabled ? "cursor-not-allowed" : ""}>
                      <Slider
                        id="checkin-slider"
                        value={sliderValue}
                        onValueChange={onSliderChange}
                        max={100}
                        step={1}
                        disabled={sliderDisabled}
                        className={cn(
                          "w-full",
                          sliderDisabled ? "opacity-50" : ""
                        )}
                        aria-label="Check-in slider"
                      />
                    </div>
                  </TooltipTrigger>
                  {sliderDisabled &&
                    !isLoadingPosition &&
                    !isLoadingSite &&
                    !error &&
                    !isInZone && (
                      <TooltipContent>
                        <p>You must be inside the geofence to check-in.</p>
                      </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {isCheckedIn && currentLog && (
            <Button
              onClick={handleCheckOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" /> Check Out
            </Button>
          )}

          {currentLog && (
            <Card className="mt-4 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Current Shift Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Site:</strong> {currentLog.siteName}
                </p>
                <p>
                  <strong>Check-In:</strong>{" "}
                  {format(
                    new Date(currentLog.checkInTime),
                    "MMM d, yyyy, h:mm a"
                  )}
                </p>
                {currentLog.checkOutTime ? (
                  <p>
                    <strong>Check-Out:</strong>{" "}
                    {format(
                      new Date(currentLog.checkOutTime),
                      "MMM d, yyyy, h:mm a"
                    )}
                  </p>
                ) : (
                  <p>
                    <strong>Status:</strong> Currently Checked In
                  </p>
                )}
                {currentLog.checkOutTime && (
                  <p>
                    <strong>Duration:</strong>{" "}
                    {differenceInMinutes(
                      new Date(currentLog.checkOutTime),
                      new Date(currentLog.checkInTime)
                    )}{" "}
                    minutes
                  </p>
                )}
                <p>
                  <strong>Sync Status:</strong>{" "}
                  <span
                    className={cn(
                      currentLog.syncStatus === "synced"
                        ? "text-green-600"
                        : "text-orange-500",
                      "capitalize"
                    )}
                  >
                    {currentLog.syncStatus}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={attemptSync}
            disabled={isSyncing}
            variant="outline"
            className="w-full"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}{" "}
            Sync Now
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full lg:w-1/3 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-6 w-6 text-primary" />
            Nearby Engineers
          </CardTitle>
          <CardDescription>
            Engineers within {searchRadiusKm} km of your location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Search engineer name..."
              value={engineerSearchTerm}
              onChange={(e) => setEngineerSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Input
              type="number"
              value={searchRadiusKm}
              onChange={(e) =>
                setSearchRadiusKm(parseFloat(e.target.value) || 0)
              }
              min="0.1"
              step="0.1"
              className="w-24"
              aria-label="Search radius in km"
            />
            <Label htmlFor="searchRadiusInput" className="text-sm shrink-0">
              km
            </Label>
          </div>
          {isFetchingEngineers && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />{" "}
              <span className="ml-2">Loading engineers...</span>
            </div>
          )}
          {!isFetchingEngineers && nearbyEngineers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No engineers found nearby matching criteria.
            </p>
          )}
          {!isFetchingEngineers && nearbyEngineers.length > 0 && (
            <ScrollArea className="h-[280px] md:h-[350px]">
              <ul className="space-y-3">
                {nearbyEngineers.map((engineer) => (
                  <li
                    key={engineer.id}
                    className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {engineer.avatar && (
                          <Image
                            data-ai-hint="person avatar"
                            src={engineer.avatar}
                            alt={engineer.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-sm">
                            {engineer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {engineer.specialization.join(", ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Navigation className="h-3 w-3 mr-1" />
                        {engineer.distanceKm?.toFixed(1)} km
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
