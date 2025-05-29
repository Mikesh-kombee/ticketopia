"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportStatus, TravelReport } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle,
  DollarSign,
  FileText,
  MapPin,
  ShoppingBag,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface TravelReportCardProps {
  report: TravelReport;
  isAdmin: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus) => Promise<void>;
}

const statusStyles: Record<
  ReportStatus,
  {
    variant: "default" | "destructive" | "outline" | "secondary";
    className: string;
    icon: React.ElementType;
  }
> = {
  Pending: {
    variant: "outline",
    className: "border-yellow-500 text-yellow-500",
    icon: AlertTriangle,
  },
  Approved: {
    variant: "secondary",
    className: "border-green-500 text-green-500 bg-green-50",
    icon: CheckCircle,
  },
  Rejected: {
    variant: "destructive",
    className: "border-red-500 text-red-500 bg-red-50",
    icon: XCircle,
  },
};

const vehicleIcons: Record<TravelReport["vehicleUsed"], React.ElementType> = {
  car: Car,
  bike: Car, // Consider a bike icon if available or generic vehicle
  public_transport: Car, // Consider a bus/train icon
  other: ShoppingBag,
};

export function TravelReportCard({
  report,
  isAdmin,
  onUpdateStatus,
}: TravelReportCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setIsUpdating(true);
    await onUpdateStatus(report.id, newStatus);
    setIsUpdating(false);
  };

  const VehicleIcon = vehicleIcons[report.vehicleUsed] || ShoppingBag;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            {report.expenseType} - {report.travelArea}
          </CardTitle>
          <Badge
            variant={statusStyles[report.status].variant}
            className={`whitespace-nowrap ${
              statusStyles[report.status].className
            }`}
          >
            {React.createElement(statusStyles[report.status].icon, {
              className: "h-3.5 w-3.5 mr-1.5",
            })}
            {report.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center pt-1">
          <CalendarDays className="h-4 w-4 mr-1.5" />
          {format(parseISO(report.submissionDate), "MMM dd, yyyy - HH:mm")}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">Employee:</span>&nbsp;
          {report.employeeName}
        </div>
        <div className="flex items-center">
          <VehicleIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">Vehicle:</span>&nbsp;
          {report.vehicleUsed.charAt(0).toUpperCase() +
            report.vehicleUsed.slice(1)}
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">Area:</span>&nbsp;{report.travelArea}
        </div>
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">Cost:</span>&nbsp;
          {report.cost.toLocaleString(undefined, {
            style: "currency",
            currency: report.currency || "USD",
          })}
        </div>
        {report.notes && (
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="font-medium">Notes:</span>
              <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                {report.notes}
              </p>
            </div>
          </div>
        )}
        {report.receiptUrl && (
          <div className="mt-2">
            <span className="font-medium block mb-1">Receipt:</span>
            {/* In a real app, clicking this would open the image in a modal or new tab */}
            <a
              href={report.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full h-32 rounded-md overflow-hidden border group"
            >
              <Image
                src={report.receiptUrl}
                alt={`Receipt for ${report.id}`}
                layout="fill"
                objectFit="cover"
                className="group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">
                  View Receipt
                </span>
              </div>
            </a>
          </div>
        )}
      </CardContent>
      {isAdmin && report.status === "Pending" && (
        <CardFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("Approved")}
            disabled={isUpdating}
            className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("Rejected")}
            disabled={isUpdating}
            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
