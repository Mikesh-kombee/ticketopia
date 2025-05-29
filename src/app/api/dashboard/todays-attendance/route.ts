import { NextResponse } from "next/server";
import type { AttendanceRecordSummary } from "@/lib/types";
import { attendanceStatuses } from "@/lib/types";
import { format } from "date-fns";

const engineerNames = [
  "Alice Smith",
  "Bob Johnson",
  "Charlie Brown",
  "Diana Prince",
  "Edward Nygma",
];

const mockTodaysAttendance: AttendanceRecordSummary[] = engineerNames.map(
  (name, i) => {
    const randomStatus =
      attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
    let checkInTime: string | undefined;
    let checkOutTime: string | undefined;
    const today = new Date();

    if (randomStatus === "Checked In" || randomStatus === "Late") {
      checkInTime = format(
        new Date(
          today.setHours(
            Math.floor(Math.random() * 2 + 8),
            Math.floor(Math.random() * 60)
          )
        ),
        "HH:mm"
      );
    }
    if (randomStatus === "Checked Out" && Math.random() > 0.5) {
      checkInTime = format(
        new Date(
          today.setHours(
            Math.floor(Math.random() * 2 + 8),
            Math.floor(Math.random() * 60)
          )
        ),
        "HH:mm"
      );
      checkOutTime = format(
        new Date(
          today.setHours(
            Math.floor(Math.random() * 2 + 16),
            Math.floor(Math.random() * 60)
          )
        ),
        "HH:mm"
      );
    }

    return {
      id: `ATT${4000 + i}`,
      engineerId: `eng${i + 1}`,
      engineerName: name,
      checkInTime,
      checkOutTime,
      status: randomStatus,
      avatar: `https://placehold.co/40x40.png?text=${name.substring(0, 1)}${
        name.split(" ")[1]?.[0] || ""
      }`,
      date: format(today, "yyyy-MM-dd"),
    };
  }
);

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return NextResponse.json(mockTodaysAttendance);
}
