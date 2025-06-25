"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addAttendanceLog } from "@/lib/attendance-db";
import { getAllGeoFenceSites } from "@/lib/geofence-db";
import type { Coordinates, GeoFenceSite } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Circle, Marker } from "@react-google-maps/api";
import { useAuth } from "@/hooks/use-auth";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 21.1702,
  lng: 72.8311,
};

export default function AttendanceCheckIn() {
  const [sites, setSites] = useState<GeoFenceSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<GeoFenceSite | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  async function handleCheckIn() {
    if (!userLocation || !selectedSite || !user) return;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      selectedSite.center.latitude,
      selectedSite.center.longitude
    );

    if (distance > selectedSite.radiusKm) {
      toast({
        title: "Error",
        description: "You are not within the geofence area",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      await addAttendanceLog({
        logId: crypto.randomUUID(),
        userId: user.uid,
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
  }

  return (
    <div className="h-[600px] relative">
      <LoadScript
        googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY!}
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
    </div>
  );
}
