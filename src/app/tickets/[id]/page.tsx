"use client";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db.json";
import { IssueType, TicketPriority, TicketStatus } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageSquare,
  Paperclip,
  SquarePen,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  customerName: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedEngineerId: string;
  assignedEngineerName?: string;
  issueType: IssueType;
  lastUpdate: string;
  description?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  createdDate?: string;
  estimatedCompletionDate?: string;
  notes?: { id: string; date: string; author: string; content: string }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
  }[];
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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Find ticket in mock DB or create mock data for demo
        const dbTicket = (db.openTickets || []).find((t) => t.id === ticketId);

        if (dbTicket) {
          // Enhance the ticket with more details for the detail view
          setTicket({
            ...dbTicket,
            status: dbTicket.status as TicketStatus,
            priority: dbTicket.priority as TicketPriority,
            issueType: dbTicket.issueType as IssueType,
            assignedEngineerName: "John Doe", // In a real app, you'd fetch this
            description:
              "Customer reported issues with water leakage from under the sink. Initial assessment needed to determine the scope of repair required.",
            location: "123 Main St, Anytown, USA",
            contactName: "Alice Johnson",
            contactPhone: "(555) 123-4567",
            createdDate: "2023-12-14T08:30:00Z",
            estimatedCompletionDate: "2023-12-16T17:00:00Z",
            notes: [
              {
                id: "n1",
                date: "2023-12-15T10:30:00Z",
                author: "John Doe",
                content:
                  "Initial assessment complete. Need to replace the water valve and fix pipe connection.",
              },
              {
                id: "n2",
                date: "2023-12-15T11:15:00Z",
                author: "System",
                content:
                  "Ticket status updated from 'Pending' to 'In Progress'.",
              },
            ],
            attachments: [
              {
                id: "a1",
                name: "initial_photo.jpg",
                url: "/mock/images/plumbing_issue.jpg",
                type: "image/jpeg",
                uploadDate: "2023-12-15T09:45:00Z",
              },
            ],
          });
        } else {
          // Create a mock ticket if not found in DB
          setTicket({
            id: ticketId,
            customerName: "Sample Customer",
            status: "In Progress",
            priority: "Medium",
            assignedEngineerId: "1",
            assignedEngineerName: "John Doe",
            issueType: "Plumbing",
            lastUpdate: "2023-12-15T10:30:00Z",
            description:
              "This is a sample ticket description for demonstration purposes.",
            location: "123 Sample St, Demo City",
            contactName: "Sample Contact",
            contactPhone: "(555) 987-6543",
            createdDate: "2023-12-14T09:00:00Z",
            estimatedCompletionDate: "2023-12-16T17:00:00Z",
            notes: [
              {
                id: "n1",
                date: "2023-12-15T10:30:00Z",
                author: "John Doe",
                content: "This is a sample note for the ticket.",
              },
            ],
            attachments: [],
          });
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
        // Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (isLoading) {
    return (
      <PrivateRoute>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/tickets">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </PrivateRoute>
    );
  }

  if (!ticket) {
    return (
      <PrivateRoute>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/tickets">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Ticket Not Found</h1>
          </div>
          <p>
            The requested ticket could not be found. Please check the ticket ID
            and try again.
          </p>
          <Button asChild>
            <Link href="/tickets">Return to Tickets</Link>
          </Button>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Ticket {ticket.id}
              <Badge className={statusColors[ticket.status]}>
                {ticket.status}
              </Badge>
              <Badge className={statusColors[ticket.priority]}>
                {priorityIcons[ticket.priority]} {ticket.priority}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {ticket.issueType} issue for {ticket.customerName}
            </p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Ticket details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p>{ticket.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Timeline
                    </h3>
                    <p className="text-sm">
                      Created: {format(parseISO(ticket.createdDate!), "PPP")}
                    </p>
                    <p className="text-sm">
                      Last Updated: {format(parseISO(ticket.lastUpdate), "PPP")}
                    </p>
                    <p className="text-sm">
                      Estimated Completion:{" "}
                      {format(parseISO(ticket.estimatedCompletionDate!), "PPP")}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Location
                    </h3>
                    <p className="text-sm">{ticket.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> Customer Contact
                    </h3>
                    <p className="text-sm">{ticket.contactName}</p>
                    <p className="text-sm">{ticket.contactPhone}</p>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> Assigned Engineer
                    </h3>
                    <p className="text-sm">{ticket.assignedEngineerName}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        router.push(
                          `/live-map?engineer=${ticket.assignedEngineerId}`
                        )
                      }
                    >
                      View Location
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> Notes
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center gap-1"
                >
                  <Paperclip className="h-4 w-4" /> Attachments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {ticket.notes && ticket.notes.length > 0 ? (
                      <div className="space-y-4">
                        {ticket.notes.map((note) => (
                          <div
                            key={note.id}
                            className="border-b pb-4 last:border-0"
                          >
                            <div className="flex justify-between mb-1">
                              <p className="font-medium">{note.author}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(note.date), "PPp")}
                              </p>
                            </div>
                            <p>{note.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No notes available for this ticket.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <Button className="flex items-center gap-1">
                    <SquarePen className="h-4 w-4" /> Add Note
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {ticket.attachments && ticket.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ticket.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="border rounded-md p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{attachment.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded:{" "}
                                {format(parseISO(attachment.uploadDate), "PPp")}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No attachments available for this ticket.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <Button className="flex items-center gap-1">
                    <Paperclip className="h-4 w-4" /> Add Attachment
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Actions and status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full">Update Status</Button>
                <Button variant="outline" className="w-full">
                  Reassign Ticket
                </Button>
                <Button variant="outline" className="w-full">
                  Schedule Visit
                </Button>
                <Button variant="outline" className="w-full">
                  Close Ticket
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1 bg-primary rounded-full" />
                    <div>
                      <p className="text-sm font-medium">
                        Status changed to {ticket.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(ticket.lastUpdate), "PPp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 bg-primary rounded-full" />
                    <div>
                      <p className="text-sm font-medium">
                        Ticket assigned to {ticket.assignedEngineerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(ticket.createdDate!), "PPp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 bg-primary rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Ticket created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(ticket.createdDate!), "PPp")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
