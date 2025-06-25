"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { getAllGeoFenceSites } from "@/lib/geofence-db";
import { Circle, GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import {
  addAttendanceLog,
  getPendingAttendanceLogs,
  updateAttendanceLog,
} from "../lib/attendance-db";

interface GeoFenceCheckInProps {
  userId: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 21.1702,
  lng: 72.8311,
};

export function GeoFenceCheckIn({ userId }: GeoFenceCheckInProps) {
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
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);

  const { toast } = useToast();

  const [showAutoCheckoutDialog, setShowAutoCheckoutDialog] = useState(false);
  const [pendingLogsCount, setPendingLogsCount] = useState(0);

  const [sites, setSites] = useState<GeoFenceSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<GeoFenceSite | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

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
        const R = 6371; // Radius of the Earth in km
        const toRad = (num: number) => (num * Math.PI) / 180;
        const dLat = toRad(coord2.latitude - coord1.latitude);
        const dLon = toRad(coord2.longitude - coord1.longitude);
        const lat1 = toRad(coord1.latitude);
        const lat2 = toRad(coord2.latitude);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      const googleCoord1 = new window.google.maps.LatLng(
        coord1.latitude,
        coord1.longitude
      );
      const googleCoord2 = new window.google.maps.LatLng(
        coord2.latitude,
        coord2.longitude
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
            await updateAttendanceLog(logToUpdate.id, {
              ...logToUpdate,
              syncStatus: "synced",
            });
        } else {
          const logToUpdate = pendingLogs.find((l) => l.logId === result.logId);
          if (logToUpdate)
            await updateAttendanceLog(logToUpdate.id, {
              ...logToUpdate,
              syncStatus: "failed",
            });
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
    if (!selectedSite) return;
    setIsCheckingIn(true);
    try {
      await addAttendanceLog({
        logId: crypto.randomUUID(),
        userId,
        siteId: selectedSite.id,
        siteName: selectedSite.name,
        checkInTime: new Date().toISOString(),
        checkOutTime: undefined,
        syncStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Check-in successful",
      });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  }, [selectedSite, userId, toast]);

  const handleCheckOut = useCallback(async () => {
    if (!currentLog || !geoFenceSite) return;
    const checkOutTime = new Date().toISOString();
    const updatedLog: AttendanceLog = {
      ...currentLog,
      checkOutTime,
      syncStatus: "pending",
    };
    try {
      await updateAttendanceLog(updatedLog.id, updatedLog);
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
        const response = await fetch(`/api/geofences/${selectedSite?.id}`);
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
  }, [selectedSite?.id]);

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
      selectedSite
    ) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: {
          lat: selectedSite.center.latitude,
          lng: selectedSite.center.longitude,
        },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    if (mapInstanceRef.current && selectedSite) {
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
        center: {
          lat: selectedSite.center.latitude,
          lng: selectedSite.center.longitude,
        },
        radius: selectedSite.radiusKm * 1000,
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
        mapInstanceRef.current.setCenter({
          lat: selectedSite.center.latitude,
          lng: selectedSite.center.longitude,
        });
      }
    }
    return () => {
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.setMap(null);
        geofenceCircleRef.current = null;
      }
    };
  }, [isMapsApiLoaded, selectedSite]);

  useEffect(() => {
    if (mapInstanceRef.current && currentPosition) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: {
            lat: currentPosition.latitude,
            lng: currentPosition.longitude,
          },
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
        userMarkerRef.current.setPosition({
          lat: currentPosition.latitude,
          lng: currentPosition.longitude,
        });
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
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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
    if (currentPosition && selectedSite) {
      const distance = calculateDistanceKm(
        currentPosition,
        selectedSite.center
      );
      const currentlyInZone = distance <= selectedSite.radiusKm;

      if (isInZone !== currentlyInZone) {
        setIsInZone(currentlyInZone);

        // If was in zone but now out of zone and checked in
        if (!currentlyInZone && isCheckedIn && currentLog) {
          // Show confirmation dialog instead of auto checkout
          setShowAutoCheckoutDialog(true);
        } else if (currentlyInZone && !isCheckedIn) {
          toast({
            title: "In Zone",
            description: `You have entered ${selectedSite.name}. You can now check in.`,
          });
        }
      }
    } else {
      setIsInZone(false);
    }
  }, [
    currentPosition,
    selectedSite,
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
            position: {
              lat: eng.location.latitude,
              lng: eng.location.longitude,
            },
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

  useEffect(() => {
    loadSites();
    getUserLocation();
  }, []);

  async function loadSites() {
    try {
      const sites = await getAllGeoFenceSites();
      setSites(sites);
    } catch (error) {
      console.error("Error loading sites:", error);
      toast({
        title: "Error",
        description: "Failed to load geofence sites",
        variant: "destructive",
      });
    }
  }

  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "Failed to get your location",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  }

  let statusMessage;
  if (isLoadingPosition || isLoadingSite) {
    statusMessage = "Loading data...";
  } else if (error) {
    statusMessage = error;
  } else if (!currentPosition) {
    statusMessage = "Waiting for location data...";
  } else if (!selectedSite) {
    statusMessage = "Geofence data not available.";
  } else if (isInZone) {
    statusMessage = `You are inside ${selectedSite.name}.`;
  } else {
    statusMessage = `You are outside ${selectedSite.name}. Move into the geofence to check-in.`;
  }

  return (
    <div className="h-[600px] relative">
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={
            userLocation
              ? { lat: userLocation.latitude, lng: userLocation.longitude }
              : defaultCenter
          }
          zoom={15}
        >
          {userLocation && (
            <Marker
              position={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              }}
            />
          )}
          {sites.map((site) => (
            <Circle
              key={site.id}
              center={{
                lat: site.center.latitude,
                lng: site.center.longitude,
              }}
              radius={site.radiusKm * 1000}
              options={{
                strokeColor:
                  selectedSite?.id === site.id ? "#0000FF" : "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: selectedSite?.id === site.id ? "#0000FF" : "#FF0000",
                fillOpacity: 0.2,
              }}
              onClick={() => setSelectedSite(site)}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      <Card className="absolute bottom-4 left-4 right-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Available Sites</h3>
              <p className="text-sm text-muted-foreground">
                {selectedSite
                  ? `Selected: ${selectedSite.name}`
                  : "Click on a site to select"}
              </p>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={!selectedSite || isCheckingIn}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>
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
              You have left the {selectedSite?.name} geofence. Would you like to
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
