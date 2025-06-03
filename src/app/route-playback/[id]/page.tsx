"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { format } from "date-fns";
import { ArrowLeft, FastForward, Pause, Play, RefreshCw } from "lucide-react";

// Surat center coordinates
const SURAT_CENTER = { lat: 21.1702, lng: 72.8311 };

interface RoutePoint {
  engineerId: string;
  engineerName: string;
  date: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  heading: number;
  accuracy: number;
}

export default function RoutePlaybackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded: isMapsApiLoaded } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [routeData, setRouteData] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentRouteProgress, setCurrentRouteProgress] = useState(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const polylineRefs = useRef<google.maps.Polyline[]>([]);
  const movingMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    async function fetchRouteData() {
      if (!params.id) return;
      const [engineerId, date] = (params.id as string).split("_");

      try {
        const routeDataRef = collection(db, "routeData");
        const q = query(
          routeDataRef,
          where("engineerId", "==", engineerId),
          where("date", "==", date),
          orderBy("timestamp", "asc")
        );

        const querySnapshot = await getDocs(q);
        const routes = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toISOString(),
        })) as RoutePoint[];

        setRouteData(routes);
      } catch (error) {
        console.error("Error fetching route data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRouteData();
  }, [params.id]);

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
  }, [isMapsApiLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsApiLoaded || routeData.length === 0) {
      if (routeData.length > 0 && !mapInstanceRef.current) {
        console.warn("Map instance not ready for drawing route.");
      }
      if (mapInstanceRef.current && routeData.length === 0) {
        mapInstanceRef.current.setCenter(SURAT_CENTER);
        mapInstanceRef.current.setZoom(13);
      }
      return;
    }

    // Clear previous route
    polylineRefs.current.forEach((p) => p.setMap(null));
    polylineRefs.current = [];
    if (movingMarkerRef.current) {
      movingMarkerRef.current.setMap(null);
      movingMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Draw route
    const path = routeData.map((p) => ({
      lat: p.location.lat,
      lng: p.location.lng,
    }));
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#4285F4",
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map,
    });
    polylineRefs.current.push(polyline);
    path.forEach((pt) => bounds.extend(pt));

    // Initialize moving marker
    if (routeData.length > 0) {
      movingMarkerRef.current = new google.maps.Marker({
        position: {
          lat: routeData[0].location.lat,
          lng: routeData[0].location.lng,
        },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
        },
        zIndex: 1000,
      });
      bounds.extend({
        lat: routeData[0].location.lat,
        lng: routeData[0].location.lng,
      });
    }

    if (routeData.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [isMapsApiLoaded, routeData]);

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
        new Date(routeData[routeData.length - 1].timestamp).getTime() -
        new Date(routeData[0].timestamp).getTime();
    }
    if (totalRouteTimeMs === 0) totalRouteTimeMs = 1;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      let newProgress = currentRouteProgress;

      if (deltaTime > 0 && totalRouteTimeMs > 0) {
        const progressIncrement =
          (deltaTime / totalRouteTimeMs) * playbackSpeed;
        newProgress = currentRouteProgress + progressIncrement;

        if (newProgress >= 1) {
          newProgress = 1;
          setIsPlaying(false);
        }
        setCurrentRouteProgress(newProgress);

        const currentTimeAlongRoute =
          new Date(routeData[0].timestamp).getTime() +
          newProgress * totalRouteTimeMs;

        let currentSegment = 0;
        for (let i = 0; i < routeData.length - 1; i++) {
          const t1 = new Date(routeData[i].timestamp).getTime();
          const t2 = new Date(routeData[i + 1].timestamp).getTime();
          if (currentTimeAlongRoute >= t1 && currentTimeAlongRoute <= t2) {
            currentSegment = i;
            break;
          }
          if (i === routeData.length - 2 && currentTimeAlongRoute > t2) {
            currentSegment = i;
          }
        }

        const p1 = routeData[currentSegment];
        const p2 =
          routeData[Math.min(currentSegment + 1, routeData.length - 1)];
        const t1 = new Date(p1.timestamp).getTime();
        const t2 = new Date(p2.timestamp).getTime();

        const segmentDuration = t2 - t1;
        const fraction =
          segmentDuration > 0
            ? (currentTimeAlongRoute - t1) / segmentDuration
            : newProgress === 1
            ? 1
            : 0;

        const newLat =
          p1.location.lat + (p2.location.lat - p1.location.lat) * fraction;
        const newLng =
          p1.location.lng + (p2.location.lng - p1.location.lng) * fraction;

        if (google && google.maps) {
          const newPosition = new google.maps.LatLng(newLat, newLng);
          marker.setPosition(newPosition);

          if (!map.getBounds()?.contains(newPosition)) {
            map.panTo(newPosition);
          }
        }
      }

      if (newProgress < 1 && isPlaying) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        lastFrameTimeRef.current = 0;
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
  ]);

  const handlePlayPause = () => {
    if (routeData.length < 2) return;
    if (currentRouteProgress >= 1) {
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

  if (isLoading || !isMapsApiLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-muted-foreground">Loading route data...</p>
      </div>
    );
  }

  if (routeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-destructive">No route data found</p>
      </div>
    );
  }

  const totalDistanceKm =
    routeData.length > 1 && window.google
      ? window.google.maps.geometry.spherical.computeLength(
          routeData.map(
            (p) => new window.google.maps.LatLng(p.location.lat, p.location.lng)
          )
        ) / 1000
      : 0;

  const totalDuration =
    routeData.length > 1
      ? (() => {
          const startTime = new Date(routeData[0].timestamp).getTime();
          const endTime = new Date(
            routeData[routeData.length - 1].timestamp
          ).getTime();
          const durationMs = endTime - startTime;
          if (durationMs <= 0) return "00:00";
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}`;
        })()
      : "00:00";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4 bg-gradient-to-br from-background to-secondary/20 container mx-auto">
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg shadow">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">
          Route Playback: {routeData[0].engineerName} -{" "}
          {format(new Date(routeData[0].date + "T00:00:00"), "PPP")}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0">
        <div
          className="flex-grow h-[300px] lg:h-full rounded-lg shadow-md overflow-hidden"
          ref={mapRef}
          id="mapContainer"
        />

        <Card className="lg:w-[320px] shrink-0">
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Total Distance:</h4>
              <p className="text-primary">{totalDistanceKm.toFixed(2)} km</p>
            </div>
            <div>
              <h4 className="font-semibold">Total Duration:</h4>
              <p className="text-primary">{totalDuration} (hh:mm)</p>
            </div>
            <div>
              <h4 className="font-semibold">Location Points:</h4>
              <p className="text-primary">{routeData.length}</p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold text-lg">Playback Controls</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handlePlayPause}
                  disabled={routeData.length < 2}
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
                  disabled={routeData.length < 2}
                >
                  <RefreshCw className="mr-2" />
                  Replay
                </Button>
              </div>
              <Button
                onClick={handleSpeedChange}
                variant="outline"
                className="w-full"
                disabled={routeData.length < 2}
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
    </div>
  );
}
