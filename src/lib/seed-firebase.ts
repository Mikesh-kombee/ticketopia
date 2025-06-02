/**
 * Firebase Database Seeding Utility
 *
 * This script migrates the mock data from db.json to Firestore collections.
 * Run this script once to initialize your Firestore database.
 *
 * Usage: npx tsx src/lib/seed-firebase.ts
 */

import { db } from "./firebase/server";
import * as fs from "fs";
import * as path from "path";

const BATCH_SIZE = 500; // Firestore has a limit of 500 operations per batch

async function seedFirebase() {
  console.log("🔥 Starting Firebase database seeding...");

  try {
    // Read the db.json file
    const dbPath = path.join(process.cwd(), "src", "lib", "db.json");
    const dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    // Process collections from db.json
    const collections = Object.keys(dbData);

    for (const collection of collections) {
      const data = dbData[collection];

      // Skip collections that aren't arrays (like defaultRates which is an object)
      if (!Array.isArray(data)) {
        if (typeof data === "object") {
          console.log(`Seeding single document for collection: ${collection}`);
          await db.collection(collection).doc("config").set(data);
        }
        continue;
      }

      console.log(
        `Seeding collection: ${collection} (${data.length} documents)`
      );

      // Use batched writes for better performance
      let batch = db.batch();
      let operationCount = 0;

      for (const item of data) {
        const docId = item.id || crypto.randomUUID();
        const docRef = db.collection(collection).doc(docId);
        batch.set(docRef, item);

        operationCount++;

        // Commit batch when it reaches the limit
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(
            `Committed batch of ${operationCount} operations for ${collection}`
          );
          batch = db.batch();
          operationCount = 0;
        }
      }

      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
        console.log(
          `Committed final batch of ${operationCount} operations for ${collection}`
        );
      }
    }

    console.log("✅ Firebase database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding Firebase database:", error);
    process.exit(1);
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedFirebase().then(() => process.exit(0));
}

export { seedFirebase };
