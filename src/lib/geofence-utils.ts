
import type { Coordinates } from './types';

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

  const x = point.lng; // Use lng for x-coordinate
  const y = point.lat; // Use lat for y-coordinate
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
