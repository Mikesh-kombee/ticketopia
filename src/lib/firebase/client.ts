import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

async function initializeFirebase() {
  if (getApps().length === 0) {
    // For SSR and static builds, use environment variables directly
    // For client-side, fetch from API if possible
    let firebaseConfig;

    if (typeof window !== "undefined") {
      try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/firebase-config`);
        firebaseConfig = await response.json();
      } catch (error) {
        // Fallback to environment variables in case fetch fails
        console.error(
          "Failed to fetch Firebase config, using environment variables",
          error
        );
        firebaseConfig = getFirebaseConfigFromEnv();
      }
    } else {
      // Server-side rendering
      firebaseConfig = getFirebaseConfigFromEnv();
    }

    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (error) {
      console.error("Firebase initialization error", error);
      // Create dummy implementations for server-side rendering/static build
      if (typeof window === "undefined") {
        console.log("Creating mock Firebase for server-side rendering");
        // This allows the build to proceed but will be replaced by real Firebase on client-side
        app = {} as FirebaseApp;
        auth = { currentUser: null } as ReturnType<typeof getAuth>;
        db = {} as ReturnType<typeof getFirestore>;
      }
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

// Helper function to get Firebase config from environment variables
function getFirebaseConfigFromEnv() {
  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-for-build",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      "dummy-project.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "dummy-project.appspot.com",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123def456",
  };
}

// Initialize Firebase
initializeFirebase().catch(console.error);

export { app, auth, db };
