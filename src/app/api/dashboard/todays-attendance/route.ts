import { NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const attendanceRef = collection(db, "attendance");
    const q = query(attendanceRef, where("date", "==", today));
    const querySnapshot = await getDocs(q);

    const todaysAttendance = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ todaysAttendance });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's attendance" },
      { status: 500 }
    );
  }
}
