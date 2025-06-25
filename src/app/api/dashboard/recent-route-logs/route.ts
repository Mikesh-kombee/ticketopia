import { NextResponse } from "next/server";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function GET() {
  try {
    const routeDataRef = collection(db, "routeData");
    const q = query(routeDataRef, orderBy("timestamp", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    const recentRoutes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ recentRoutes });
  } catch (error) {
    console.error("Error fetching recent route logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent route logs" },
      { status: 500 }
    );
  }
}
