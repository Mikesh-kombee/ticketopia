import type { Engineer } from "@/lib/types";
import { NextResponse } from "next/server";

// Reusing and expanding the mock engineers list
const mockEngineersData: Engineer[] = [
  {
    id: "eng1",
    name: "Alice Smith",
    location: { lat: 21.1702, lng: 72.8311 },
    specialization: ["Plumbing", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=AS",
  },
  {
    id: "eng2",
    name: "Bob Johnson",
    location: { lat: 21.175, lng: 72.835 },
    specialization: ["Electrical"],
    avatar: "https://placehold.co/40x40.png?text=BJ",
  },
  {
    id: "eng3",
    name: "Charlie Brown",
    location: { lat: 21.165, lng: 72.828 },
    specialization: ["Appliance Repair", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=CB",
  },
  {
    id: "eng4",
    name: "Diana Prince",
    location: { lat: 21.18, lng: 72.84 },
    specialization: ["Plumbing"],
    avatar: "https://placehold.co/40x40.png?text=DP",
  },
  {
    id: "eng5",
    name: "Edward Nygma",
    location: { lat: 21.16, lng: 72.825 },
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
