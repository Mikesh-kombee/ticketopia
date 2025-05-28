
import { NextResponse } from 'next/server';
import type { RecentRouteLogSummary } from '@/lib/types';
import { format } from 'date-fns';

const engineerNames = ["Alice Smith", "Bob Johnson", "Charlie Brown", "Diana Prince"];

const mockRecentRouteLogs: RecentRouteLogSummary[] = Array.from({ length: 5 }, (_, i) => {
  const engineerName = engineerNames[i % engineerNames.length];
  const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
  return {
    id: `R${2000 + i}`,
    engineerId: `eng${(i % engineerNames.length) + 1}`,
    engineerName: engineerName,
    date: format(date, 'yyyy-MM-dd'),
    distanceKm: parseFloat((Math.random() * 100 + 20).toFixed(1)),
    durationMinutes: Math.floor(Math.random() * 240 + 60),
    mapSnapshotUrl: `https://placehold.co/100x60.png?text=Route+${i + 1}`,
    stops: Math.floor(Math.random() * 5 + 1),
  };
});

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 700));
  return NextResponse.json(mockRecentRouteLogs);
}
