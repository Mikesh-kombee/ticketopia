"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/client";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Clock, FileDown, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface EngineerPerformance {
  id: string;
  name: string;
  totalDistance: number;
  totalHours: number;
  nightShiftHours: number;
  safetyAlerts: number;
  geofenceBreaches: number;
  averageSpeed: number;
  lastActive: string;
}

interface MonthlyHours {
  id: string;
  name: string;
  regularHours: number;
  nightShiftHours: number;
  overtimeHours: number;
  totalHours: number;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [engineerPerformance, setEngineerPerformance] = useState<
    EngineerPerformance[]
  >([]);
  const [monthlyHours, setMonthlyHours] = useState<MonthlyHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // Get the start and end dates for the selected month
        const startDate = startOfMonth(parseISO(selectedMonth + "-01"));
        const endDate = endOfMonth(startDate);

        // Fetch route data for engineer performance
        const routeDataRef = collection(db, "routeData");
        const routeQuery = query(
          routeDataRef,
          where("timestamp", ">=", startDate),
          where("timestamp", "<=", endDate),
          orderBy("timestamp", "desc")
        );
        const routeSnapshot = await getDocs(routeQuery);

        // Process route data to calculate performance metrics
        const performanceMap = new Map<string, EngineerPerformance>();
        routeSnapshot.forEach((doc) => {
          const data = doc.data();
          const engineerId = data.engineerId;

          if (!performanceMap.has(engineerId)) {
            performanceMap.set(engineerId, {
              id: engineerId,
              name: data.engineerName,
              totalDistance: 0,
              totalHours: 0,
              nightShiftHours: 0,
              safetyAlerts: 0,
              geofenceBreaches: 0,
              averageSpeed: 0,
              lastActive: data.timestamp.toDate().toISOString(),
            });
          }

          const performance = performanceMap.get(engineerId)!;
          performance.totalDistance += data.distance || 0;
          performance.averageSpeed =
            (performance.averageSpeed + data.speed) / 2;
        });

        setEngineerPerformance(Array.from(performanceMap.values()));

        // Fetch attendance data for monthly hours
        const attendanceRef = collection(db, "attendance");
        const attendanceQuery = query(
          attendanceRef,
          where("date", ">=", startDate),
          where("date", "<=", endDate)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);

        // Process attendance data to calculate monthly hours
        const hoursMap = new Map<string, MonthlyHours>();
        attendanceSnapshot.forEach((doc) => {
          const data = doc.data();
          const engineerId = data.engineerId;

          if (!hoursMap.has(engineerId)) {
            hoursMap.set(engineerId, {
              id: engineerId,
              name: data.engineerName,
              regularHours: 0,
              nightShiftHours: 0,
              overtimeHours: 0,
              totalHours: 0,
            });
          }

          const hours = hoursMap.get(engineerId)!;
          hours.regularHours += data.regularHours || 0;
          hours.nightShiftHours += data.nightShiftHours || 0;
          hours.overtimeHours += data.overtimeHours || 0;
          hours.totalHours =
            hours.regularHours + hours.nightShiftHours + hours.overtimeHours;
        });

        setMonthlyHours(Array.from(hoursMap.values()));
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [selectedMonth]);

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              View and export engineer performance reports
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  return (
                    <SelectItem
                      key={format(date, "yyyy-MM")}
                      value={format(date, "yyyy-MM")}
                    >
                      {format(date, "MMMM yyyy")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Engineer Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Engineer Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Total Distance</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Night Shifts</TableHead>
                    <TableHead>Safety Alerts</TableHead>
                    <TableHead>Geofence Breaches</TableHead>
                    <TableHead>Avg. Speed</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : engineerPerformance.length > 0 ? (
                    engineerPerformance.map((engineer) => (
                      <TableRow key={engineer.id}>
                        <TableCell className="font-medium">
                          {engineer.name}
                        </TableCell>
                        <TableCell>
                          {(engineer.totalDistance / 1000).toFixed(1)} km
                        </TableCell>
                        <TableCell>{engineer.totalHours.toFixed(1)}h</TableCell>
                        <TableCell>
                          {engineer.nightShiftHours.toFixed(1)}h
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              engineer.safetyAlerts > 0
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {engineer.safetyAlerts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              engineer.geofenceBreaches > 0
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {engineer.geofenceBreaches}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {engineer.averageSpeed.toFixed(1)} km/h
                        </TableCell>
                        <TableCell>
                          {format(parseISO(engineer.lastActive), "PPp")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No performance data available for the selected month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Hours Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Monthly Hours Worked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Night Shifts</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : monthlyHours.length > 0 ? (
                    monthlyHours.map((hours) => (
                      <TableRow key={hours.id}>
                        <TableCell className="font-medium">
                          {hours.name}
                        </TableCell>
                        <TableCell>{hours.regularHours.toFixed(1)}h</TableCell>
                        <TableCell>
                          {hours.nightShiftHours.toFixed(1)}h
                        </TableCell>
                        <TableCell>{hours.overtimeHours.toFixed(1)}h</TableCell>
                        <TableCell className="font-medium">
                          {hours.totalHours.toFixed(1)}h
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No hours data available for the selected month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PrivateRoute>
  );
}
