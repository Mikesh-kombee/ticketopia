import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RoutePoint } from '@/lib/types';

// Mock data - in a real app, this would come from a database
const mockRouteData: { [key: string]: RoutePoint[] } = {
  'eng1-2024-07-30': [
    { lat: 34.0522, lng: -118.2437, timestamp: "2024-07-30T09:00:00Z", speed: 30 },
    { lat: 34.0532, lng: -118.2447, timestamp: "2024-07-30T09:02:00Z", speed: 40 },
    { lat: 34.0542, lng: -118.2457, timestamp: "2024-07-30T09:05:00Z", speed: 0 }, 
    { lat: 34.0542, lng: -118.2457, timestamp: "2024-07-30T09:12:00Z", speed: 0 }, 
    { lat: 34.0552, lng: -118.2467, timestamp: "2024-07-30T09:15:00Z", speed: 25 },
    { lat: 34.0562, lng: -118.2487, timestamp: "2024-07-30T09:20:00Z", speed: 35 },
    { lat: 34.0572, lng: -118.2507, timestamp: "2024-07-30T09:25:00Z", speed: 0 }, 
    { lat: 34.0572, lng: -118.2507, timestamp: "2024-07-30T09:28:00Z", speed: 0 }, 
    { lat: 34.0582, lng: -118.2527, timestamp: "2024-07-30T09:30:00Z", speed: 45 },
    { lat: 34.0592, lng: -118.2547, timestamp: "2024-07-30T09:35:00Z", speed: 0 },
    { lat: 34.0592, lng: -118.2547, timestamp: "2024-07-30T09:45:00Z", speed: 0 }, 
    { lat: 34.0600, lng: -118.2550, timestamp: "2024-07-30T09:47:00Z", speed: 20 },
  ],
  'eng1-2024-07-31': [ // Different day for eng1
    { lat: 34.0600, lng: -118.2550, timestamp: "2024-07-31T10:00:00Z", speed: 15 },
    { lat: 34.0610, lng: -118.2560, timestamp: "2024-07-31T10:05:00Z", speed: 20 },
    { lat: 34.0610, lng: -118.2560, timestamp: "2024-07-31T10:15:00Z", speed: 0 }, // 10 min stop
    { lat: 34.0620, lng: -118.2570, timestamp: "2024-07-31T10:20:00Z", speed: 30 },
  ],
  'eng2-2024-07-30': [
    { lat: 34.0011, lng: -118.2022, timestamp: "2024-07-30T10:00:00Z", speed: 50 },
    { lat: 34.0023, lng: -118.2045, timestamp: "2024-07-30T10:05:00Z", speed: 55 },
    { lat: 34.0035, lng: -118.2068, timestamp: "2024-07-30T10:10:00Z", speed: 0 },
    { lat: 34.0035, lng: -118.2068, timestamp: "2024-07-30T10:20:00Z", speed: 0 }, 
    { lat: 34.0048, lng: -118.2091, timestamp: "2024-07-30T10:25:00Z", speed: 60 },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const engineerId = searchParams.get('engineerId');
  const date = searchParams.get('date'); // Expects YYYY-MM-DD format

  if (!engineerId || !date) {
    return NextResponse.json({ error: 'Engineer ID and date are required' }, { status: 400 });
  }

  const key = `${engineerId}-${date}`;
  const data = mockRouteData[key] || [];

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));

  return NextResponse.json(data);
}
