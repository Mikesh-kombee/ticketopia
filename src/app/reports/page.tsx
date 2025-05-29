"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { TravelReportForm } from "@/components/reports/TravelReportForm";
import { TravelReportList } from "@/components/reports/TravelReportList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  ExpenseType,
  ReportStatus,
  TravelReport,
  TravelReportFormInput,
  VehicleType,
} from "@/lib/types";
import { PlusCircle, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const MOCK_REPORTS_KEY = "ticketopia_travel_reports";

// Mock API functions (replace with actual API calls)
const fetchReportsFromAPI = async (): Promise<TravelReport[]> => {
  console.log("Fetching reports from API (mock)");
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  const localData = localStorage.getItem(MOCK_REPORTS_KEY);
  return localData ? JSON.parse(localData) : [];
};

const saveReportToAPI = async (report: TravelReport): Promise<TravelReport> => {
  console.log("Saving report to API (mock):", report);
  // Simulate API delay and ID generation
  await new Promise((resolve) => setTimeout(resolve, 300));
  const newReport = { ...report, id: report.id || crypto.randomUUID() }; // Ensure ID

  // Persist to localStorage
  const existingReports = await fetchReportsFromAPI();
  const updatedReports = [
    ...existingReports.filter((r) => r.id !== newReport.id),
    newReport,
  ];
  localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(updatedReports));
  return newReport;
};

const updateReportStatusAPI = async (
  reportId: string,
  status: ReportStatus
): Promise<TravelReport | null> => {
  console.log(`Updating report ${reportId} status to ${status} (mock)`);
  await new Promise((resolve) => setTimeout(resolve, 200));
  const existingReports = await fetchReportsFromAPI();
  const reportIndex = existingReports.findIndex((r) => r.id === reportId);
  if (reportIndex > -1) {
    existingReports[reportIndex].status = status;
    localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(existingReports));
    return existingReports[reportIndex];
  }
  return null;
};

export default function TravelReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<TravelReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TravelReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  // TODO: Add date range filter state

  const isAdmin = user?.role === "admin";

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedReports = await fetchReportsFromAPI();
      setReports(
        fetchedReports.sort(
          (a, b) =>
            new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load reports:", error);
      // TODO: Show toast error
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    let currentReports = [...reports];
    if (searchTerm) {
      currentReports = currentReports.filter(
        (report) =>
          report.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.travelArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.expenseType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterArea) {
      currentReports = currentReports.filter((report) =>
        report.travelArea.toLowerCase().includes(filterArea.toLowerCase())
      );
    }
    if (filterEmployee) {
      currentReports = currentReports.filter((report) =>
        report.employeeName.toLowerCase().includes(filterEmployee.toLowerCase())
      );
    }
    // TODO: Implement date range filter logic

    setFilteredReports(currentReports);
  }, [reports, searchTerm, filterArea, filterEmployee]);

  const handleFormSubmit = async (data: TravelReportFormInput) => {
    if (!user) {
      // TODO: Show error toast - user not found
      return;
    }
    setIsSubmitting(true);
    try {
      const newReport: TravelReport = {
        id: crypto.randomUUID(), // Temporary ID, backend should generate
        employeeId: user.id,
        employeeName: user.name,
        vehicleUsed: data.vehicleUsed,
        travelArea: data.travelArea,
        expenseType: data.expenseType,
        cost: parseFloat(data.cost),
        currency: "USD", // Assuming USD for now
        receiptUrl:
          data.receipt && data.receipt.length > 0
            ? URL.createObjectURL(data.receipt[0])
            : undefined, // Mock URL
        submissionDate: new Date().toISOString(),
        status: "Pending",
        notes: data.notes,
      };
      const savedReport = await saveReportToAPI(newReport);
      setReports((prev) =>
        [savedReport, ...prev].sort(
          (a, b) =>
            new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime()
        )
      );
      setIsFormOpen(false);
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to submit report:", error);
      // TODO: Show error toast
    }
    setIsSubmitting(false);
  };

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    try {
      const updatedReport = await updateReportStatusAPI(reportId, status);
      if (updatedReport) {
        setReports((prevReports) =>
          prevReports.map((r) => (r.id === reportId ? updatedReport : r))
        );
      }
    } catch (error) {
      console.error("Failed to update report status:", error);
      // TODO: Show error toast
    }
  };

  const uniqueTravelAreas = Array.from(
    new Set(reports.map((r) => r.travelArea))
  );
  const uniqueEmployeeNames = Array.from(
    new Set(reports.map((r) => r.employeeName))
  );

  return (
    <PrivateRoute>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Travel & Expense Reports
            </h1>
            <p className="text-muted-foreground">
              Manage and submit your travel expenses.
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit New Expense Report</DialogTitle>
              </DialogHeader>
              <TravelReportForm
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                defaultValues={{
                  employeeName: user?.name || "",
                  vehicleUsed: "car" as VehicleType,
                  expenseType: "Fuel" as ExpenseType,
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter and Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Travel Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Areas</SelectItem>
              {uniqueTravelAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Employees</SelectItem>
              {uniqueEmployeeNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* TODO: Date Range Picker */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setFilterArea("");
              setFilterEmployee(""); /* Reset date filter */
            }}
          >
            Clear Filters
          </Button>
        </div>

        <TravelReportList
          reports={filteredReports}
          isLoading={isLoading}
          isAdmin={isAdmin}
          onUpdateStatus={handleStatusUpdate}
        />
      </div>
    </PrivateRoute>
  );
}
