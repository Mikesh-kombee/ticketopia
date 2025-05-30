"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import db from "@/lib/db.json";
import { IssueType, TicketPriority, TicketStatus } from "@/lib/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface TicketData {
  id: string;
  customerName: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedEngineerId: string;
  assignedEngineerName?: string;
  issueType: IssueType;
  lastUpdate: string;
  createdDate?: string;
  location?: string;
}

type SortableKeys = keyof TicketData;
type SortDirection = "asc" | "desc";

interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
}

const statusColors: Record<TicketStatus | TicketPriority, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Assigned: "bg-blue-100 text-blue-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  High: "bg-red-100 text-red-700",
  Urgent: "bg-red-100 text-red-700",
  Medium: "bg-orange-100 text-orange-700",
  Low: "bg-blue-100 text-blue-700",
};

const priorityIcons: Record<TicketPriority, string> = {
  Urgent: "🚨",
  High: "🔥",
  Medium: "⚠️",
  Low: "🟢",
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "All">(
    "All"
  );
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | "All">(
    "All"
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "lastUpdate",
    direction: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you'd fetch from an API
      // Mock data based on dashboard tickets with additional details
      const baseTickets = db.openTickets || [];

      const enhancedTickets: TicketData[] = [
        ...baseTickets.map((ticket) => ({
          ...ticket,
          status: ticket.status as TicketStatus,
          priority: ticket.priority as TicketPriority,
          issueType: ticket.issueType as IssueType,
          assignedEngineerName: `Engineer ${ticket.assignedEngineerId}`, // Mock names
          createdDate: new Date(
            new Date(ticket.lastUpdate).getTime() -
              1000 * 60 * 60 * 24 * Math.floor(Math.random() * 5)
          ).toISOString(),
          location: ["Downtown", "Uptown", "Midtown", "Eastside", "Westside"][
            Math.floor(Math.random() * 5)
          ],
        })),
        // Add more mocked tickets
        {
          id: "T006",
          customerName: "MNO Industries",
          status: "Completed" as TicketStatus,
          priority: "Medium" as TicketPriority,
          assignedEngineerId: "2",
          assignedEngineerName: "Engineer 2",
          issueType: "Electrical" as IssueType,
          lastUpdate: "2023-12-14T15:30:00Z",
          createdDate: "2023-12-12T09:00:00Z",
          location: "Downtown",
        },
        {
          id: "T007",
          customerName: "PQR Solutions",
          status: "Cancelled" as TicketStatus,
          priority: "Low" as TicketPriority,
          assignedEngineerId: "3",
          assignedEngineerName: "Engineer 3",
          issueType: "Plumbing" as IssueType,
          lastUpdate: "2023-12-13T11:45:00Z",
          createdDate: "2023-12-11T10:15:00Z",
          location: "Eastside",
        },
        {
          id: "T008",
          customerName: "STU Corp",
          status: "Pending" as TicketStatus,
          priority: "Urgent" as TicketPriority,
          assignedEngineerId: "1",
          assignedEngineerName: "Engineer 1",
          issueType: "HVAC" as IssueType,
          lastUpdate: "2023-12-15T12:00:00Z",
          createdDate: "2023-12-15T09:30:00Z",
          location: "Midtown",
        },
      ];

      setTickets(enhancedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter and sort tickets
  useEffect(() => {
    let result = [...tickets];

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(lowercaseSearch) ||
          ticket.customerName.toLowerCase().includes(lowercaseSearch) ||
          ticket.location?.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter((ticket) => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "All") {
      result = result.filter((ticket) => ticket.priority === priorityFilter);
    }

    // Apply issue type filter
    if (issueTypeFilter !== "All") {
      result = result.filter((ticket) => ticket.issueType === issueTypeFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue > bValue ? 1 : -1;
        }

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    setFilteredTickets(result);
  }, [
    tickets,
    searchTerm,
    statusFilter,
    priorityFilter,
    issueTypeFilter,
    sortConfig,
  ]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleTicketClick = (ticket: TicketData) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setIssueTypeFilter("All");
  };

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(tickets.map((ticket) => ticket.status)));
  }, [tickets]);

  const uniquePriorities = useMemo(() => {
    return Array.from(new Set(tickets.map((ticket) => ticket.priority)));
  }, [tickets]);

  const uniqueIssueTypes = useMemo(() => {
    return Array.from(new Set(tickets.map((ticket) => ticket.issueType)));
  }, [tickets]);

  return (
    <PrivateRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Ticket className="h-8 w-8" /> Tickets
            </h1>
            <p className="text-muted-foreground">
              Manage and track all service tickets
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={fetchTickets}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets by ID, customer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as TicketStatus | "All")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        {uniqueStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Priority
                    </label>
                    <Select
                      value={priorityFilter}
                      onValueChange={(value) =>
                        setPriorityFilter(value as TicketPriority | "All")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Priorities</SelectItem>
                        {uniquePriorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priorityIcons[priority]} {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Issue Type
                    </label>
                    <Select
                      value={issueTypeFilter}
                      onValueChange={(value) =>
                        setIssueTypeFilter(value as IssueType | "All")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Issue Types</SelectItem>
                        {uniqueIssueTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tickets table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {filteredTickets.length} Ticket
              {filteredTickets.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("id")}
                    >
                      <div className="flex items-center">
                        Ticket ID
                        {sortConfig.key === "id" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("customerName")}
                    >
                      <div className="flex items-center">
                        Customer
                        {sortConfig.key === "customerName" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortConfig.key === "status" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("priority")}
                    >
                      <div className="flex items-center">
                        Priority
                        {sortConfig.key === "priority" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("issueType")}
                    >
                      <div className="flex items-center">
                        Issue Type
                        {sortConfig.key === "issueType" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("assignedEngineerName")}
                    >
                      <div className="flex items-center">
                        Assigned To
                        {sortConfig.key === "assignedEngineerName" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => requestSort("lastUpdate")}
                    >
                      <div className="flex items-center">
                        Last Updated
                        {sortConfig.key === "lastUpdate" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <TableCell className="font-medium">
                          {ticket.id}
                        </TableCell>
                        <TableCell>{ticket.customerName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[ticket.status]}
                          >
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[ticket.priority]}
                          >
                            {priorityIcons[ticket.priority]} {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.issueType}</TableCell>
                        <TableCell>{ticket.assignedEngineerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDistanceToNow(
                                parseISO(ticket.lastUpdate),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No tickets found matching your filters
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
