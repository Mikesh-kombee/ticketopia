/**
 * Server-side Firebase configuration
 * This file should only be imported in server components or server actions
 */

import { config } from "dotenv";
import { resolve } from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Load environment variables from .env file
config({ path: resolve(process.cwd(), ".env") });

// Initialize Firebase Admin SDK for server-side operations
function initializeFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error(
        "Firebase Project ID is missing from environment variables"
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  return {
    db: getFirestore(),
    auth: getAuth(),
    storage: getStorage(),
  };
}

// Export Firebase Admin services
export const { db, auth, storage } = initializeFirebaseAdmin();
