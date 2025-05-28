"use client";

import type { Ticket } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

const TICKET_STORAGE_KEY = "ticketopia_tickets";

export function useTicketStore() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedTickets = localStorage.getItem(TICKET_STORAGE_KEY);
        if (storedTickets) {
          setTickets(JSON.parse(storedTickets));
        }
      } catch (error) {
        console.error("Failed to load tickets from localStorage:", error);
      }
      setIsInitialized(true);
    }
  }, []);

  const refreshTickets = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const storedTickets = localStorage.getItem(TICKET_STORAGE_KEY);
        if (storedTickets) {
          setTickets(JSON.parse(storedTickets));
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error("Failed to refresh tickets from localStorage:", error);
      }
    }
  }, []);

  const addTicket = useCallback((newTicket: Ticket) => {
    setTickets(prevTickets => {
      const updatedTickets = [newTicket, ...prevTickets].slice(0, 50); // Keep last 50 tickets
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(updatedTickets));
        } catch (error) {
          console.error("Failed to save ticket to localStorage:", error);
        }
      }
      return updatedTickets;
    });
  }, []);

  return { tickets: tickets.slice(0, 5), addTicket, refreshTickets, isInitialized };
}
