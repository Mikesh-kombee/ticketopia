
"use client";

import { TicketForm } from "@/components/ticket-form";
import { TicketHistoryPanel } from "@/components/ticket-history-panel";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
// import { Toaster } from "@/components/ui/toaster"; // Toaster is global in RootLayout
// import { Metadata } from "next"; // Cannot export metadata from client component
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";


export default function CreateTicketPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left" className="border-r w-[320px] group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] md:block hidden">
        <TicketHistoryPanel />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Header removed, will be provided by AppLayout */}
          <main className="flex-grow p-4 md:p-8 overflow-auto container mx-auto">
            <h1 className="text-3xl font-bold text-primary mb-6">Create New Ticket</h1>
            <TicketForm />
          </main>
        </div>
      </SidebarInset>
      {/* <Toaster /> */} {/* Toaster is global in RootLayout */}
    </SidebarProvider>
  );
}
