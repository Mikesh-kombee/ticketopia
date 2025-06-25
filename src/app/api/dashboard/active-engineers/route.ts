import { NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function GET() {
  try {
    const engineersRef = collection(db, "engineers");
    const q = query(engineersRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    const activeEngineers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ activeEngineers });
  } catch (error) {
    console.error("Error fetching active engineers:", error);
    return NextResponse.json(
      { error: "Failed to fetch active engineers" },
      { status: 500 }
    );
  }
}
