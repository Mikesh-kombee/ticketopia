/**
 * API Route for safely exposing limited configuration values to the client
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  });
}
