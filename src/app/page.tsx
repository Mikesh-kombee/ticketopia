"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ActiveEngineerSummary,
  AlertSeverity,
  AlertStatus,
  AttendanceRecordSummary,
  AttendanceStatus,
  DashboardAlertSummary,
  EngineerStatus,
  IssueType,
  OpenTicketSummary,
  RecentRouteLogSummary,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Route,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type SortableKeys<T> = keyof T;
type SortDirection = "asc" | "desc";

interface SortConfig<T> {
  key: SortableKeys<T> | null;
  direction: SortDirection;
}

const useSortableData = <T extends object>(
  items: T[] | undefined,
  initialSortKey: SortableKeys<T> | null = null
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey,
    direction: "asc",
  });

  const sortedItems = useMemo(() => {
    if (!items) return undefined;
    const sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === undefined || valA === null) return 1; // Put undefined/null last
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === "string" && typeof valB === "string") {
          return (
            valA.localeCompare(valB) * (sortConfig.direction === "asc" ? 1 : -1)
          );
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return (valA - valB) * (sortConfig.direction === "asc" ? 1 : -1);
        }
        // Fallback for date strings or other types
        const strA = String(valA);
        const strB = String(valB);
        return (
          strA.localeCompare(strB) * (sortConfig.direction === "asc" ? 1 : -1)
        );
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: SortableKeys<T>) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const statusColors: Record<
  | EngineerStatus
  | TicketStatus
  | AlertSeverity
  | AttendanceStatus
  | TicketPriority
  | AlertStatus,
  string
> = {
  Active: "bg-green-100 text-green-700",
  Offline: "bg-gray-100 text-gray-700",
  "On Break": "bg-yellow-100 text-yellow-700",
  "On Route": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Assigned: "bg-blue-100 text-blue-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  high: "bg-red-100 text-red-700",
  High: "bg-red-100 text-red-700",
  Urgent: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  Medium: "bg-orange-100 text-orange-700",
  low: "bg-blue-100 text-blue-700",
  Low: "bg-blue-100 text-blue-700",
  info: "bg-sky-100 text-sky-700",
  new: "bg-pink-100 text-pink-700", // for alert status 'new'
  reviewed: "bg-gray-100 text-gray-700",
  dismissed: "bg-gray-100 text-gray-700",
  "Checked In": "bg-green-100 text-green-700",
  "Checked Out": "bg-gray-100 text-gray-700",
  Late: "bg-yellow-100 text-yellow-700",
  Absent: "bg-red-100 text-red-700",
  "On Leave": "bg-purple-100 text-purple-700",
};

const priorityIcons: Record<TicketPriority, string> = {
  Urgent: "🚨",
  High: "🔥",
  Medium: "⚠️",
  Low: "🟢",
};

