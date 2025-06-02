"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGoogleMapsApi, SURAT_CENTER } from "@/hooks/use-google-maps-api";
import { getCachedRoute, setCachedRoute, clearOldCache } from "@/lib/indexeddb";
import type { RoutePoint, RouteStop, Engineer } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  Play,
  Pause,
  RefreshCw,
  FastForward,
  AlertTriangle,
  MapPinned,
  Milestone,
  Router,
} from "lucide-react";
import { cn } from "@/lib/utils";
import db from "@/lib/db.json";

// Add type assertions for db.json
// This tells TypeScript that routeData can be indexed with any string key
const typedDb = {
  ...db,
  routeData: db.routeData as Record<string, RoutePoint[]>,
};

// Updated to use engineers from db.json
const IDLE_SPEED_THRESHOLD_KMH = 5;
const MIN_STOP_DURATION_MINUTES = 5;

export default function RoutePlaybackPage() {
  const { isLoaded: isMapsApiLoaded, error: mapsApiError } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [engineers, setEngineers] = useState<Pick<Engineer, "id" | "name">[]>(
    []
  );

  const [selectedEngineerId, setSelectedEngineerId] = useState<
    string | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date("2024-07-30")
  );

  const [routeData, setRouteData] = useState<RoutePoint[]>([]);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const [currentRouteProgress, setCurrentRouteProgress] = useState(0); // 0 to 1
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Refs for map objects to manage them (e.g., clear them)
  const polylineRefs = useRef<google.maps.Polyline[]>([]);
  const stopMarkerRefs = useRef<google.maps.Marker[]>([]);
  const movingMarkerRef = useRef<google.maps.Marker | null>(null);

  // Load engineers from db.json
  useEffect(() => {
    // Filter out engineers with data
    const availableEngineers = db.engineers
      .filter((eng) => {
        // Check if this engineer has route data
        const routeKeys = Object.keys(typedDb.routeData || {});
        return routeKeys.some((key) => key.startsWith(`${eng.id}-`));
      })
      .map((eng) => ({
        id: eng.id,
        name: eng.name,
      }));

    setEngineers(availableEngineers);

    // Set default selected engineer if available
    if (availableEngineers.length > 0 && !selectedEngineerId) {
      setSelectedEngineerId(availableEngineers[0].id);
    }
  }, [selectedEngineerId]);

  const clearMapObjects = useCallback(() => {
    polylineRefs.current.forEach((p) => p.setMap(null));
    polylineRefs.current = [];
    stopMarkerRefs.current.forEach((m) => m.setMap(null));
    stopMarkerRefs.current = [];
    if (movingMarkerRef.current) {
      movingMarkerRef.current.setMap(null);
      movingMarkerRef.current = null;
    }
  }, []);

  const fetchAndProcessRouteData = useCallback(async () => {
    if (!selectedEngineerId || !selectedDate) return;
    setIsLoading(true);
    setError(null);
    setRouteData([]);
    setStops([]);
    clearMapObjects(); // Clear previous route from map

    const dateString = format(selectedDate, "yyyy-MM-dd");
    const cacheKey = `${selectedEngineerId}-${dateString}`;

    try {
      let data = await getCachedRoute(cacheKey);
      if (!data) {
        // Check if the route data exists in db.json
        if (typedDb.routeData && typedDb.routeData[cacheKey]) {
          data = typedDb.routeData[cacheKey];
          // Cache the data for future use
          if (data && data.length > 0) {
            await setCachedRoute(cacheKey, data);
          }
        } else {
          // Fallback to API if not found in db.json (in a real app)
          const response = await fetch(
            `/api/routes?engineerId=${selectedEngineerId}&date=${dateString}`
          );
          if (!response.ok)
            throw new Error(
              `Failed to fetch route data: ${response.statusText}`
            );
          data = await response.json();
          if (data && data.length > 0) {
            await setCachedRoute(cacheKey, data);
          }
        }
      }

      if (!data || data.length === 0) {
        setRouteData([]);
        setError("No route data found for the selected engineer and date.");
        return;
      }

      // Sort data by timestamp just in case it's not sorted
      data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setRouteData(data);

      // Process stops
      const calculatedStops: RouteStop[] = [];
      let stopCounter = 1;
      for (let i = 0; i < data.length - 1; i++) {
        const p1 = data[i];
        // Find the next point where the vehicle is moving or it's the end of the route
        let nextMovingPointIndex = i + 1;
        while (
          nextMovingPointIndex < data.length &&
          data[nextMovingPointIndex].speed < IDLE_SPEED_THRESHOLD_KMH
        ) {
          nextMovingPointIndex++;
        }

        if (p1.speed < IDLE_SPEED_THRESHOLD_KMH) {
          const stopStartTime = parseISO(p1.timestamp).getTime();
          // If it's the last point and it's an idle point, or if the next point is a moving one
          const stopEndTime = parseISO(
            data[nextMovingPointIndex - 1].timestamp
          ).getTime();
          const durationMs = stopEndTime - stopStartTime;
          const durationMinutes = durationMs / (1000 * 60);

          if (durationMinutes >= MIN_STOP_DURATION_MINUTES) {
            calculatedStops.push({
              ...p1,
              stopDurationMinutes: durationMinutes,
              stopNumber: stopCounter++,
            });
            i = nextMovingPointIndex - 1; // Skip points within this stop
          }
        }
      }
      setStops(calculatedStops);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      setRouteData([]);
    } finally {
      setIsLoading(false);
      setCurrentRouteProgress(0); // Reset progress for new route
      setIsPlaying(false); // Pause playback for new route
    }
  }, [selectedEngineerId, selectedDate, clearMapObjects]);

  useEffect(() => {
    fetchAndProcessRouteData();
    // Clear old cache entries periodically (e.g., on component mount)
    clearOldCache(7).catch(console.warn);
  }, [fetchAndProcessRouteData]);

  useEffect(() => {
    if (isMapsApiLoaded && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: SURAT_CENTER,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#f2f2f2" }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#dcdcdc" }],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#ececec" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#f2f2f2" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#c9c9c9" }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#e5e5e5" }],
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#f2f2f2" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ visibility: "on" }, { color: "#c9c9c9" }],
          },
        ],
      });
    }
    // Cleanup map instance on unmount? Not typical for single page app but can be done.
  }, [isMapsApiLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsApiLoaded || routeData.length === 0) {
      if (routeData.length > 0 && !mapInstanceRef.current) {
        console.warn("Map instance not ready for drawing route.");
      }

      // If map exists but no route data, center on Surat
      if (mapInstanceRef.current && routeData.length === 0) {
        mapInstanceRef.current.setCenter(SURAT_CENTER);
        mapInstanceRef.current.setZoom(13);
      }
      return;
    }

    clearMapObjects(); // Clear previous drawing before new one

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Draw heatmap polyline segments
    for (let i = 0; i < routeData.length - 1; i++) {
      const p1 = routeData[i];
      const p2 = routeData[i + 1];
      const pathSegment = [
        { lat: p1.lat, lng: p1.lng },
        { lat: p2.lat, lng: p2.lng },
      ];
      const avgSpeed = (p1.speed + p2.speed) / 2;
      const color = avgSpeed < IDLE_SPEED_THRESHOLD_KMH ? "#FF0000" : "#00FF00"; // Red for idle, Green for moving

      const polyline = new google.maps.Polyline({
        path: pathSegment,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map,
      });
      polylineRefs.current.push(polyline);
      pathSegment.forEach((pt) => bounds.extend(pt));
    }

    // Add stop markers
    stops.forEach((stop) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: map,
        label: stop.stopNumber?.toString() || "S",
        title: `Stop ${stop.stopNumber}: ${stop.stopDurationMinutes.toFixed(
          0
        )} min\nTime: ${format(parseISO(stop.timestamp), "p")}`,
      });
      stopMarkerRefs.current.push(marker);
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });

    // Initialize moving marker
    if (routeData.length > 0) {
      movingMarkerRef.current = new google.maps.Marker({
        position: { lat: routeData[0].lat, lng: routeData[0].lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4", // Blue
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
        },
        zIndex: 1000, // Ensure it's on top
      });
      bounds.extend({ lat: routeData[0].lat, lng: routeData[0].lng });
    }

    if (routeData.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds);
    } else if (routeData.length === 0 && mapRef.current) {
      // No data, reset view to Surat
      map.setCenter(SURAT_CENTER);
      map.setZoom(13);
    }
  }, [isMapsApiLoaded, routeData, stops, clearMapObjects]);

  // Animation Loop
  useEffect(() => {
    if (
      !isPlaying ||
      routeData.length < 2 ||
      !movingMarkerRef.current ||
      !mapInstanceRef.current
    ) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;
    const marker = movingMarkerRef.current;

    let totalRouteTimeMs = 0;
    if (routeData.length > 0) {
      totalRouteTimeMs =
        parseISO(routeData[routeData.length - 1].timestamp).getTime() -
        parseISO(routeData[0].timestamp).getTime();
    }
    if (totalRouteTimeMs === 0) totalRouteTimeMs = 1; // Avoid division by zero

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      let newProgress = currentRouteProgress; // Initialize newProgress with current state

      if (deltaTime > 0 && totalRouteTimeMs > 0) {
        const progressIncrement =
          (deltaTime / totalRouteTimeMs) * playbackSpeed;
        newProgress = currentRouteProgress + progressIncrement;

        if (newProgress >= 1) {
          newProgress = 1;
          setIsPlaying(false); // Auto-pause at end
        }
        setCurrentRouteProgress(newProgress);

        // Determine current position based on overall progress
        const currentTimeAlongRoute =
          parseISO(routeData[0].timestamp).getTime() +
          newProgress * totalRouteTimeMs;

        let currentSegment = 0;
        for (let i = 0; i < routeData.length - 1; i++) {
          const t1 = parseISO(routeData[i].timestamp).getTime();
          const t2 = parseISO(routeData[i + 1].timestamp).getTime();
          if (currentTimeAlongRoute >= t1 && currentTimeAlongRoute <= t2) {
            currentSegment = i;
            break;
          }
          if (i === routeData.length - 2 && currentTimeAlongRoute > t2) {
            // handles end of route
            currentSegment = i;
          }
        }

        const p1 = routeData[currentSegment];
        const p2 =
          routeData[Math.min(currentSegment + 1, routeData.length - 1)];
        const t1 = parseISO(p1.timestamp).getTime();
        const t2 = parseISO(p2.timestamp).getTime();

        const segmentDuration = t2 - t1;
        const fraction =
          segmentDuration > 0
            ? (currentTimeAlongRoute - t1) / segmentDuration
            : newProgress === 1
            ? 1
            : 0;

        const newLat = p1.lat + (p2.lat - p1.lat) * fraction;
        const newLng = p1.lng + (p2.lng - p1.lng) * fraction;

        if (google && google.maps) {
          // Check if google.maps is available
          const newPosition = new google.maps.LatLng(newLat, newLng);
          marker.setPosition(newPosition);

          // Optionally pan map to keep marker in view
          if (!map.getBounds()?.contains(newPosition)) {
            map.panTo(newPosition);
          }
        }
      }

      if (newProgress < 1 && isPlaying) {
        // Check isPlaying again as it might be set to false by newProgress check
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        lastFrameTimeRef.current = 0; // Reset for next play
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      lastFrameTimeRef.current = 0;
    };
  }, [
    isPlaying,
    routeData,
    playbackSpeed,
    currentRouteProgress,
    isMapsApiLoaded,
  ]); // Added isMapsApiLoaded

  const handlePlayPause = () => {
    if (routeData.length < 2) return;
    if (currentRouteProgress >= 1) {
      // If at end, replay
      setCurrentRouteProgress(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReplay = () => {
    if (routeData.length < 2) return;
    setCurrentRouteProgress(0);
    setIsPlaying(true);
  };

  const handleSpeedChange = () => {
    setPlaybackSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const totalDistanceKm = useMemo(() => {
    if (
      routeData.length < 2 ||
      !isMapsApiLoaded ||
      !google ||
      !google.maps ||
      !google.maps.geometry
    )
      return 0;
    const path = routeData.map((p) => new google.maps.LatLng(p.lat, p.lng));
    return google.maps.geometry.spherical.computeLength(path) / 1000;
  }, [routeData, isMapsApiLoaded]); // Added isMapsApiLoaded dependency

  const totalDuration = useMemo(() => {
    if (routeData.length < 2) return "00:00";
    const startTime = parseISO(routeData[0].timestamp).getTime();
    const endTime = parseISO(
      routeData[routeData.length - 1].timestamp
    ).getTime();
    const durationMs = endTime - startTime;
    if (durationMs <= 0) return "00:00";
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }, [routeData]);

  if (mapsApiError) {
    return (
      <div className="flex items-center justify-center h-screen p-4 container mx-auto">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>{mapsApiError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4 bg-gradient-to-br from-background to-secondary/20 container mx-auto">
      {" "}
      {/* Adjusted height and container */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <MapPinned className="mr-2" />
          Route Playback
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Select
            value={selectedEngineerId}
            onValueChange={setSelectedEngineerId}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Engineer" />
            </SelectTrigger>
            <SelectContent>
              {engineers.map((eng) => (
                <SelectItem key={eng.id} value={eng.id}>
                  {eng.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                disabled={(date) =>
                  date > new Date() || date < new Date("2024-01-01")
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0">
        <div
          className="flex-grow h-[300px] lg:h-full rounded-lg shadow-md overflow-hidden"
          ref={mapRef}
          id="mapContainer"
        />

        <Card className="lg:w-[320px] shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Milestone className="mr-2" />
              Route Summary
            </CardTitle>
            <CardDescription>Details for the selected route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <p className="text-muted-foreground">Loading summary...</p>
            )}
            {!isLoading && routeData.length > 0 && (
              <>
                <div>
                  <h4 className="font-semibold">Total Distance:</h4>
                  <p className="text-primary">
                    {totalDistanceKm.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Total Duration:</h4>
                  <p className="text-primary">{totalDuration} (hh:mm)</p>
                </div>
                <div>
                  <h4 className="font-semibold">
                    Stops (&gt;{MIN_STOP_DURATION_MINUTES} min):
                  </h4>
                  <p className="text-primary">{stops.length}</p>
                </div>
              </>
            )}
            {!isLoading && routeData.length === 0 && !error && (
              <p className="text-muted-foreground">No data to summarize.</p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold text-lg flex items-center">
                <Router className="mr-2" />
                Playback Controls
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handlePlayPause}
                  disabled={isLoading || routeData.length < 2}
                >
                  {isPlaying ? (
                    <Pause className="mr-2" />
                  ) : (
                    <Play className="mr-2" />
                  )}
                  {isPlaying
                    ? "Pause"
                    : currentRouteProgress > 0 && currentRouteProgress < 1
                    ? "Resume"
                    : "Play"}
                </Button>
                <Button
                  onClick={handleReplay}
                  variant="outline"
                  disabled={isLoading || routeData.length < 2}
                >
                  <RefreshCw className="mr-2" />
                  Replay
                </Button>
              </div>
              <Button
                onClick={handleSpeedChange}
                variant="outline"
                className="w-full"
                disabled={isLoading || routeData.length < 2}
              >
                <FastForward className="mr-2" />
                Speed: {playbackSpeed}x
              </Button>
              <div className="relative pt-2">
                <label
                  htmlFor="progress"
                  className="text-sm text-muted-foreground"
                >
                  Progress:
                </label>
                <progress
                  id="progress"
                  value={currentRouteProgress * 100}
                  max="100"
                  className="w-full h-2 rounded [&::-webkit-progress-bar]:rounded [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                ></progress>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {!isMapsApiLoaded && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <p className="text-lg text-primary animate-pulse">
            Loading Map Resources...
          </p>
        </div>
      )}
    </div>
  );
}
