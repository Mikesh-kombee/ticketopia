"use client";

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
import { ReportStatus, TravelReport } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  ArrowUpDown,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  FileBadge,
  FileWarning,
  Receipt,
  X
} from "lucide-react";
import React, { useState } from "react";

type SortKey = keyof TravelReport;
type SortDirection = "asc" | "desc";

interface TravelReportListProps {
  reports: TravelReport[];
  isLoading: boolean;
  isAdmin: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus) => void;
}

const statusIcons: Record<ReportStatus, React.ReactNode> = {
  Pending: <Clock className="h-4 w-4 text-yellow-500" />,
  Approved: <CheckCircle className="h-4 w-4 text-green-500" />,
  Rejected: <FileWarning className="h-4 w-4 text-red-500" />,
};

const statusColors: Record<ReportStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const expenseTypeIcons: Record<string, React.ReactNode> = {
  Fuel: "⛽",
  Toll: "🛣️",
  Meals: "🍔",
  Accommodation: "🏨",
  Other: "📝",
};

export function TravelReportList({
  reports,
  isLoading,
  isAdmin,
  onUpdateStatus,
}: TravelReportListProps) {
  const [sortBy, setSortBy] = useState<SortKey>("submissionDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedReports = [...reports].sort((a, b) => {
    if (a[sortBy] === undefined || b[sortBy] === undefined) return 0;

    let comparison = 0;
    if (sortBy === "submissionDate" || sortBy === "cost") {
      // Numeric or date comparison
      const aValue =
        sortBy === "submissionDate"
          ? new Date(a[sortBy] as string).getTime()
          : (a[sortBy] as number);
      const bValue =
        sortBy === "submissionDate"
          ? new Date(b[sortBy] as string).getTime()
          : (b[sortBy] as number);

      comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      // String comparison
      comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <TableHead className="cursor-pointer" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortBy === sortKey ? (
          <ArrowUpDown className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Travel Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Travel Reports ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileBadge className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No travel reports found matching your criteria.</p>
            <p className="text-sm">
              Try adjusting your filters or create a new report.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Date" sortKey="submissionDate" />
                  <SortableHeader label="Employee" sortKey="employeeName" />
                  <SortableHeader label="Travel Area" sortKey="travelArea" />
                  <SortableHeader label="Expense Type" sortKey="expenseType" />
                  <SortableHeader label="Amount" sortKey="cost" />
                  <SortableHeader label="Status" sortKey="status" />
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {format(parseISO(report.submissionDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{report.employeeName}</TableCell>
                    <TableCell>{report.travelArea}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{expenseTypeIcons[report.expenseType]}</span>
                        <span>{report.expenseType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.currency} {report.cost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[report.status]}
                      >
                        <div className="flex items-center gap-1">
                          {statusIcons[report.status]}
                          <span>{report.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {isAdmin && report.status === "Pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onUpdateStatus(report.id, "Approved")
                              }
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onUpdateStatus(report.id, "Rejected")
                              }
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
