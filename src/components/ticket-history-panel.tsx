"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTicketStore } from "@/hooks/use-ticket-store";
import type { Ticket, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarClock,
  CheckCircle,
  CircleDot,
  HelpCircle,
  History,
  Loader,
  MapPin,
  RefreshCw,
  Refrigerator,
  UserCheck,
  Wind,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

const statusIcons: Record<TicketStatus, React.ElementType> = {
  Pending: CircleDot,
  Assigned: UserCheck,
  "In Progress": Loader,
  Completed: CheckCircle,
  Cancelled: XCircle,
};

const statusColors: Record<TicketStatus, string> = {
  Pending: "text-yellow-500",
  Assigned: "text-blue-500",
  "In Progress": "text-indigo-500",
  Completed: "text-green-500",
  Cancelled: "text-red-500",
};

const issueTypeIcons: Record<Ticket["issueType"], React.ElementType> = {
  Plumbing: Wrench,
  Electrical: Zap,
  HVAC: Wind,
  "Appliance Repair": Refrigerator,
  Other: HelpCircle,
};

function TicketItem({ ticket }: { ticket: Ticket }) {
  const StatusIcon = statusIcons[ticket.status];
  const IssueIcon = issueTypeIcons[ticket.issueType];

  return (
    <div className="p-3 hover:bg-sidebar-accent/50 rounded-md transition-colors">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-sm text-sidebar-primary-foreground flex items-center">
          <IssueIcon className="w-4 h-4 mr-2 text-sidebar-accent-foreground" />
          {ticket.customerName}
        </h4>
        <div
          className={cn(
            "text-xs font-medium flex items-center",
            statusColors[ticket.status]
          )}
        >
          <StatusIcon className="w-3.5 h-3.5 mr-1" />
          {ticket.status}
        </div>
      </div>
      <p className="text-xs text-sidebar-foreground/80 flex items-center mb-0.5">
        <MapPin className="w-3 h-3 mr-1.5" /> {ticket.address}
      </p>
      <p className="text-xs text-sidebar-foreground/70 flex items-center">
        <CalendarClock className="w-3 h-3 mr-1.5" />
        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
      </p>
    </div>
  );
}

export function TicketHistoryPanel() {
  const { tickets, refreshTickets, isInitialized } = useTicketStore();

  return (
    <Card className="h-full flex flex-col border-0 rounded-none bg-transparent shadow-none">
      <CardHeader className="p-4 border-b border-sidebar-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center text-sidebar-primary-foreground">
            <History className="w-5 h-5 mr-2" />
            Ticket History
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshTickets}
            className="text-sidebar-accent-foreground hover:bg-sidebar-accent/80 h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">Refresh History</span>
          </Button>
        </div>
        <CardDescription className="text-sidebar-foreground/80">
          Last 5 created tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {!isInitialized && (
              <p className="p-4 text-sm text-sidebar-foreground/70 text-center">
                Loading history...
              </p>
            )}
            {isInitialized && tickets.length === 0 && (
              <p className="p-4 text-sm text-sidebar-foreground/70 text-center">
                No tickets yet. Create one!
              </p>
            )}
            {isInitialized &&
              tickets.map((ticket, index) => (
                <React.Fragment key={ticket.id}>
                  <TicketItem ticket={ticket} />
                  {index < tickets.length - 1 && (
                    <Separator className="my-0 bg-sidebar-border/50" />
                  )}
                </React.Fragment>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Necessary for React.Fragment dynamic key
import React from "react";
