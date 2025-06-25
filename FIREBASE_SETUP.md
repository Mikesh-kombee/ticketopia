# Firebase Setup Guide

This guide explains how to set up Firebase for the Ticketopia application and migrate data from the static `db.json` file to Firestore.

## Prerequisites

1. A Google account
2. Basic familiarity with Firebase

## Firebase Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a name for your project (e.g., "Ticketopia")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"

### 2. Set Up Firestore Database

1. In your Firebase project console, navigate to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in production mode
4. Choose a database location closest to your users
5. Click "Enable"

### 3. Create a Web App

1. In your Firebase project console, click the gear icon next to "Project Overview" and select "Project settings"
2. Scroll down to "Your apps" and click the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "Ticketopia Web")
4. Register the app
5. Copy the Firebase configuration values - you'll need these for your `.env` file

### 4. Generate a Service Account Key (for Admin SDK)

1. In your Firebase project console, go to "Project settings"
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely - you'll need values from this for your `.env` file

## Configuration

1. Copy the `.env.example` file to `.env`
2. Fill in the Firebase configuration values:
   - Copy the Firebase config values from step 3 above:
     - `FIREBASE_API_KEY`
     - `FIREBASE_AUTH_DOMAIN`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_STORAGE_BUCKET`
     - `FIREBASE_MESSAGING_SENDER_ID`
     - `FIREBASE_APP_ID`
     - `FIREBASE_MEASUREMENT_ID`
   - From the service account JSON file (step 4 above), add:
     - `FIREBASE_CLIENT_EMAIL` - The `client_email` value
     - `FIREBASE_PRIVATE_KEY` - The `private_key` value (keep the quotes and escape sequences)

## Security Note

All Firebase interactions are performed server-side only, ensuring API keys and credentials are never exposed to the client. This approach provides better security by:

1. Keeping all Firebase keys and credentials on the server
2. Using Next.js API routes and server actions to interact with Firebase
3. Maintaining proper access controls through Firebase security rules

## Migrating Data

After setting up Firebase, you can migrate the static data from `db.json` to Firestore:

```bash
pnpm migrate-to-firebase
```

This command will:

1. Read the existing `db.json` file
2. Create corresponding collections in Firestore
3. Upload all the data to the Firestore database
4. Back up and replace the original db.json file

## Structure

- `src/lib/firebase/server.ts` - Server-side Firebase configuration (Admin SDK)
- `src/lib/firebase/api.ts` - API functions for interacting with Firebase
- `src/lib/seed-firebase.ts` - Script to migrate data from `db.json` to Firestore
- `src/lib/cleanup-migration.ts` - Script to back up and replace db.json

## Security Rules

By default, the Firestore database is set up with secure rules that don't allow any reads or writes. You'll need to modify these rules in the Firebase console under "Firestore Database" > "Rules".

Here's a basic set of rules to get started:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Only allow access via server
    }
  }
}
```

For a production application with client-side authentication, you might want more granular rules.

## Troubleshooting

- **Firebase Admin SDK initialization error**: Ensure that your `FIREBASE_PRIVATE_KEY` includes all newlines and is properly formatted in the `.env` file.
- **Authentication errors**: Check that you've set up the correct service account and copied the values correctly.
- **Data migration issues**: Ensure your Firestore database is properly initialized and that your service account has the necessary permissions.
