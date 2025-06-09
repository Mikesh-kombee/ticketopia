import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

config();

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

const engineers = [
  { id: "ENG001", name: "Rajesh Patel" },
  { id: "ENG002", name: "Priya Sharma" },
  { id: "ENG003", name: "Amit Kumar" },
  { id: "ENG004", name: "Neha Gupta" },
  { id: "ENG005", name: "Vikram Singh" },
];

const alertTypes = [
  "Speeding",
  "Long Idle",
  "Geofence Breach",
  "Unusual Activity",
];
const alertStatuses: ("new" | "acknowledged" | "resolved")[] = [
  "new",
  "acknowledged",
  "resolved",
];
const suratCenter = { lat: 21.1702, lng: 72.8311 };

const deleteCollection = async (collectionPath: string, batchSize: number) => {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
};

async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
  resolve: (value?: unknown) => void
) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

const generateAlertMessage = (type: string, details: { speed?: number }) => {
  switch (type) {
    case "Speeding":
      return `Exceeded speed limit. Current speed: ${details.speed} km/h.`;
    case "Long Idle":
      return `Vehicle has been idle for over 15 minutes.`;
    case "Geofence Breach":
      return `Exited designated work zone.`;
    case "Unusual Activity":
      return "Unusual vehicle activity detected.";
    default:
      return "A new alert has been triggered.";
  }
};

const generateMasterData = async () => {
  const routeBatch = db.batch();
  const alertBatch = db.batch();
  const routeDataRef = db.collection("route-data");
  const alertsRef = db.collection("alerts");
  let totalPoints = 0;
  let totalAlerts = 0;

  console.log("Generating consistent route and alert data...");

  for (const engineer of engineers) {
    const numRoutes = Math.floor(Math.random() * 2) + 2; // 2-3 routes per engineer
    for (let i = 0; i < numRoutes; i++) {
      const routePoints = [];
      const today = new Date();
      const routeStartTime = new Date(today);
      routeStartTime.setDate(today.getDate() - Math.floor(Math.random() * 3)); // Within last 3 days
      routeStartTime.setHours(
        8 + Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 60)
      );

      const startPoint = {
        lat: suratCenter.lat + (Math.random() - 0.5) * 0.2,
        lng: suratCenter.lng + (Math.random() - 0.5) * 0.2,
      };
      const durationMinutes = 60 + Math.floor(Math.random() * 120);
      const endPoint = {
        lat: startPoint.lat + (Math.random() - 0.5) * 0.1,
        lng: startPoint.lng + (Math.random() - 0.5) * 0.1,
      };

      const latIncrement = (endPoint.lat - startPoint.lat) / durationMinutes;
      const lngIncrement = (endPoint.lng - startPoint.lng) / durationMinutes;

      // Generate points for the route
      for (let j = 0; j < durationMinutes; j++) {
        const timestamp = new Date(routeStartTime.getTime() + j * 60000);
        const location = {
          lat: startPoint.lat + j * latIncrement + (Math.random() - 0.5) * 0.001,
          lng: startPoint.lng + j * lngIncrement + (Math.random() - 0.5) * 0.001,
        };
        const speed = parseFloat((30 + Math.random() * 40).toFixed(2));
        const point = {
          timestamp: Timestamp.fromDate(timestamp),
          location,
          speed,
        };
        routePoints.push(point);

        const docRef = routeDataRef.doc();
        routeBatch.set(docRef, { engineerId: engineer.id, ...point });
        totalPoints++;
      }

      // Create an alert at a random point within this route
      if (routePoints.length > 0) {
        const alertIndex = Math.floor(Math.random() * routePoints.length);
        const alertPoint = routePoints[alertIndex];
        const alertType =
          alertTypes[Math.floor(Math.random() * alertTypes.length)];

        const newAlert = {
          engineerId: engineer.id,
          engineerName: engineer.name,
          timestamp: alertPoint.timestamp,
          type: alertType,
          message: generateAlertMessage(alertType, {
            speed: alertPoint.speed,
          }),
          location: alertPoint.location,
          status: alertStatuses[Math.floor(Math.random() * alertStatuses.length)],
        };
        const alertDocRef = alertsRef.doc();
        alertBatch.set(alertDocRef, newAlert);
        totalAlerts++;
      }
    }
  }

  await routeBatch.commit();
  console.log(`Committed ${totalPoints} route points.`);
  await alertBatch.commit();
  console.log(`Committed ${totalAlerts} alerts, linked to routes.`);
};

const seedData = async () => {
  try {
    console.log("Clearing old data...");
    await deleteCollection("alerts", 50);
    console.log("Old 'alerts' cleared.");
    await deleteCollection("route-data", 50);
    console.log("Old 'route-data' cleared.");
    console.log("--------------------------");
    await generateMasterData();
    console.log("--------------------------");
    console.log("Successfully seeded all new, consistent data!");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
};

seedData(); 