function SortableHeader<T>({
  columnKey,
  label,
  sortConfig,
  requestSort,
}: {
  columnKey: keyof T;
  label: string;
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
}) {
  return (
    <TableHead
      onClick={() => requestSort(columnKey)}
      className="cursor-pointer hover:bg-muted/50"
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === columnKey &&
          (sortConfig.direction === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );
}

function DashboardSection<T extends { id: string }>({
  title,
  icon: Icon,
  data,
  columns,
  sortConfig,
  requestSort,
  onRowClick,
  isLoading,
  viewAllLink,
  onRefresh,
}: {
  title: string;
  icon: React.ElementType;
  data: T[] | undefined;
  columns: {
    key: keyof T;
    label: string;
    render?: (item: T) => React.ReactNode;
  }[];
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
  onRowClick?: (item: T) => void;
  isLoading: boolean;
  viewAllLink?: string;
  onRefresh?: () => void;
}) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {viewAllLink && (
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href={viewAllLink}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <SortableHeader
                    key={String(column.key)}
                    columnKey={column.key}
                    label={column.label}
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data && data.length > 0 ? (
                data.slice(0, 5).map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                    }
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {column.render
                          ? column.render(item)
                          : String(item[column.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardHomePage() {
  const router = useRouter();

  // Mock data states with loading
  const [activeEngineers, setActiveEngineers] = useState<
    ActiveEngineerSummary[] | undefined
  >();
  const [openTickets, setOpenTickets] = useState<
    OpenTicketSummary[] | undefined
  >();
  const [routeLogs, setRouteLogs] = useState<
    RecentRouteLogSummary[] | undefined
  >();
  const [alerts, setAlerts] = useState<DashboardAlertSummary[] | undefined>();
  const [attendance, setAttendance] = useState<
    AttendanceRecordSummary[] | undefined
  >();

  const [loadingStates, setLoadingStates] = useState({
    engineers: true,
    tickets: true,
    routes: true,
    alerts: true,
    attendance: true,
  });

  // Sortable data hooks
  const engineersSort = useSortableData(activeEngineers, "name");
  const ticketsSort = useSortableData(openTickets, "priority");
  const routesSort = useSortableData(routeLogs, "date");
  const alertsSort = useSortableData(alerts, "timestamp");
  const attendanceSort = useSortableData(attendance, "checkInTime");

  // Mock data fetch
  const fetchData = useCallback(async () => {
    const mockDelay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Simulate API calls with different delays
    setTimeout(async () => {
      await mockDelay(500);
      setActiveEngineers([
        {
          id: "1",
          name: "John Doe",
          status: "Active" as EngineerStatus,
          currentLocation: "Downtown",
        },
        {
          id: "2",
          name: "Jane Smith",
          status: "On Route" as EngineerStatus,
          currentLocation: "Uptown",
        },
        {
          id: "3",
          name: "Mike Johnson",
          status: "On Break" as EngineerStatus,
          currentLocation: "Midtown",
        },
        {
          id: "4",
          name: "Sarah Wilson",
          status: "Active" as EngineerStatus,
          currentLocation: "Eastside",
        },
        {
          id: "5",
          name: "David Brown",
          status: "Offline" as EngineerStatus,
          currentLocation: "Westside",
        },
      ]);
      setLoadingStates((prev) => ({ ...prev, engineers: false }));
    }, 100);

    setTimeout(async () => {
      await mockDelay(700);
      setOpenTickets([
        {
          id: "T001",
          customerName: "ABC Corp",
          status: "Pending" as TicketStatus,
          priority: "High" as TicketPriority,
          assignedEngineerId: "1",
          issueType: "Plumbing" as IssueType,
          lastUpdate: "2023-12-15T10:30:00Z",
        },
        {
          id: "T002",
          customerName: "XYZ Ltd",
          status: "In Progress" as TicketStatus,
          priority: "Medium" as TicketPriority,
          assignedEngineerId: "2",
          issueType: "Electrical" as IssueType,
          lastUpdate: "2023-12-15T09:15:00Z",
        },
        {
          id: "T003",
          customerName: "DEF Inc",
          status: "Assigned" as TicketStatus,
          priority: "Urgent" as TicketPriority,
          assignedEngineerId: "3",
          issueType: "HVAC" as IssueType,
          lastUpdate: "2023-12-15T08:45:00Z",
        },
        {
          id: "T004",
          customerName: "GHI Co",
          status: "Pending" as TicketStatus,
          priority: "Low" as TicketPriority,
          assignedEngineerId: "4",
          issueType: "Plumbing" as IssueType,
          lastUpdate: "2023-12-15T07:30:00Z",
        },
        {
          id: "T005",
          customerName: "JKL Group",
          status: "In Progress" as TicketStatus,
          priority: "High" as TicketPriority,
          assignedEngineerId: "5",
          issueType: "Plumbing" as IssueType,
          lastUpdate: "2023-12-15T07:30:00Z",
        },
      ]);
      setLoadingStates((prev) => ({ ...prev, tickets: false }));
    }, 300);

    setTimeout(async () => {
      await mockDelay(600);
      setRouteLogs([
        {
          id: "R001",
          engineerName: "John Doe",
          date: "2023-12-15",
          distanceKm: 125.5,
          engineerId: "1",
          durationMinutes: 120,
          stops: 5,
          mapSnapshotUrl: "/images/routes/route-001.png",
        },
        {
          id: "R002",
          engineerName: "Jane Smith",
          date: "2023-12-15",
          distanceKm: 89.2,
          engineerId: "2",
          durationMinutes: 90,
          stops: 3,
          mapSnapshotUrl: "/images/routes/route-002.png",
        },
        {
          id: "R003",
          engineerName: "Mike Johnson",
          date: "2023-12-14",
          distanceKm: 156.8,
          engineerId: "3",
          durationMinutes: 180,
          stops: 7,
          mapSnapshotUrl: "/images/routes/route-003.png",
        },
        {
          id: "R004",
          engineerName: "Sarah Wilson",
          date: "2023-12-14",
          distanceKm: 203.4,
          engineerId: "4",
          durationMinutes: 240,
          stops: 9,
          mapSnapshotUrl: "/images/routes/route-004.png",
        },
        {
          id: "R005",
          engineerName: "David Brown",
          date: "2023-12-13",
          distanceKm: 78.9,
          engineerId: "5",
          durationMinutes: 75,
          stops: 4,
          mapSnapshotUrl: "/images/routes/route-005.png",
        },
      ]);
      setLoadingStates((prev) => ({ ...prev, routes: false }));
    }, 200);

    setTimeout(async () => {
      await mockDelay(800);
      setAlerts([
        {
          id: "A001",
          type: "Speeding",
          engineerName: "John Doe",
          timestamp: "2023-12-15T10:30:00Z",
          severity: "high" as AlertSeverity,
          status: "new" as AlertStatus,
          alertId: "A001",
        },
        {
          id: "A002",
          type: "Long Idle",
          engineerName: "Jane Smith",
          timestamp: "2023-12-15T09:15:00Z",
          severity: "medium" as AlertSeverity,
          status: "reviewed" as AlertStatus,
          alertId: "A002",
        },
        {
          id: "A003",
          type: "Geofence Breach",
          engineerName: "Mike Johnson",
          timestamp: "2023-12-15T08:45:00Z",
          severity: "info" as AlertSeverity,
          status: "dismissed" as AlertStatus,
          alertId: "A003",
        },
        {
          id: "A004",
          type: "Service Due",
          engineerName: "Sarah Wilson",
          timestamp: "2023-12-15T11:20:00Z",
          severity: "high" as AlertSeverity,
          status: "new" as AlertStatus,
          alertId: "A004",
        },
        {
          id: "A005",
          type: "Unusual Activity",
          engineerName: "David Brown",
          timestamp: "2023-12-15T07:30:00Z",
          severity: "low" as AlertSeverity,
          status: "reviewed" as AlertStatus,
          alertId: "A005",
        },
      ]);
      setLoadingStates((prev) => ({ ...prev, alerts: false }));
    }, 400);

    setTimeout(async () => {
      await mockDelay(900);
      setAttendance([
        {
          id: "AT001",
          engineerName: "John Doe",
          checkInTime: "08:00",
          status: "Checked In" as AttendanceStatus,
          engineerId: "1",
          date: "2024-03-20",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        },
        {
          id: "AT002",
          engineerName: "Jane Smith",
          checkInTime: "08:15",
          status: "Checked In" as AttendanceStatus,
          engineerId: "2",
          date: "2024-03-20",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
        },
        {
          id: "AT003",
          engineerName: "Mike Johnson",
          checkInTime: "08:30",
          status: "On Leave" as AttendanceStatus,
          engineerId: "3",
          date: "2024-03-20",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        },
        {
          id: "AT004",
          engineerName: "Sarah Wilson",
          checkInTime: "07:45",
          status: "Checked In" as AttendanceStatus,
          engineerId: "4",
          date: "2024-03-20",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
        {
          id: "AT005",
          engineerName: "David Brown",
          checkInTime: "09:00",
          status: "Late" as AttendanceStatus,
          engineerId: "5",
          date: "2024-03-20",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        },
      ]);
      setLoadingStates((prev) => ({ ...prev, attendance: false }));
    }, 500);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(() => {
    // Reset loading states
    setLoadingStates({
      engineers: true,
      tickets: true,
      routes: true,
      alerts: true,
      attendance: true,
    });

    // Clear current data
    setActiveEngineers(undefined);
    setOpenTickets(undefined);
    setRouteLogs(undefined);
    setAlerts(undefined);
    setAttendance(undefined);

    // Fetch new data
    fetchData();
  }, [fetchData]);

  // Navigation handlers
  const handleEngineerClick = (engineer: ActiveEngineerSummary) => {
    router.push(`/live-map?engineer=${engineer.id}`);
  };

  const handleTicketClick = (ticket: OpenTicketSummary) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleRouteClick = (route: RecentRouteLogSummary) => {
    router.push(`/routes?engineer=${route.engineerId}&date=${route.date}`);
  };

  const handleAlertClick = (alert: DashboardAlertSummary) => {
    router.push(`/alerts?id=${alert.id}`);
  };

  const handleAttendanceClick = (attendance: AttendanceRecordSummary) => {
    router.push(`/attendance?engineer=${attendance.engineerId}`);
  };

  return (
    <PrivateRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your field service operations
            </p>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Active Engineers */}
          <DashboardSection
            title="Active Engineers"
            icon={Users}
            data={engineersSort.items}
            sortConfig={engineersSort.sortConfig}
            requestSort={engineersSort.requestSort}
            onRowClick={handleEngineerClick}
            isLoading={loadingStates.engineers}
            viewAllLink="/live-map"
            onRefresh={() => {
              setLoadingStates((prev) => ({ ...prev, engineers: true }));
              setTimeout(() => {
                fetchData();
              }, 100);
            }}
            columns={[
              { key: "name", label: "Name" },
              {
                key: "status",
                label: "Status",
                render: (engineer) => (
                  <Badge
                    variant="secondary"
                    className={statusColors[engineer.status]}
                  >
                    {engineer.status}
                  </Badge>
                ),
              },
              { key: "currentLocation", label: "Location" },
            ]}
          />

          {/* Open Tickets */}
          <DashboardSection
            title="Open Tickets"
            icon={Ticket}
            data={ticketsSort.items}
            sortConfig={ticketsSort.sortConfig}
            requestSort={ticketsSort.requestSort}
            onRowClick={handleTicketClick}
            isLoading={loadingStates.tickets}
            viewAllLink="/tickets"
            onRefresh={() => {
              setLoadingStates((prev) => ({ ...prev, tickets: true }));
              setTimeout(() => {
                fetchData();
              }, 100);
            }}
            columns={[
              { key: "id", label: "Ticket ID" },
              { key: "customerName", label: "Customer" },
              {
                key: "status",
                label: "Status",
                render: (ticket) => (
                  <Badge
                    variant="secondary"
                    className={statusColors[ticket.status]}
                  >
                    {ticket.status}
                  </Badge>
                ),
              },
              {
                key: "priority",
                label: "Priority",
                render: (ticket) => (
                  <Badge
                    variant="secondary"
                    className={statusColors[ticket.priority]}
                  >
                    {priorityIcons[ticket.priority]} {ticket.priority}
                  </Badge>
                ),
              },
            ]}
          />

          {/* Recent Route Logs */}
          <DashboardSection
            title="Recent Route Logs"
            icon={Route}
            data={routesSort.items}
            sortConfig={routesSort.sortConfig}
            requestSort={routesSort.requestSort}
            onRowClick={handleRouteClick}
            isLoading={loadingStates.routes}
            viewAllLink="/routes"
            onRefresh={() => {
              setLoadingStates((prev) => ({ ...prev, routes: true }));
              setTimeout(() => {
                fetchData();
              }, 100);
            }}
            columns={[
              { key: "engineerName", label: "Engineer" },
              {
                key: "date",
                label: "Date",
                render: (route) => format(parseISO(route.date), "MMM dd"),
              },
              {
                key: "distanceKm",
                label: "Distance (km)",
                render: (route) => `${route.distanceKm.toFixed(1)} km`,
              },
            ]}
          />

          {/* Unread Alerts */}
          <DashboardSection
            title="Unread Alerts"
            icon={AlertTriangle}
            data={alertsSort.items}
            sortConfig={alertsSort.sortConfig}
            requestSort={alertsSort.requestSort}
            onRowClick={handleAlertClick}
            isLoading={loadingStates.alerts}
            viewAllLink="/alerts"
            onRefresh={() => {
              setLoadingStates((prev) => ({ ...prev, alerts: true }));
              setTimeout(() => {
                fetchData();
              }, 100);
            }}
            columns={[
              { key: "type", label: "Alert Type" },
              { key: "engineerName", label: "Engineer" },
              {
                key: "timestamp",
                label: "Time",
                render: (alert) =>
                  formatDistanceToNow(parseISO(alert.timestamp), {
                    addSuffix: true,
                  }),
              },
              {
                key: "severity",
                label: "Severity",
                render: (alert) => (
                  <Badge
                    variant="secondary"
                    className={statusColors[alert.severity]}
                  >
                    {alert.severity}
                  </Badge>
                ),
              },
            ]}
          />

          {/* Today's Attendance */}
          <DashboardSection
            title="Today's Attendance"
            icon={CalendarCheck}
            data={attendanceSort.items}
            sortConfig={attendanceSort.sortConfig}
            requestSort={attendanceSort.requestSort}
            onRowClick={handleAttendanceClick}
            isLoading={loadingStates.attendance}
            viewAllLink="/attendance"
            onRefresh={() => {
              setLoadingStates((prev) => ({ ...prev, attendance: true }));
              setTimeout(() => {
                fetchData();
              }, 100);
            }}
            columns={[
              { key: "engineerName", label: "Engineer" },
              { key: "checkInTime", label: "Check-in Time" },
              {
                key: "status",
                label: "Status",
                render: (attendance) => (
                  <Badge
                    variant="secondary"
                    className={statusColors[attendance.status]}
                  >
                    {attendance.status}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      </div>
    </PrivateRoute>
  );
}

export default DashboardHomePage;
