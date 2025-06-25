# 🔧 App Refactor Prompt – Dashboard, Routes, Reports, Alerts & GeoFence (Surat-based)

## 🧩 Context

You're working on a field service tracking app tailored to Indian engineers in and around **Surat, Gujarat**. The app uses Firebase as its backend and integrates geolocation, route playback, expense management, safety alerts, and admin controls.

---

## 1. 🧱 Dashboard Enhancement

**Current Problem**: Dashboard is too basic and lacks depth.

**Refactor Goal**:

- Replace current dashboard layout with **rich tables** showing:
  - ✅ Engineer Attendance Summary
  - 🚗 Distance Travelled (per user/date)
  - 💸 Approved/Rejected Expenses with status
  - 📍 Geofence Entry/Exit logs
  - ⚠️ Recent Safety Alerts (table view)

**Use Firebase Realtime/Firestore data** as the source.
Ensure filters and sorting options for each table (e.g., by date, user, status).

---

## 2. 🛰️ Route Playback Enhancements

**Current Problem**: Playback only shows past routes.

**Refactor Goal**:

- Add **engineer's current live location marker** on the map
- Show current speed, status (Moving/Idle), and last synced timestamp
- Optionally, display route heatmaps (distance/time-based)

**Use Firebase live location updates** for current position.

---

## 3. 📊 Reports Page Update

**Current Problem**: Page only shows Travel & Expense Reports.

**Refactor Goal**:

- **Remove the existing Travel & Expense section**
- Replace with:
  - 🚀 Engineer performance tables (distance, safety, time-in/out)
  - ⏱️ Monthly Hours Worked (incl. night shifts)
  - 🧾 All entries from the new dashboard’s table views
- Reports should be **exportable** (CSV, PDF)

**Data Source**: Firebase Firestore or Analytics layer.

---

## 4. 🚨 Alerts Page Refactor

**Current Problem**: Too many maps = cluttered UI

**Refactor Goal**:

- Display **one centralized map**
- Left Sidebar should:
  - List alerts with filters (e.g., type, engineer, date)
  - On selection, center map to location of alert
  - Highlight alert region with marker/popup
- Add Alert detail panel below or in modal

**Alert Types**: Over-speed, Geofence breach, Night riding

---

## 5. 📍 GeoFence Management Page

**New Page Requirements**:

- Path: `/admin/geofences`
- Add new geofence with:
  - Label (e.g., "Surat HQ", "Bardoli Plant")
  - Lat/Lng by clicking on map
  - Custom Radius input (in meters)
  - Multiple geofences allowed

**UI**:

- Map-centered interface
- Sidebar with list of all geofences (edit/delete buttons)
- Firebase backend: Store under `/geofences`

