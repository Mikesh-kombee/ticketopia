import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

async function initializeFirebase() {
  if (getApps().length === 0) {
    const response = await fetch("/api/firebase-config");
    const firebaseConfig = await response.json();
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize Firebase
initializeFirebase().catch(console.error);

export { app, auth, db };
