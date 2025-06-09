"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addGeoFenceSite,
  deleteGeoFenceSite,
  getAllGeoFenceSites,
  updateGeoFenceSite,
} from "@/lib/geofence-db";
import type { GeoFenceSite } from "@/lib/types";
import { Circle, GoogleMap, LoadScript } from "@react-google-maps/api";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 21.1702,
  lng: 72.8311,
};

export default function GeoFenceManagement() {
  const [sites, setSites] = useState<GeoFenceSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<GeoFenceSite | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSite, setNewSite] = useState<Partial<GeoFenceSite>>({
    name: "",
    radiusKm: 0.5, // Default 500 meters
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSites();
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

  function handleMapClick(e: google.maps.MapMouseEvent) {
    if ((isAdding || isEditing) && e.latLng) {
      const updates = {
        center: {
          latitude: e.latLng!.lat(),
          longitude: e.latLng!.lng(),
        },
      };
      if (isEditing && selectedSite) {
        setSelectedSite({ ...selectedSite, ...updates });
      } else {
        setNewSite((prev) => ({ ...prev, ...updates }));
      }
    }
  }

  async function handleAddSite() {
    if (!newSite.name || !newSite.center || !newSite.radiusKm) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addGeoFenceSite(newSite as Omit<GeoFenceSite, "id">);
      await loadSites();
      setIsAdding(false);
      setNewSite({ name: "", radiusKm: 0.5 });
      toast({
        title: "Success",
        description: "Geofence site added successfully",
      });
    } catch (error) {
      console.error("Error adding site:", error);
      toast({
        title: "Error",
        description: "Failed to add geofence site",
        variant: "destructive",
      });
    }
  }

  async function handleEditSite() {
    if (
      !selectedSite ||
      !selectedSite.name ||
      !selectedSite.center ||
      !selectedSite.radiusKm
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateGeoFenceSite(selectedSite.id, {
        name: selectedSite.name,
        center: selectedSite.center,
        radiusKm: selectedSite.radiusKm,
      });
      await loadSites();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Geofence site updated successfully",
      });
    } catch (error) {
      console.error("Error updating site:", error);
      toast({
        title: "Error",
        description: "Failed to update geofence site",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteSite(id: string) {
    try {
      await deleteGeoFenceSite(id);
      await loadSites();
      toast({
        title: "Success",
        description: "Geofence site deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting site:", error);
      toast({
        title: "Error",
        description: "Failed to delete geofence site",
        variant: "destructive",
      });
    }
  }

  function startEditing(site: GeoFenceSite) {
    setSelectedSite(site);
    setIsEditing(true);
    setIsAdding(false);
  }

  function cancelEditing() {
    setIsEditing(false);
    setSelectedSite(null);
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Geofence Sites</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(!isAdding);
              setIsEditing(false);
              setSelectedSite(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>

        {(isAdding || isEditing) && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? selectedSite?.name : newSite.name}
                    onChange={(e) =>
                      isEditing
                        ? setSelectedSite((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        : setNewSite((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                    }
                    placeholder="e.g., Surat HQ"
                  />
                </div>
                <div>
                  <Label htmlFor="radius">Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={
                      ((isEditing
                        ? selectedSite?.radiusKm ?? 0.5
                        : newSite.radiusKm) || 0.5) * 1000
                    }
                    onChange={(e) =>
                      isEditing
                        ? setSelectedSite((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  radiusKm: parseFloat(e.target.value) / 1000,
                                }
                              : null
                          )
                        : setNewSite((prev) => ({
                            ...prev,
                            radiusKm: parseFloat(e.target.value) / 1000,
                          }))
                    }
                    min="100"
                    step="100"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Click on the map to set the center location
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={isEditing ? handleEditSite : handleAddSite}
                    disabled={
                      isEditing
                        ? !selectedSite?.name || !selectedSite?.center
                        : !newSite.name || !newSite.center
                    }
                  >
                    {isEditing ? "Save Changes" : "Add Site"}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {sites.map((site) => (
            <Card
              key={site.id}
              className={`cursor-pointer ${
                selectedSite?.id === site.id ? "border-primary" : ""
              }`}
              onClick={() => {
                if (!isEditing) {
                  setSelectedSite(site);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{site.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Radius: {(site.radiusKm * 1000).toFixed(0)}m
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(site);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSite(site.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <LoadScript
          googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY!}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={13}
            onClick={handleMapClick}
            onLoad={setMap}
          >
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
                  fillColor:
                    selectedSite?.id === site.id ? "#0000FF" : "#FF0000",
                  fillOpacity: 0.2,
                }}
              />
            ))}
            {(isAdding || isEditing) &&
              (isEditing ? selectedSite?.center : newSite.center) && (
                <Circle
                  center={{
                    lat:
                      isEditing && selectedSite
                        ? selectedSite.center.latitude
                        : newSite.center!.latitude,
                    lng:
                      isEditing && selectedSite
                        ? selectedSite.center.longitude
                        : newSite.center!.longitude,
                  }}
                  radius={
                    (isEditing && selectedSite
                      ? selectedSite.radiusKm
                      : newSite.radiusKm || 0.5) * 1000
                  }
                  options={{
                    strokeColor: "#00FF00",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#00FF00",
                    fillOpacity: 0.2,
                  }}
                />
              )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
