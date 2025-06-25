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
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type {
  ActiveEngineerSummary,
  AlertSeverity,
  AlertStatus,
  AttendanceRecordSummary,
  AttendanceStatus,
  DashboardAlertSummary,
  EngineerStatus,
  OpenTicketSummary,
  RecentRouteLogSummary,
  TicketPriority,
  TicketStatus
} from "@/lib/types";
import {
  AlertTriangle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Route,
  Ticket,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

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
}) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
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

  // Real-time data hooks
  const { data: activeEngineers, loading: engineersLoading } =
    useRealtimeData<ActiveEngineerSummary>("activeEngineers", {
      orderByField: "name",
      orderDirection: "asc",
    });

  const { data: openTickets, loading: ticketsLoading } =
    useRealtimeData<OpenTicketSummary>("openTickets", {
      orderByField: "lastUpdate",
      orderDirection: "desc",
    });

  const { data: routeLogs, loading: routesLoading } =
    useRealtimeData<RecentRouteLogSummary>("routeLogs", {
      orderByField: "date",
      orderDirection: "desc",
      limit: 5,
    });

  const { data: alerts, loading: alertsLoading } =
    useRealtimeData<DashboardAlertSummary>("alerts", {
      orderByField: "timestamp",
      orderDirection: "desc",
      limit: 5,
    });

  const { data: attendance, loading: attendanceLoading } =
    useRealtimeData<AttendanceRecordSummary>("attendance", {
      orderByField: "checkInTime",
      orderDirection: "desc",
    });

  // Sortable data hooks
  const engineersSort = useSortableData(activeEngineers, "name");
  const ticketsSort = useSortableData(openTickets, "priority");
  const routesSort = useSortableData(routeLogs, "date");
  const alertsSort = useSortableData(alerts, "timestamp");
  const attendanceSort = useSortableData(attendance, "checkInTime");

  // Click handlers
  const handleEngineerClick = (engineer: ActiveEngineerSummary) => {
    router.push(`/engineers/${engineer.id}`);
  };

  const handleTicketClick = (ticket: OpenTicketSummary) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleRouteClick = (route: RecentRouteLogSummary) => {
    router.push(`/route-playback/${route.id}`);
  };

  const handleAlertClick = (alert: DashboardAlertSummary) => {
    router.push(`/alerts/${alert.id}`);
  };

  const handleAttendanceClick = (attendance: AttendanceRecordSummary) => {
    router.push(`/attendance/${attendance.id}`);
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardSection
            title="Active Engineers"
            icon={Users}
            data={engineersSort.items}
            columns={[
              { key: "name", label: "Name" },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <Badge className={statusColors[item.status]}>
                    {item.status}
                  </Badge>
                ),
              },
              { key: "currentLocation", label: "Location" },
            ]}
            sortConfig={engineersSort.sortConfig}
            requestSort={engineersSort.requestSort}
            onRowClick={handleEngineerClick}
            isLoading={engineersLoading}
            viewAllLink="/engineers"
          />

          <DashboardSection
            title="Open Tickets"
            icon={Ticket}
            data={ticketsSort.items}
            columns={[
              { key: "customerName", label: "Customer" },
              {
                key: "priority",
                label: "Priority",
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <span>{priorityIcons[item.priority]}</span>
                    <Badge className={statusColors[item.priority]}>
                      {item.priority}
                    </Badge>
                  </div>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <Badge className={statusColors[item.status]}>
                    {item.status}
                  </Badge>
                ),
              },
            ]}
            sortConfig={ticketsSort.sortConfig}
            requestSort={ticketsSort.requestSort}
            onRowClick={handleTicketClick}
            isLoading={ticketsLoading}
            viewAllLink="/tickets"
          />

          <DashboardSection
            title="Recent Routes"
            icon={Route}
            data={routesSort.items}
            columns={[
              { key: "engineerName", label: "Engineer" },
              { key: "date", label: "Date" },
              {
                key: "distanceKm",
                label: "Distance",
                render: (item) => `${item.distanceKm} km`,
              },
            ]}
            sortConfig={routesSort.sortConfig}
            requestSort={routesSort.requestSort}
            onRowClick={handleRouteClick}
            isLoading={routesLoading}
            viewAllLink="/route-playback"
          />

          <DashboardSection
            title="Recent Alerts"
            icon={AlertTriangle}
            data={alertsSort.items}
            columns={[
              { key: "engineerName", label: "Engineer" },
              {
                key: "severity",
                label: "Severity",
                render: (item) => (
                  <Badge className={statusColors[item.severity]}>
                    {item.severity}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <Badge className={statusColors[item.status]}>
                    {item.status}
                  </Badge>
                ),
              },
            ]}
            sortConfig={alertsSort.sortConfig}
            requestSort={alertsSort.requestSort}
            onRowClick={handleAlertClick}
            isLoading={alertsLoading}
            viewAllLink="/alerts"
          />

          <DashboardSection
            title="Today's Attendance"
            icon={CalendarCheck}
            data={attendanceSort.items}
            columns={[
              { key: "engineerName", label: "Engineer" },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <Badge className={statusColors[item.status]}>
                    {item.status}
                  </Badge>
                ),
              },
              { key: "checkInTime", label: "Check In" },
            ]}
            sortConfig={attendanceSort.sortConfig}
            requestSort={attendanceSort.requestSort}
            onRowClick={handleAttendanceClick}
            isLoading={attendanceLoading}
            viewAllLink="/attendance"
          />
        </div>
      </div>
    </PrivateRoute>
  );
}

export default DashboardHomePage;
