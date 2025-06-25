/**
 * Firebase exports
 *
 * This file re-exports all Firebase-related functionality
 * for easier imports across the application.
 */

// Core Firebase instances
import { db, auth, storage } from "./server";
import { db as clientDb } from "./client";

// Re-export core instances
export { db, auth, storage, clientDb };

// Operations
export * from "./operations/tickets";
export * from "./operations/engineers";
export * from "./operations/geofence";

// Add a default export for convenience
export default {
  db,
  auth,
  storage,
  clientDb,
};
