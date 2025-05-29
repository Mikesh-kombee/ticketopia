"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReportStatus, TravelReport } from "@/lib/types";
import { TravelReportCard } from "./TravelReportCard";

interface TravelReportListProps {
  reports: TravelReport[];
  isLoading: boolean;
  isAdmin: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus) => Promise<void>;
}

export function TravelReportList({
  reports,
  isLoading,
  isAdmin,
  onUpdateStatus,
}: TravelReportListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-3"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex justify-end space-x-2 mt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p className="text-lg">No travel reports found.</p>
        <p>Try adjusting your filters or submitting a new report.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {reports.map((report) => (
        <TravelReportCard
          key={report.id}
          report={report}
          isAdmin={isAdmin}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
}
