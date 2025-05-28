
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Alert, AlertSeverity, AlertStatus } from "@/lib/types";
import { useGoogleMapsApi } from '@/hooks/use-google-maps-api';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, Info, Mail, Bell, MapPin, X, Edit3, Eye, ShieldAlert, Clock, Car, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  isSelected: boolean;
  onSelectToggle: (alertId: string) => void;
  onStatusChange: (alertId: string, status: AlertStatus) => void;
  onNotificationChange: (alertId: string, type: 'push' | 'email', value: boolean) => void;
}

const severityConfig: Record<AlertSeverity, { color: string; icon: React.ElementType, borderColor: string }> = {
  high: { color: "text-red-500", icon: AlertTriangle, borderColor: "border-red-500" },
  medium: { color: "text-orange-500", icon: ShieldAlert, borderColor: "border-orange-500" },
  low: { color: "text-blue-500", icon: Info, borderColor: "border-blue-500" },
  info: { color: "text-sky-500", icon: Info, borderColor: "border-sky-500" },
};

const alertTypeIcons: Record<Alert["type"], React.ElementType> = {
  "Speeding": Car,
  "Long Idle": Clock,
  "Geofence Breach": Warehouse,
  "Service Due": Edit3,
  "Unusual Activity": Eye,
};


export function AlertCard({ alert, isSelected, onSelectToggle, onStatusChange, onNotificationChange }: AlertCardProps) {
  const { isLoaded: isMapsApiLoaded, error: mapsApiError } = useGoogleMapsApi();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const SeverityIcon = severityConfig[alert.severity].icon;
  const AlertTypeIcon = alertTypeIcons[alert.type];

  useEffect(() => {
    if (isAccordionOpen && isMapsApiLoaded && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: alert.location,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    if (mapInstanceRef.current && isMapsApiLoaded) {
       if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new window.google.maps.Marker({
        position: alert.location,
        map: mapInstanceRef.current,
        title: alert.locationSnippet,
      });
      mapInstanceRef.current.setCenter(alert.location);

      // If there's a route trace, draw it
      if (alert.routeTrace && alert.routeTrace.length > 0) {
        const routePath = new window.google.maps.Polyline({
          path: alert.routeTrace,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });
        routePath.setMap(mapInstanceRef.current);
        // Fit map to bounds of route trace if available
        const bounds = new window.google.maps.LatLngBounds();
        alert.routeTrace.forEach(point => bounds.extend(point));
        if(!bounds.isEmpty()) mapInstanceRef.current.fitBounds(bounds);
      }


    }
  }, [isAccordionOpen, isMapsApiLoaded, alert.location, alert.locationSnippet, alert.routeTrace]);

  const handleAccordionToggle = (value: string) => {
    setIsAccordionOpen(value === alert.id);
  };


  return (
    <Card className={cn("overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl", severityConfig[alert.severity].borderColor, "border-l-4")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             <Checkbox
              id={`select-${alert.id}`}
              checked={isSelected}
              onCheckedChange={() => onSelectToggle(alert.id)}
              aria-label={`Select alert ${alert.id}`}
              className="mt-1"
            />
            <SeverityIcon className={cn("h-6 w-6", severityConfig[alert.severity].color)} />
            <div>
              <CardTitle className="text-lg flex items-center">
                <AlertTypeIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                {alert.type}
              </CardTitle>
              <CardDescription className="text-xs">
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })} - {alert.engineerName}
              </CardDescription>
            </div>
          </div>
          <Badge variant={alert.status === 'new' ? 'destructive' : (alert.status === 'reviewed' ? 'secondary' : 'outline')} className="capitalize">
            {alert.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="h-4 w-4 mr-2 shrink-0" />
          {alert.locationSnippet}
        </p>
        {alert.details && <p className="text-sm mt-1">{alert.details}</p>}
      </CardContent>
      <Accordion type="single" collapsible value={isAccordionOpen ? alert.id : ""} onValueChange={handleAccordionToggle}>
        <AccordionItem value={alert.id} className="border-b-0">
          <AccordionTrigger className="px-6 py-3 text-sm hover:no-underline data-[state=open]:bg-muted/50">
            View Details & Map
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-0">
            <div className="space-y-4">
              {mapsApiError && <p className="text-red-500 text-xs">Error loading map: {mapsApiError.message}</p>}
              {!isMapsApiLoaded && !mapsApiError && <p className="text-xs text-muted-foreground">Loading map...</p>}
              <div ref={mapRef} className={cn("h-48 w-full rounded-md bg-muted", { 'hidden': !isMapsApiLoaded || mapsApiError })}></div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`push-${alert.id}`} className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4" /> Push Notifications
                  </Label>
                  <Switch
                    id={`push-${alert.id}`}
                    checked={alert.notifications.push}
                    onCheckedChange={(value) => onNotificationChange(alert.id, 'push', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`email-${alert.id}`} className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" /> Email Notifications
                  </Label>
                  <Switch
                    id={`email-${alert.id}`}
                    checked={alert.notifications.email}
                    onCheckedChange={(value) => onNotificationChange(alert.id, 'email', value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {alert.status !== 'reviewed' && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(alert.id, 'reviewed')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Reviewed
                  </Button>
                )}
                {alert.status !== 'dismissed' && (
                  <Button size="sm" variant="destructive" onClick={() => onStatusChange(alert.id, 'dismissed')}>
                    <X className="mr-2 h-4 w-4" /> Dismiss Alert
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
