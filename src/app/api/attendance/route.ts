
import { NextResponse } from 'next/server';
import type { AttendanceLog } from '@/lib/types';

// This is a mock endpoint. In a real application, you'd save to a database.
// For now, we'll just log the received data.

export async function POST(request: Request) {
  try {
    const logs = await request.json() as AttendanceLog[];

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: 'No attendance logs provided or invalid format.' }, { status: 400 });
    }

    console.log('Received attendance logs for syncing:', logs);

    // Simulate processing delay and success/failure
    await new Promise(resolve => setTimeout(resolve, 800));

    // In a real app, you'd attempt to save each log and return specific statuses.
    // For this mock, we'll assume all are successfully synced.
    const syncResults = logs.map(log => ({
      logId: log.logId,
      synced: true, // Or false if some failed
      message: "Successfully synced to server." // Or an error message
    }));

    return NextResponse.json({ message: 'Attendance logs processed.', results: syncResults }, { status: 200 });

  } catch (error) {
    console.error('Error processing attendance logs:', error);
    return NextResponse.json({ error: 'Failed to process attendance logs.' }, { status: 500 });
  }
}
