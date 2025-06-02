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
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";
import type {
  AttendanceLog,
  Coordinates,
  Engineer,
  GeoFenceSite,
} from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
// Removed isPointInPolygon, will use distance calculation
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  RefreshCw,
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

  const [showAutoCheckoutDialog, setShowAutoCheckoutDialog] = useState(false);
  const [pendingLogsCount, setPendingLogsCount] = useState(0);

  // Add a function to check for pending logs count
  const checkPendingLogs = useCallback(async () => {
    try {
      const pendingLogs = await getPendingAttendanceLogs();
      setPendingLogsCount(pendingLogs.length);
    } catch (error) {
      console.error("Failed to check pending logs:", error);
    }
  }, []);

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

  // Update enhancedAttemptSync to handle syncing state completely
  const enhancedAttemptSync = useCallback(async () => {
    if (isSyncing || (typeof navigator !== "undefined" && !navigator.onLine)) {
      return;
    }

    setIsSyncing(true);
    try {
      // First check pending logs
      const pendingLogs = await getPendingAttendanceLogs();
      setPendingLogsCount(pendingLogs.length);

      if (pendingLogs.length === 0) {
        return;
      }

      // Then attempt to sync them
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

      // Show success toast
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
      // Check final pending logs status
      const finalPendingLogs = await getPendingAttendanceLogs();
      setPendingLogsCount(finalPendingLogs.length);
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
        // Update pending logs count after check-in
        checkPendingLogs();
        // Try to sync immediately
        enhancedAttemptSync();
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
  }, [
    geoFenceSite,
    isInZone,
    userId,
    toast,
    checkPendingLogs,
    enhancedAttemptSync,
  ]);

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
      // Update pending logs count after check-out
      checkPendingLogs();
      // Try to sync immediately
      enhancedAttemptSync();
    } catch (dbError) {
      console.error("Failed to log check-out:", dbError);
      toast({
        variant: "destructive",
        title: "Check-Out Failed",
        description: "Could not save check-out locally.",
      });
    }
  }, [currentLog, geoFenceSite, toast, checkPendingLogs, enhancedAttemptSync]);

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

        // If was in zone but now out of zone and checked in
        if (!currentlyInZone && isCheckedIn && currentLog) {
          // Show confirmation dialog instead of auto checkout
          setShowAutoCheckoutDialog(true);
        } else if (currentlyInZone && !isCheckedIn) {
          toast({
            title: "In Zone",
            description: `You have entered ${geoFenceSite.name}. You can now check in.`,
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

  // Remove the original attemptSync and update the online/offline useEffect
  useEffect(() => {
    // Check pending logs on mount and when coming back online
    checkPendingLogs();

    if (typeof navigator !== "undefined" && navigator.onLine)
      enhancedAttemptSync();
    const handleOnline = () => {
      checkPendingLogs();
      enhancedAttemptSync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [enhancedAttemptSync, checkPendingLogs]);

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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {isInZone
                    ? "Ready to check in"
                    : "Move into geofence to enable check-in"}
                </Label>
                {isInZone && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Inside Geofence
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleCheckIn}
                disabled={
                  !isInZone || isLoadingPosition || isLoadingSite || !!error
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Check In
              </Button>
              {!isInZone && !isLoadingPosition && !isLoadingSite && !error && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  You must be inside the geofence to check-in
                </p>
              )}
            </div>
          )}

          {isCheckedIn && currentLog && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Currently Checked In
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Since {format(new Date(currentLog.checkInTime), "h:mm a")}
                </p>
              </div>
              <Button
                onClick={handleCheckOut}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <LogOut className="mr-2 h-4 w-4" /> Check Out
              </Button>
            </div>
          )}

          {currentLog && (
            <Card className="mt-4 bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Current Shift Summary</span>
                  <Badge
                    variant={
                      currentLog.syncStatus === "synced"
                        ? "outline"
                        : "secondary"
                    }
                    className={cn(
                      currentLog.syncStatus === "synced"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : currentLog.syncStatus === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {currentLog.syncStatus === "synced"
                      ? "Synced"
                      : currentLog.syncStatus === "failed"
                      ? "Sync Failed"
                      : "Pending Sync"}
                  </Badge>
                </CardTitle>
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
                {currentLog.syncStatus !== "synced" && (
                  <div className="pt-2">
                    <Button
                      onClick={() => enhancedAttemptSync()}
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={
                        isSyncing ||
                        (typeof navigator !== "undefined" && !navigator.onLine)
                      }
                    >
                      {isSyncing ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-3 w-3" />
                      )}
                      {isSyncing ? "Syncing..." : "Retry Sync"}
                    </Button>
                    {typeof navigator !== "undefined" && !navigator.onLine && (
                      <p className="text-xs text-amber-600 mt-1 text-center">
                        You are offline. Will sync when back online.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={enhancedAttemptSync}
            disabled={isSyncing || pendingLogsCount === 0}
            variant={pendingLogsCount > 0 ? "default" : "outline"}
            className="w-full"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing
              ? "Syncing..."
              : pendingLogsCount > 0
              ? `Sync Now (${pendingLogsCount} pending)`
              : "All Synced"}
          </Button>

          {typeof navigator !== "undefined" && !navigator.onLine && (
            <p className="text-xs text-amber-600 text-center">
              You are offline. Connect to the internet to sync.
            </p>
          )}
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

      <AlertDialog
        open={showAutoCheckoutDialog}
        onOpenChange={setShowAutoCheckoutDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              You have left the {geoFenceSite?.name} geofence. Would you like to
              check out now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Checked In</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleCheckOut();
                setShowAutoCheckoutDialog(false);
              }}
            >
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
