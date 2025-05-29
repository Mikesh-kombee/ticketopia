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
      // Potentially pre-fill address if known from caller ID, etc.
      // address: "123 Call Lane",
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
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow p-4 md:p-8 overflow-auto container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-primary">
                Create New Ticket
              </h1>
              <Button variant="outline" onClick={simulateIncomingCall}>
                <PhoneIncoming className="mr-2 h-4 w-4" /> Simulate Incoming
                Call
              </Button>
            </div>
            <TicketForm
              key={JSON.stringify(initialFormValues)}
              initialValues={initialFormValues}
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
