"use client";

import { useState, useEffect } from "react";
import { useGoogleMapsApi, SURAT_CENTER } from "@/hooks/use-google-maps-api";
import { Geofence } from "@/lib/types";
import {
  getGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from "@/lib/firebase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { MapPinned, Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GeofenceManagementPage() {
  const { toast } = useToast();
  const { isLoaded: isMapsApiLoaded, error: mapsApiError } = useGoogleMapsApi();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [circles, setCircles] = useState<google.maps.Circle[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "office" as "office" | "site" | "restricted" | "other",
    radius: 500,
    description: "",
    center: SURAT_CENTER,
  });

  // Initialize map
  useEffect(() => {
    if (isMapsApiLoaded && !map) {
      const mapInstance = new google.maps.Map(
        document.getElementById("map") as HTMLElement,
        {
          center: SURAT_CENTER,
          zoom: 12,
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
        }
      );

      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          setFormData((prev) => ({
            ...prev,
            center: {
              lat: e.latLng!.lat(),
              lng: e.latLng!.lng(),
            },
          }));
        }
      });

      setMap(mapInstance);
    }
  }, [isMapsApiLoaded]);

  // Load geofences
  useEffect(() => {
    const loadGeofences = async () => {
      try {
        const data = await getGeofences();
        setGeofences(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load geofences",
        });
        console.error(error);
      }
    };

    loadGeofences();
  }, []);

  // Update map markers and circles when geofences change
  useEffect(() => {
    if (!map || !isMapsApiLoaded) return;

    // Clear existing markers and circles
    markers.forEach((marker) => marker.setMap(null));
    circles.forEach((circle) => circle.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const newCircles: google.maps.Circle[] = [];

    geofences.forEach((geofence) => {
      // Create marker
      const marker = new google.maps.Marker({
        position: geofence.center,
        map,
        title: geofence.name,
        label: geofence.name.charAt(0),
      });

      // Create circle
      const circle = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        center: geofence.center,
        radius: geofence.radius,
      });

      newMarkers.push(marker);
      newCircles.push(circle);
    });

    setMarkers(newMarkers);
    setCircles(newCircles);
  }, [map, geofences, isMapsApiLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedGeofence) {
        await updateGeofence(selectedGeofence.id, formData);
        toast({
          title: "Success",
          description: "Geofence updated successfully",
        });
      } else {
        await createGeofence({
          ...formData,
          createdBy: "admin", // TODO: Get actual admin ID
        });
        toast({
          title: "Success",
          description: "Geofence created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save geofence",
      });
      console.error(error);
    }
  };

  const handleEdit = (geofence: Geofence) => {
    setSelectedGeofence(geofence);
    setFormData({
      name: geofence.name,
      type: geofence.type,
      radius: geofence.radius,
      description: geofence.description || "",
      center: geofence.center,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this geofence?")) {
      try {
        await deleteGeofence(id);
        toast({
          title: "Success",
          description: "Geofence deleted successfully",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete geofence",
        });
        console.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "office",
      radius: 500,
      description: "",
      center: SURAT_CENTER,
    });
    setSelectedGeofence(null);
    setIsEditing(false);
  };

  if (mapsApiError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          Error loading map: {mapsApiError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <MapPinned className="mr-2" />
          Geofence Management
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2" />
              Add Geofence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Geofence" : "Add New Geofence"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(
                    value: "office" | "site" | "restricted" | "other"
                  ) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="restricted">Restricted Zone</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="radius">Radius (meters)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="radius"
                    min={100}
                    max={5000}
                    step={100}
                    value={[formData.radius]}
                    onValueChange={([value]) =>
                      setFormData((prev) => ({ ...prev, radius: value }))
                    }
                    className="flex-1"
                  />
                  <span className="w-16 text-right">{formData.radius}m</span>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Click on the map to set the center location
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div id="map" className="w-full h-[600px] rounded-lg shadow-md" />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geofences</CardTitle>
              <CardDescription>Manage your geofences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {geofences.map((geofence) => (
                  <div
                    key={geofence.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">{geofence.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {geofence.radius}m radius
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(geofence)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(geofence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {geofences.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No geofences created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
