"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import type { Engineer } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MapPinned, User } from "lucide-react";

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadEngineers = async () => {
      try {
        const engineersRef = collection(db, "engineers");
        const querySnapshot = await getDocs(engineersRef);
        const loadedEngineers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Engineer[];
        setEngineers(loadedEngineers);
      } catch (err) {
        console.error("Error loading engineers:", err);
        setError("Failed to load engineers");
      } finally {
        setIsLoading(false);
      }
    };

    loadEngineers();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "On Route":
        return "bg-blue-500";
      case "On Break":
        return "bg-yellow-500";
      case "Offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading engineers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Engineers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Current Task</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engineers.map((engineer) => (
                <TableRow key={engineer.id}>
                  <TableCell className="font-medium">{engineer.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(
                        engineer.status
                      )} text-white`}
                    >
                      {engineer.status || "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {engineer.specialization?.join(", ") || "N/A"}
                  </TableCell>
                  <TableCell>
                    {engineer.currentTask || "No current task"}
                  </TableCell>
                  <TableCell>
                    {engineer.location ? (
                      <div className="flex items-center gap-1">
                        <MapPinned className="h-4 w-4" />
                        {engineer.location.lat.toFixed(4)},{" "}
                        {engineer.location.lng.toFixed(4)}
                      </div>
                    ) : (
                      "Unknown"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/engineers/${engineer.id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
