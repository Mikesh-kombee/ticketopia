import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let db: Firestore;

async function initializeFirebase() {
  if (getApps().length === 0) {
    const response = await fetch("/api/firebase-config");
    const firebaseConfig = await response.json();
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
}

// Initialize Firebase
initializeFirebase().catch(console.error);

export { db };
