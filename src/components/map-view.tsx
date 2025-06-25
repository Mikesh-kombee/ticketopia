"use client";

import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useMemo, useRef, useCallback, useEffect } from "react";
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface MapViewProps {
  alertLocation: RoutePoint;
  routePath?: RoutePoint[];
}

export default function MapView({ alertLocation, routePath }: MapViewProps) {
  const { isLoaded, error } = useGoogleMapsApi();
  const mapRef = useRef<google.maps.Map | null>(null);

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "400px",
      borderRadius: "0.5rem",
    }),
    []
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // This effect ensures the map resizes and fits the content correctly
  // once it's loaded and the data is available, especially within a dialog.
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      // Trigger the resize event to fix rendering issues in modals
      window.google.maps.event.trigger(mapRef.current, "resize");

      if (routePath && routePath.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        routePath.forEach((point) => bounds.extend(point));
        mapRef.current.fitBounds(bounds);
      } else {
        mapRef.current.setCenter(alertLocation);
        mapRef.current.setZoom(15);
      }
    }
  }, [alertLocation, routePath, isLoaded]);

  if (error) {
    return (
      <div className="text-red-500">
        Error loading maps. Please check the browser console for details about
        your API key or network issues.
      </div>
    );
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={alertLocation}
      zoom={8} // Initial zoom, will be adjusted by the useEffect
      onLoad={onMapLoad}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <Marker
        position={alertLocation}
        label={{ text: "A", color: "white" }}
        title="Alert Location"
      />
      {routePath && routePath.length > 0 && (
        <Polyline
          path={routePath}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  );
} 