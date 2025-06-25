import { NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function GET() {
  try {
    const alertsRef = collection(db, "alerts");
    const q = query(alertsRef, where("read", "==", false));
    const querySnapshot = await getDocs(q);

    const unreadAlerts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ unreadAlerts });
  } catch (error) {
    console.error("Error fetching unread alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread alerts" },
      { status: 500 }
    );
  }
}
