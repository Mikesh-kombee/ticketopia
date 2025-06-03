"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface CostSettings {
  fuelCost: number;
  maintenanceCost: number;
  otherCosts: number;
}

export default function CostSettingsForm() {
  const [settings, setSettings] = useState<CostSettings>({
    fuelCost: 0,
    maintenanceCost: 0,
    otherCosts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsRef = doc(db, "settings", "costSettings");
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as CostSettings);
        }
      } catch (error) {
        console.error("Error fetching cost settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const settingsRef = doc(db, "settings", "costSettings");
      await setDoc(settingsRef, settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving cost settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fuelCost">Fuel Cost per Kilometer (₹)</Label>
            <Input
              id="fuelCost"
              type="number"
              step="0.01"
              value={settings.fuelCost}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fuelCost: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenanceCost">
              Maintenance Cost per Kilometer (₹)
            </Label>
            <Input
              id="maintenanceCost"
              type="number"
              step="0.01"
              value={settings.maintenanceCost}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceCost: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otherCosts">Other Costs per Kilometer (₹)</Label>
            <Input
              id="otherCosts"
              type="number"
              step="0.01"
              value={settings.otherCosts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  otherCosts: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
