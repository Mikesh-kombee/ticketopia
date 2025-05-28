
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGoogleMapsApi } from '@/hooks/use-google-maps-api';
import type { Coordinates, GeoFenceSite, AttendanceLog } from '@/lib/types';
import { isPointInPolygon } from '@/lib/geofence-utils';
import { addAttendanceLog, getPendingAttendanceLogs, updateAttendanceLog, getAttendanceLogByLogId } from '@/lib/attendance-db';
import { format, differenceInMinutes } from 'date-fns';
import { MapPin, CheckCircle, XCircle, Loader2, LocateFixed, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface GeoFenceCheckInProps {
  siteId: string;
  userId: string; // Assuming a user ID is passed for logging
}

const MOCK_USER_ID = "user-mock-001"; // Replace with actual user management

export function GeoFenceCheckIn({ siteId, userId }: GeoFenceCheckInProps) {
  const { isLoaded: isMapsApiLoaded, error: mapsApiError } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const geofencePolygonRef = useRef<google.maps.Polygon | null>(null);

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [geoFenceSite, setGeoFenceSite] = useState<GeoFenceSite | null>(null);
  const [isInZone, setIsInZone] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentLog, setCurrentLog] = useState<AttendanceLog | null>(null);
  
  const [isLoadingSite, setIsLoadingSite] = useState(true);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isSyncing, setIsSyncing] = useState(false);

  const { toast } = useToast();

  // Moved Callbacks before useEffects that might use them

  const attemptSync = useCallback(async () => {
    if (isSyncing || typeof navigator !== 'undefined' && !navigator.onLine) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toast({ title: "Offline", description: "Attendance logs will sync when back online.", variant: "default"});
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

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingLogs),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const syncResults = await response.json();
      
      // Update local logs based on sync results
      for (const result of syncResults.results) {
          if (result.synced) {
            const logToUpdate = pendingLogs.find(l => l.logId === result.logId);
            if (logToUpdate) {
                await updateAttendanceLog({ ...logToUpdate, syncStatus: 'synced' });
            }
          } else {
            // Optionally mark as 'failed' or leave as 'pending' for retry
            const logToUpdate = pendingLogs.find(l => l.logId === result.logId);
             if (logToUpdate) {
                await updateAttendanceLog({ ...logToUpdate, syncStatus: 'failed' }); // or keep 'pending'
            }
            console.warn(`Log ${result.logId} failed to sync: ${result.message}`);
          }
      }
      toast({ title: "Sync Successful", description: `${pendingLogs.length} logs synced.` });
    } catch (syncError) {
      console.error("Sync error:", syncError);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not sync attendance logs to server." });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast]);

  const handleCheckIn = useCallback(async () => {
    if (!geoFenceSite || !isInZone) return;
    const checkInTime = new Date().toISOString();
    const newLogEntry: Omit<AttendanceLog, 'id'> = {
      logId: crypto.randomUUID(),
      siteId: geoFenceSite.id,
      siteName: geoFenceSite.name,
      checkInTime,
      syncStatus: 'pending',
      userId: userId,
    };

    try {
      await addAttendanceLog(newLogEntry);
      // Retrieve the full log with DB-generated ID to store in state
      const fullLog = await getAttendanceLogByLogId(newLogEntry.logId);
      if (fullLog) {
        setCurrentLog(fullLog);
        setIsCheckedIn(true);
        setSliderValue([0]); // Reset slider
        toast({ title: "Check-In Successful", description: `Checked in at ${geoFenceSite.name} at ${format(new Date(checkInTime), 'p')}.` });
        attemptSync();
      } else {
        throw new Error("Failed to retrieve saved log from DB.");
      }
    } catch (dbError) {
      console.error("Failed to log check-in:", dbError);
      toast({ variant: "destructive", title: "Check-In Failed", description: "Could not save check-in locally." });
    }
  }, [geoFenceSite, isInZone, userId, toast, attemptSync]);

  const handleCheckOut = useCallback(async () => {
    if (!currentLog || !geoFenceSite) return;
    const checkOutTime = new Date().toISOString();
    const updatedLog: AttendanceLog = {
      ...currentLog,
      checkOutTime,
      syncStatus: 'pending', // Mark for sync again
    };

    try {
      await updateAttendanceLog(updatedLog);
      setCurrentLog(updatedLog); // Update state with checkout time
      setIsCheckedIn(false);
      toast({ title: "Check-Out Successful", description: `Checked out from ${geoFenceSite.name} at ${format(new Date(checkOutTime), 'p')}.` });
      attemptSync();
    } catch (dbError) {
      console.error("Failed to log check-out:", dbError);
      toast({ variant: "destructive", title: "Check-Out Failed", description: "Could not save check-out locally." });
    }
  }, [currentLog, geoFenceSite, toast, attemptSync]);


  // Fetch Geofence Data
  useEffect(() => {
    async function fetchGeoFence() {
      setIsLoadingSite(true);
      try {
        const response = await fetch(`/api/geofences/${siteId}`);
        if (!response.ok) throw new Error(`Failed to fetch geofence: ${response.statusText}`);
        const data: GeoFenceSite = await response.json();
        setGeoFenceSite(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load geofence data.");
      } finally {
        setIsLoadingSite(false);
      }
    }
    fetchGeoFence();
  }, [siteId]);

  // Initialize Map and Geofence Polygon
  useEffect(() => {
    if (isMapsApiLoaded && mapRef.current && !mapInstanceRef.current && geoFenceSite) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: geoFenceSite.center,
        zoom: 15, // Adjust zoom as needed
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    if (mapInstanceRef.current && geoFenceSite && !geofencePolygonRef.current) {
      geofencePolygonRef.current = new window.google.maps.Polygon({
        paths: geoFenceSite.polygon,
        strokeColor: '#4681C3', // Primary blue
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4681C3', // Primary blue
        fillOpacity: 0.2,
        map: mapInstanceRef.current,
      });
      const bounds = new window.google.maps.LatLngBounds();
      geoFenceSite.polygon.forEach(pt => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }

    // Cleanup map objects on component unmount or geofence change
    return () => {
      if (geofencePolygonRef.current) {
        geofencePolygonRef.current.setMap(null);
        geofencePolygonRef.current = null;
      }
    };
  }, [isMapsApiLoaded, geoFenceSite]);

  // Update User Marker on Map
  useEffect(() => {
    if (mapInstanceRef.current && currentPosition) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: currentPosition,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#9B59B6', // Accent purple
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: 'white',
          },
          title: 'Your Location'
        });
      } else {
        userMarkerRef.current.setPosition(currentPosition);
      }
      // Optionally pan map if user moves far, but geofence bounds usually suffice
      // mapInstanceRef.current.panTo(currentPosition); 
    }
  }, [currentPosition, isMapsApiLoaded]);


  // Geolocation Tracking
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
        setError(`Geolocation error: ${err.code} - ${err.message}. Please enable location services.`);
        setCurrentPosition(null); // Clear position on error
        setIsLoadingPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Point-in-Polygon Check & Auto Check-out
  useEffect(() => {
    if (currentPosition && geoFenceSite) {
      const currentlyInZone = isPointInPolygon(currentPosition, geoFenceSite.polygon);
      
      if (isInZone !== currentlyInZone) { // State changed
        setIsInZone(currentlyInZone);
        if (!currentlyInZone && isCheckedIn && currentLog) { // Moved out of zone while checked in
          handleCheckOut();
          toast({ title: "Auto Check-Out", description: `You have left the ${geoFenceSite.name} geofence.` });
        } else if (currentlyInZone && !isCheckedIn) {
            toast({ title: "In Zone", description: `You have entered the ${geoFenceSite.name} geofence. Slide to check-in.` });
        }
      }
    } else {
      setIsInZone(false); // Not in zone if no position or geofence
    }
  }, [currentPosition, geoFenceSite, isCheckedIn, currentLog, handleCheckOut, toast, isInZone]);


  const onSliderChange = (value: number[]) => {
    setSliderValue(value);
    if (value[0] === 100 && isInZone && !isCheckedIn) {
      handleCheckIn();
    }
  };
  
  // Syncing logic
  useEffect(() => {
    // Attempt sync on initial load if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        attemptSync();
    }
    // Listen for online/offline events
    const handleOnline = () => attemptSync();
    window.addEventListener('online', handleOnline);
    return () => {
        window.removeEventListener('online', handleOnline);
    };
  }, [attemptSync]);


  let statusMessage = "Determining location and geofence status...";
  if (isLoadingPosition || isLoadingSite) statusMessage = "Loading data...";
  else if (error) statusMessage = error;
  else if (!currentPosition) statusMessage = "Waiting for location data...";
  else if (!geoFenceSite) statusMessage = "Geofence data not available.";
  else if (isInZone) statusMessage = `You are inside ${geoFenceSite.name}.`;
  else statusMessage = `You are outside ${geoFenceSite.name}. Move into the geofence to check-in.`;

  const sliderDisabled = !isInZone || isCheckedIn || isLoadingPosition || isLoadingSite || !!error;

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LocateFixed className="mr-2 h-6 w-6 text-primary" />
          GeoFence Attendance
        </CardTitle>
        <CardDescription>
          {geoFenceSite ? `Site: ${geoFenceSite.name}` : 'Loading site information...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={mapRef} className="h-64 w-full rounded-md bg-muted">
          {!isMapsApiLoaded && !mapsApiError && <p className="p-4 text-center text-muted-foreground">Loading map...</p>}
          {mapsApiError && <Alert variant="destructive"><AlertTitle>Map Error</AlertTitle><AlertDescription>{mapsApiError.message}</AlertDescription></Alert>}
        </div>
        
        <Alert variant={error ? "destructive" : (isInZone ? "default" : "default")} className={isInZone && !error ? "border-green-500 bg-green-50 dark:bg-green-900/30" : ""}>
          {isInZone && !error && <CheckCircle className="h-4 w-4 text-green-600" />}
          {!isInZone && !error && currentPosition && geoFenceSite && <XCircle className="h-4 w-4 text-orange-600" />}
          {error && <ShieldAlert className="h-4 w-4" />}
          <AlertTitle>{error ? "Error" : (isInZone ? "In Zone" : "Out of Zone")}</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>

        {!isCheckedIn && (
          <div className="space-y-2">
            <Label htmlFor="checkin-slider" className="text-sm font-medium">
              {isInZone ? "Slide to Check-In" : "Move into geofence to enable check-in"}
            </Label>
            <TooltipProvider>
              <Tooltip open={sliderDisabled && !isLoadingPosition && !isLoadingSite && !error && !isInZone ? undefined : false}>
                <TooltipTrigger asChild>
                  {/* The slider itself needs to be wrapped or have its own trigger for tooltip when disabled */}
                  <div className={sliderDisabled ? "cursor-not-allowed" : ""}>
                     <Slider
                        id="checkin-slider"
                        value={sliderValue}
                        onValueChange={onSliderChange}
                        max={100}
                        step={1}
                        disabled={sliderDisabled}
                        className={cn("w-full", sliderDisabled ? "opacity-50" : "")}
                        aria-label="Check-in slider"
                      />
                  </div>
                </TooltipTrigger>
                {sliderDisabled && !isLoadingPosition && !isLoadingSite && !error && !isInZone && (
                  <TooltipContent>
                    <p>You must be inside the geofence to check-in.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {isCheckedIn && currentLog && (
          <Button onClick={handleCheckOut} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Check Out
          </Button>
        )}

        {currentLog && (
          <Card className="mt-4 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Current Shift Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Site:</strong> {currentLog.siteName}</p>
              <p><strong>Check-In:</strong> {format(new Date(currentLog.checkInTime), 'MMM d, yyyy, h:mm a')}</p>
              {currentLog.checkOutTime ? (
                <p><strong>Check-Out:</strong> {format(new Date(currentLog.checkOutTime), 'MMM d, yyyy, h:mm a')}</p>
              ) : (
                <p><strong>Status:</strong> Currently Checked In</p>
              )}
              {currentLog.checkOutTime && (
                 <p><strong>Duration:</strong> {differenceInMinutes(new Date(currentLog.checkOutTime), new Date(currentLog.checkInTime))} minutes</p>
              )}
              <p><strong>Sync Status:</strong> <span className={cn(currentLog.syncStatus === 'synced' ? "text-green-600" : "text-orange-500", "capitalize")}>{currentLog.syncStatus}</span></p>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={attemptSync} disabled={isSyncing} variant="outline" className="w-full">
          {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sync Now
        </Button>
      </CardFooter>
    </Card>
  );
}

    