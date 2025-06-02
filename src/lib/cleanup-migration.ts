/**
 * Clean-up script for db.json migration to Firebase
 *
 * This script backs up the existing db.json file and replaces it with
 * a placeholder that redirects users to use Firebase instead.
 *
 * Usage: npx tsx src/lib/cleanup-migration.ts
 */

import * as fs from "fs";
import * as path from "path";
import { format } from "date-fns";

async function cleanupDbJson() {
  try {
    const dbPath = path.join(process.cwd(), "src", "lib", "db.json");

    // Check if db.json exists
    if (!fs.existsSync(dbPath)) {
      console.log("❌ db.json not found, nothing to clean up.");
      return;
    }

    // Create a backup with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
    const backupPath = path.join(
      process.cwd(),
      "src",
      "lib",
      `db.json.backup-${timestamp}`
    );

    // Copy the original file to backup
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup created at ${backupPath}`);

    // Create warning placeholder file
    const placeholderContent = JSON.stringify(
      {
        __warning__:
          "This mock data file has been migrated to Firebase Firestore.",
        __migration_date__: new Date().toISOString(),
        __instructions__:
          "Please use the Firebase API in src/lib/firebase/api.ts instead of accessing this file directly.",
        __backup__: `A backup of the original data is available at db.json.backup-${timestamp}`,
      },
      null,
      2
    );

    // Write the placeholder
    fs.writeFileSync(dbPath, placeholderContent);
    console.log(`✅ Replaced db.json with placeholder warning`);

    console.log("\n🔥 Migration cleanup completed successfully!");
    console.log(
      "📝 NOTE: You should now use the Firebase API for all data operations."
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup function if this file is executed directly
if (require.main === module) {
  cleanupDbJson().then(() => process.exit(0));
}

export { cleanupDbJson };
