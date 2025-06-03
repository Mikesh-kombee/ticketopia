import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load environment variables
config();

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

// Mock engineers data
const engineers = [
  { id: "ENG001", name: "Rajesh Patel" },
  { id: "ENG002", name: "Priya Sharma" },
  { id: "ENG003", name: "Amit Kumar" },
  { id: "ENG004", name: "Neha Gupta" },
  { id: "ENG005", name: "Vikram Singh" },
];

// Mock expense categories
const expenseCategories = [
  "Fuel",
  "Maintenance",
  "Travel",
  "Meals",
  "Accommodation",
  "Tools",
  "Other",
];

// Mock alert types
const alertTypes = [
  "OverSpeed",
  "GeofenceBreach",
  "NightRiding",
  "IdleTime",
  "RouteDeviation",
];

// Generate random coordinates within Surat area
const generateRandomLocation = () => {
  const suratCenter = { lat: 21.1702, lng: 72.8311 };
  const radius = 0.1; // 10km radius
  const lat = suratCenter.lat + (Math.random() - 0.5) * radius;
  const lng = suratCenter.lng + (Math.random() - 0.5) * radius;
  return { lat, lng };
};

// Generate expense data
const generateExpenseData = async () => {
  const expensesRef = db.collection("expenses");
  const today = new Date();

  for (const engineer of engineers) {
    // Generate 5-10 expenses per engineer
    const numExpenses = Math.floor(Math.random() * 5) + 5;

    for (let i = 0; i < numExpenses; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const category =
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = Math.floor(Math.random() * 5000) + 100; // ₹100-₹5100
      const status =
        Math.random() < 0.7
          ? "Approved"
          : Math.random() < 0.5
          ? "Pending"
          : "Rejected";
      const description = `${category} expense for work on ${date.toLocaleDateString()}`;

      await expensesRef.add({
        engineerId: engineer.id,
        engineerName: engineer.name,
        date: date,
        category,
        amount,
        status,
        description,
        receiptUrl:
          Math.random() < 0.8
            ? `https://example.com/receipts/${Math.random()
                .toString(36)
                .substring(7)}.jpg`
            : null,
        approvedBy: status === "Approved" ? "Admin User" : null,
        approvedAt:
          status === "Approved" ? new Date(date.getTime() + 86400000) : null, // Approved next day
      });
    }
  }
};

// Generate alerts data
const generateAlertsData = async () => {
  const alertsRef = db.collection("alerts");
  const today = new Date();

  for (const engineer of engineers) {
    // Generate 3-8 alerts per engineer
    const numAlerts = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < numAlerts; i++) {
      const timestamp = new Date(today);
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const location = generateRandomLocation();
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const resolved = Math.random() < 0.6; // 60% chance of being resolved

      let details = {};
      switch (type) {
        case "OverSpeed":
          details = {
            speed: Math.floor(Math.random() * 30) + 70, // 70-100 km/h
            threshold: 60,
          };
          break;
        case "GeofenceBreach":
          details = {
            geofenceName: "Surat HQ",
            breachType: Math.random() < 0.5 ? "Entry" : "Exit",
          };
          break;
        case "NightRiding":
          details = {
            startTime: new Date(timestamp.getTime() - 3600000), // 1 hour before
            endTime: timestamp,
          };
          break;
        case "IdleTime":
          details = {
            duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
          };
          break;
        case "RouteDeviation":
          details = {
            distance: Math.floor(Math.random() * 5000) + 1000, // 1-6 km
            expectedRoute: "Main Route",
          };
          break;
      }

      await alertsRef.add({
        engineerId: engineer.id,
        engineerName: engineer.name,
        timestamp: timestamp,
        type,
        location,
        severity:
          Math.random() < 0.3 ? "High" : Math.random() < 0.5 ? "Medium" : "Low",
        status: resolved ? "Resolved" : "Active",
        details,
        resolvedAt: resolved ? new Date(timestamp.getTime() + 3600000) : null, // Resolved 1 hour later
        resolvedBy: resolved ? "System" : null,
      });
    }
  }
};

const seedReportsData = async () => {
  try {
    console.log("Starting to seed reports data...");

    console.log("Generating expense data...");
    await generateExpenseData();

    console.log("Generating alerts data...");
    await generateAlertsData();

    console.log("Successfully seeded all reports data!");
  } catch (error) {
    console.error("Error seeding reports data:", error);
  }
};

// Run the seeding function
seedReportsData();
