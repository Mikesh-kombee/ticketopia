import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("status", "in", ["open", "in_progress"]));
    const querySnapshot = await getDocs(q);

    const openTickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ openTickets });
  } catch (error) {
    console.error("Error fetching open tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch open tickets" },
      { status: 500 }
    );
  }
}
