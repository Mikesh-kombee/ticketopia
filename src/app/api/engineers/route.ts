import type { Engineer } from "@/lib/types";
import { NextResponse } from "next/server";

// Reusing and expanding the mock engineers list
const mockEngineersData: Engineer[] = [
  {
    id: "eng1",
    name: "Alice Smith",
    location: { lat: 34.0522, lng: -118.2437 },
    specialization: ["Plumbing", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=AS",
  },
  {
    id: "eng2",
    name: "Bob Johnson",
    location: { lat: 34.055, lng: -118.245 },
    specialization: ["Electrical"],
    avatar: "https://placehold.co/40x40.png?text=BJ",
  },
  {
    id: "eng3",
    name: "Charlie Brown",
    location: { lat: 34.05, lng: -118.24 },
    specialization: ["Appliance Repair", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=CB",
  },
  {
    id: "eng4",
    name: "Diana Prince",
    location: { lat: 34.06, lng: -118.25 },
    specialization: ["Plumbing"],
    avatar: "https://placehold.co/40x40.png?text=DP",
  },
  {
    id: "eng5",
    name: "Edward Nygma",
    location: { lat: 34.045, lng: -118.23 },
    specialization: ["Other", "Electrical"],
    avatar: "https://placehold.co/40x40.png?text=EN",
  },
];

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // In a real app, you might filter engineers based on query params (e.g., location, specialization)
  // For now, returning all mock engineers.
  return NextResponse.json(mockEngineersData);
}
