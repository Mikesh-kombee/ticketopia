
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { 
  Users, Briefcase, Route, AlertTriangle, CalendarCheck, 
  ArrowDownUp, ChevronDown, ChevronUp, ExternalLink, Ticket,
  MapPinned, Settings, LogOut, Search, Filter, LayoutDashboardIcon, RefreshCw, FilePlus, LocateFixed
} from 'lucide-react';

import type { 
  ActiveEngineerSummary, OpenTicketSummary, RecentRouteLogSummary, 
  DashboardAlertSummary, AttendanceRecordSummary, EngineerStatus, TicketStatus, TicketPriority, AlertSeverity, AttendanceStatus
} from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type SortableKeys<T> = keyof T;
type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: SortableKeys<T> | null;
  direction: SortDirection;
}

const useSortableData = <T extends object>(items: T[] | undefined, initialSortKey: SortableKeys<T> | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ key: initialSortKey, direction: 'asc' });

  const sortedItems = useMemo(() => {
    if (!items) return undefined;
    let sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === undefined || valA === null) return 1; // Put undefined/null last
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        // Fallback for date strings or other types
        const strA = String(valA);
        const strB = String(valB);
        return strA.localeCompare(strB) * (sortConfig.direction === 'asc' ? 1 : -1);
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: SortableKeys<T>) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};


