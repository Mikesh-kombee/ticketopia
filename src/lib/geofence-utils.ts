
import type { Coordinates } from './types';

/**
 * Calculates the distance in kilometers between two geographic coordinates using the Haversine formula.
 * @param coord1 The first coordinate { lat, lng }.
 * @param coord2 The second coordinate { lat, lng }.
 * @returns The distance in kilometers.
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// The isPointInPolygon function can remain here if used by other parts of the application,
// or be removed if GeoFenceCheckIn was its only consumer.
// For now, I'll keep it as it doesn't harm.

/**
 * Checks if a point is inside a polygon using the ray casting algorithm.
 * @param point The point to check { lat, lng }.
 * @param polygon An array of { lat, lng } coordinates representing the polygon vertices.
 * @returns True if the point is inside the polygon, false otherwise.
 */
export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  if (!polygon || polygon.length < 3) {
    return false; // A polygon must have at least 3 vertices.
  }

  const x = point.longitude; // Use lng for x-coordinate
  const y = point.latitude; // Use lat for y-coordinate
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
