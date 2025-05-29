"use client";

import { TicketForm } from "@/components/ticket-form";
import { TicketHistoryPanel } from "@/components/ticket-history-panel";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { TicketFormSchema } from "@/lib/schema";
import { PhoneIncoming } from "lucide-react";
import { useState } from "react";

export default function CreateTicketPage() {
  const [initialFormValues, setInitialFormValues] = useState<
    Partial<TicketFormSchema> | undefined
  >(undefined);

  const simulateIncomingCall = () => {
    setInitialFormValues({
      customerName: "Incoming Caller",
      notes:
        "Ticket initiated from a simulated incoming call. Please gather more details.\n",
    });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        side="left"
        className="border-r w-[320px] group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] md:block hidden"
      >
        <TicketHistoryPanel />
      </Sidebar>
      <SidebarInset>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                Create New Ticket
              </h1>
              <p className="text-muted-foreground">
                Create and submit a new service ticket
              </p>
            </div>
            <Button variant="outline" onClick={simulateIncomingCall}>
              <PhoneIncoming className="mr-2 h-4 w-4" /> Simulate Incoming Call
            </Button>
          </div>
          <TicketForm
            key={JSON.stringify(initialFormValues)}
            initialValues={initialFormValues}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