const statusColors: Record<EngineerStatus | TicketStatus | AlertSeverity | AttendanceStatus | TicketPriority, string> = {
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

const priorityIcons: Record<TicketPriority, string> = { Urgent: "🚨", High: "🔥", Medium: "⚠️", Low: "🟢" };

function SortableHeader<T>({ columnKey, label, sortConfig, requestSort }: { columnKey: keyof T, label: string, sortConfig: SortConfig<T>, requestSort: (key: keyof T) => void }) {
  return (
    <TableHead onClick={() => requestSort(columnKey)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center">
        {label}
        {sortConfig.key === columnKey && (sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
      </div>
    </TableHead>
  );
}

function DashboardSection<T extends {id: string}>({ title, icon: Icon, data, columns, sortConfig, requestSort, onRowClick, isLoading, viewAllLink, onRefresh }: {
  title: string;
  icon: React.ElementType;
  data: T[] | undefined;
  columns: { key: keyof T; label: string; render?: (item: T) => React.ReactNode }[];
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
  onRowClick?: (item: T) => void;
  isLoading: boolean;
  viewAllLink?: string;
  onRefresh?: () => void;
}) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Icon className="h-6 w-6 mr-2 text-primary" />
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && <Button variant="ghost" size="icon" onClick={onRefresh} className="h-7 w-7"><RefreshCw className="h-4 w-4" /></Button>}
            {viewAllLink && <Button variant="outline" size="sm" asChild><Link href={viewAllLink}><ExternalLink className="h-4 w-4 mr-1" />View All</Link></Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[300px]"> {/* Fixed height for scrollability */}
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <SortableHeader key={String(col.key)} columnKey={col.key} label={col.label} sortConfig={sortConfig} requestSort={requestSort} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {columns.map(col => <TableCell key={`skel-cell-${String(col.key)}-${i}`}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
              {!isLoading && data && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">No data available.</TableCell>
                </TableRow>
              )}
              {!isLoading && data && data.map((item) => (
                <TableRow key={item.id} onClick={onRowClick ? () => onRowClick(item) : undefined} className={onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}>
                  {columns.map(col => (
                    <TableCell key={String(col.key) + item.id}>
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


export default function DashboardHomePage() {
  const router = useRouter();

  const [activeEngineers, setActiveEngineers] = useState<ActiveEngineerSummary[] | undefined>(undefined);
  const [openTickets, setOpenTickets] = useState<OpenTicketSummary[] | undefined>(undefined);
  const [recentRoutes, setRecentRoutes] = useState<RecentRouteLogSummary[] | undefined>(undefined);
  const [unreadAlerts, setUnreadAlerts] = useState<DashboardAlertSummary[] | undefined>(undefined);
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecordSummary[] | undefined>(undefined);

  const [loadingStates, setLoadingStates] = useState({
    engineers: true, tickets: true, routes: true, alerts: true, attendance: true
  });

  const fetchData = useCallback(async () => {
    setLoadingStates(prev => ({...prev, engineers: true}));
    fetch('/api/dashboard/active-engineers').then(res => res.json()).then(data => { setActiveEngineers(data); setLoadingStates(prev => ({...prev, engineers: false}));});
    
    setLoadingStates(prev => ({...prev, tickets: true}));
    fetch('/api/dashboard/open-tickets').then(res => res.json()).then(data => { setOpenTickets(data); setLoadingStates(prev => ({...prev, tickets: false}));});

    setLoadingStates(prev => ({...prev, routes: true}));
    fetch('/api/dashboard/recent-route-logs').then(res => res.json()).then(data => { setRecentRoutes(data); setLoadingStates(prev => ({...prev, routes: false}));});

    setLoadingStates(prev => ({...prev, alerts: true}));
    fetch('/api/dashboard/unread-alerts').then(res => res.json()).then(data => { setUnreadAlerts(data); setLoadingStates(prev => ({...prev, alerts: false}));});
    
    setLoadingStates(prev => ({...prev, attendance: true}));
    fetch('/api/dashboard/todays-attendance').then(res => res.json()).then(data => { setTodaysAttendance(data); setLoadingStates(prev => ({...prev, attendance: false}));});
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 60000); // Refresh data every 60 seconds
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const { items: sortedEngineers, requestSort: requestSortEngineers, sortConfig: sortConfigEngineers } = useSortableData(activeEngineers, 'name');
  const { items: sortedTickets, requestSort: requestSortTickets, sortConfig: sortConfigTickets } = useSortableData(openTickets, 'priority');
  const { items: sortedRoutes, requestSort: requestSortRoutes, sortConfig: sortConfigRoutes } = useSortableData(recentRoutes, 'date');
  const { items: sortedAlerts, requestSort: requestSortAlerts, sortConfig: sortConfigAlerts } = useSortableData(unreadAlerts, 'timestamp');
  const { items: sortedAttendance, requestSort: requestSortAttendance, sortConfig: sortConfigAttendance } = useSortableData(todaysAttendance, 'engineerName');

  const engineerColumns: { key: keyof ActiveEngineerSummary; label: string; render?: (item: ActiveEngineerSummary) => React.ReactNode }[] = [
    { key: 'name', label: 'Name', render: item => (
      <div className="flex items-center gap-2">
        {item.avatar && <Image data-ai-hint="person avatar" src={item.avatar} alt={item.name} width={24} height={24} className="rounded-full" />}
        <span>{item.name}</span>
      </div>
    )},
    { key: 'status', label: 'Status', render: item => <Badge className={`${statusColors[item.status]} px-2 py-1 text-xs`}>{item.status}</Badge> },
    { key: 'currentTask', label: 'Current Task', render: item => <span className="text-xs truncate">{item.currentTask || 'N/A'}</span> },
  ];

  const ticketColumns: { key: keyof OpenTicketSummary; label: string; render?: (item: OpenTicketSummary) => React.ReactNode }[] = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'priority', label: 'Priority', render: item => <Badge className={`${statusColors[item.priority]} px-2 py-1 text-xs`}>{priorityIcons[item.priority]} {item.priority}</Badge> },
    { key: 'status', label: 'Status', render: item => <Badge className={`${statusColors[item.status]} px-2 py-1 text-xs`}>{item.status}</Badge> },
    { key: 'issueType', label: 'Issue Type' },
    { key: 'lastUpdate', label: 'Last Update', render: item => formatDistanceToNow(parseISO(item.lastUpdate), { addSuffix: true }) },
  ];
  
  const routeLogColumns: { key: keyof RecentRouteLogSummary; label: string; render?: (item: RecentRouteLogSummary) => React.ReactNode }[] = [
    { key: 'engineerName', label: 'Engineer' },
    { key: 'date', label: 'Date', render: item => format(parseISO(item.date + "T00:00:00Z"), 'MMM dd, yyyy') }, // Ensure date is parsed correctly
    { key: 'distanceKm', label: 'Distance (km)' },
    { key: 'durationMinutes', label: 'Duration (min)' },
    { key: 'stops', label: 'Stops' },
  ];

  const alertColumns: { key: keyof DashboardAlertSummary; label: string; render?: (item: DashboardAlertSummary) => React.ReactNode }[] = [
    { key: 'type', label: 'Type' },
    { key: 'engineerName', label: 'Engineer' },
    { key: 'severity', label: 'Severity', render: item => <Badge className={`${statusColors[item.severity]} px-2 py-1 text-xs`}>{item.severity}</Badge> },
    { key: 'timestamp', label: 'Timestamp', render: item => formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true }) },
  ];

  const attendanceColumns: { key: keyof AttendanceRecordSummary; label: string; render?: (item: AttendanceRecordSummary) => React.ReactNode }[] = [
    { key: 'engineerName', label: 'Engineer', render: item => (
      <div className="flex items-center gap-2">
        {item.avatar && <Image data-ai-hint="person avatar" src={item.avatar} alt={item.engineerName} width={24} height={24} className="rounded-full" />}
        <span>{item.engineerName}</span>
      </div>
    )},
    { key: 'checkInTime', label: 'Check-in', render: item => item.checkInTime || 'N/A'},
    { key: 'status', label: 'Status', render: item => <Badge className={`${statusColors[item.status]} px-2 py-1 text-xs`}>{item.status}</Badge> },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" /> Refresh All
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DashboardSection
            title="Active Engineers"
            icon={Users}
            data={sortedEngineers}
            columns={engineerColumns}
            sortConfig={sortConfigEngineers}
            requestSort={requestSortEngineers}
            isLoading={loadingStates.engineers}
            onRowClick={(item) => router.push(`/team`)} 
            viewAllLink="/team" 
            onRefresh={() => {setLoadingStates(p=>({...p, engineers: true})); fetch('/api/dashboard/active-engineers').then(res => res.json()).then(data => { setActiveEngineers(data); setLoadingStates(p => ({...p, engineers: false}));}); }}
          />
        </div>
        <div className="lg:col-span-2">
          <DashboardSection
            title="Open Tickets"
            icon={Ticket}
            data={sortedTickets}
            columns={ticketColumns}
            sortConfig={sortConfigTickets}
            requestSort={requestSortTickets}
            isLoading={loadingStates.tickets}
            onRowClick={(item) => router.push(`/tickets/create`)} 
            viewAllLink="/tickets/create" 
            onRefresh={() => {setLoadingStates(p=>({...p, tickets: true})); fetch('/api/dashboard/open-tickets').then(res => res.json()).then(data => { setOpenTickets(data); setLoadingStates(p => ({...p, tickets: false}));});}}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mt-6">
        <DashboardSection
          title="Recent Route Logs"
          icon={Route}
          data={sortedRoutes}
          columns={routeLogColumns}
          sortConfig={sortConfigRoutes}
          requestSort={requestSortRoutes}
          isLoading={loadingStates.routes}
          onRowClick={(item) => router.push(`/route-playback?engineerId=${item.engineerId}&date=${item.date}`)}
          viewAllLink="/route-playback"
           onRefresh={() => {setLoadingStates(p=>({...p, routes: true})); fetch('/api/dashboard/recent-route-logs').then(res => res.json()).then(data => { setRecentRoutes(data); setLoadingStates(p => ({...p, routes: false}));});}}
        />
        <DashboardSection
          title="Unread Alerts"
          icon={AlertTriangle}
          data={sortedAlerts}
          columns={alertColumns}
          sortConfig={sortConfigAlerts}
          requestSort={requestSortAlerts}
          isLoading={loadingStates.alerts}
          onRowClick={(item) => router.push(`/alerts?alertId=${item.alertId}`)}
          viewAllLink="/alerts"
           onRefresh={() => {setLoadingStates(p=>({...p, alerts: true})); fetch('/api/dashboard/unread-alerts').then(res => res.json()).then(data => { setUnreadAlerts(data); setLoadingStates(p => ({...p, alerts: false}));});}}
        />
        <DashboardSection
          title="Today's Attendance"
          icon={CalendarCheck}
          data={sortedAttendance}
          columns={attendanceColumns}
          sortConfig={sortConfigAttendance}
          requestSort={requestSortAttendance}
          isLoading={loadingStates.attendance}
          onRowClick={(item) => router.push(`/attendance/geofence`)} 
          viewAllLink="/attendance/geofence" 
          onRefresh={() => {setLoadingStates(p=>({...p, attendance: true})); fetch('/api/dashboard/todays-attendance').then(res => res.json()).then(data => { setTodaysAttendance(data); setLoadingStates(p => ({...p, attendance: false}));});}}
        />
      </div>
    </div>
  );
}
