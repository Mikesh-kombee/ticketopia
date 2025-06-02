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
  X,
} from "lucide-react";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [selectedReport, setSelectedReport] = useState<TravelReport | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsViewDialogOpen(true);
                          }}
                        >
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

        {/* Report View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedReport && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Travel Expense Report
                  </DialogTitle>
                  <DialogDescription>
                    Submitted on{" "}
                    {format(parseISO(selectedReport.submissionDate), "PPP")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="font-medium">Employee</div>
                    <div>{selectedReport.employeeName}</div>

                    <div className="font-medium">Travel Area</div>
                    <div>{selectedReport.travelArea}</div>

                    <div className="font-medium">Expense Type</div>
                    <div className="flex items-center gap-1">
                      <span>
                        {expenseTypeIcons[selectedReport.expenseType]}
                      </span>
                      <span>{selectedReport.expenseType}</span>
                    </div>

                    <div className="font-medium">Amount</div>
                    <div className="font-semibold">
                      {selectedReport.currency} {selectedReport.cost.toFixed(2)}
                    </div>

                    <div className="font-medium">Status</div>
                    <div>
                      <Badge
                        variant="secondary"
                        className={statusColors[selectedReport.status]}
                      >
                        <div className="flex items-center gap-1">
                          {statusIcons[selectedReport.status]}
                          <span>{selectedReport.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <div className="font-medium">Vehicle Used</div>
                    <div className="capitalize">
                      {selectedReport.vehicleUsed.replace("_", " ")}
                    </div>

                    {selectedReport.notes && (
                      <>
                        <div className="font-medium">Notes</div>
                        <div>{selectedReport.notes}</div>
                      </>
                    )}

                    {selectedReport.receiptUrl && (
                      <>
                        <div className="font-medium">Receipt</div>
                        <div>
                          <a
                            href={selectedReport.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Receipt className="h-4 w-4" /> View Receipt
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  {isAdmin && selectedReport.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          onUpdateStatus(selectedReport.id, "Approved");
                          setIsViewDialogOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          onUpdateStatus(selectedReport.id, "Rejected");
                          setIsViewDialogOpen(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
