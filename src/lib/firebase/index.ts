/**
 * Firebase exports
 *
 * This file re-exports the server-side Firebase configuration
 * for easier imports across the application.
 */

import { db, auth, storage } from "./server";

export { db, auth, storage };

// Add a default export for convenience
export default { db, auth, storage };
