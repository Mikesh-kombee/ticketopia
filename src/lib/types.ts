export interface Coordinates {
  lat: number;
  lng: number;
}

export type IssueType =
  | "Plumbing"
  | "Electrical"
  | "HVAC"
  | "Appliance Repair"
  | "Other";
export const issueTypes: IssueType[] = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance Repair",
  "Other",
];

export type TicketStatus =
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Cancelled";
export const ticketStatuses: TicketStatus[] = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

export interface Ticket {
  id: string;
  customerName: string;
  address: string;
  coordinates?: Coordinates;
  issueType: IssueType;
  notes?: string;
  photoFileName?: string;
  assignedEngineerId?: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Engineer {
  id: string;
  name: string;
  location: Coordinates;
  specialization: string[];
  avatar?: string;
  status?: "Active" | "On Route" | "On Break" | "Offline";
  currentTask?: string;
  distanceKm?: number;
}

export interface TicketFormValues {
  customerName: string;
  address: string;
  issueType: IssueType;
  notes?: string;
  photo?: FileList;
  assignedEngineerId?: string;
}

// Types for Route Playback
export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string; // ISO string
  speed: number; // km/h
}

export interface RouteStop extends RoutePoint {
  stopDurationMinutes: number;
  stopNumber?: number;
}

// Types for Alerts Dashboard
export type AlertSeverity = "high" | "medium" | "low" | "info";
export type AlertStatus = "new" | "reviewed" | "dismissed";
export type AlertType =
  | "Speeding"
  | "Long Idle"
  | "Geofence Breach"
  | "Service Due"
  | "Unusual Activity";

export const alertTypes: AlertType[] = [
  "Speeding",
  "Long Idle",
  "Geofence Breach",
];
export const alertSeverities: AlertSeverity[] = [
  "high",
  "medium",
  "low",
  "info",
];
export const alertStatuses: AlertStatus[] = ["new", "reviewed", "dismissed"];

export interface Alert {
  id: string;
  type: string;
  engineerName: string;
  timestamp: string;
  severity: "high" | "medium" | "low" | "info";
  status: "new" | "reviewed" | "dismissed";
  alertId: string;
  engineerId: string;
  location: Coordinates;
  locationSnippet: string;
  details: string;
  routeTrace?: RoutePoint[];
  notifications: {
    push: boolean;
    email: boolean;
  };
}

// --- New Dashboard Specific Types ---

export type EngineerStatus = "Active" | "Offline" | "On Break" | "On Route";
export const engineerStatuses: EngineerStatus[] = [
  "Active",
  "Offline",
  "On Break",
  "On Route",
];

export interface ActiveEngineerSummary {
  id: string;
  name: string;
  status: EngineerStatus;
  avatar?: string; // URL to placeholder image
  currentTask?: string; // e.g., "Servicing Ticket #123" or "En route to Anytown"
  currentLocation?: string; // e.g., "Downtown" or "Anytown"
  distanceKm?: number; // Distance to the current location
}

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export const ticketPriorities: TicketPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export interface OpenTicketSummary {
  id: string;
  customerName: string;
  status: TicketStatus;
  priority: TicketPriority;
  issueType: IssueType;
  assignedEngineerId?: string;
  lastUpdate: string; // ISO string
}

export interface RecentRouteLogSummary {
  id: string;
  engineerId: string;
  engineerName: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  durationMinutes: number;
  mapSnapshotUrl?: string; // URL to placeholder image
  stops: number;
}

export interface DashboardAlertSummary {
  id: string;
  alertId: string; // Original Alert ID
  type: AlertType;
  engineerName: string;
  timestamp: string; // ISO string
  severity: AlertSeverity;
  status: AlertStatus; // Alert's current status
}

export type AttendanceStatus =
  | "Checked In"
  | "Checked Out"
  | "Late"
  | "Absent"
  | "On Leave";
export const attendanceStatuses: AttendanceStatus[] = [
  "Checked In",
  "Checked Out",
  "Late",
  "Absent",
  "On Leave",
];

export interface AttendanceRecordSummary {
  id: string;
  engineerId: string;
  engineerName: string;
  checkInTime?: string; // ISO string or HH:mm
  checkOutTime?: string; // ISO string or HH:mm
  status: AttendanceStatus;
  avatar?: string; // URL to placeholder image
  date: string; // YYYY-MM-DD
}

// --- GeoFence Check-In Types ---
export interface GeoFenceSite {
  id: string;
  name: string;
  center: Coordinates; // Center of the circular geofence
  radiusKm: number; // Radius in kilometers
}

export interface AttendanceLog {
  id?: number; // Auto-incremented by IndexedDB
  logId: string; // UUID for server-side identification
  siteId: string;
  siteName: string;
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  syncStatus: "pending" | "synced" | "failed";
  userId: string; // Placeholder for user ID
}

export interface TravelReportEntry {
  date: string;
  totalTravelTime: string; // hh:mm
  totalDistance: number; // km
  startLocation: string;
  endLocation: string;
  numberOfTrips: number;
  anomaly?: boolean;
  idleTimeMinutes?: number;
}

export type VehicleType = "car" | "bike" | "public_transport" | "other";
export type ExpenseType = "Fuel" | "Toll" | "Meals" | "Accommodation" | "Other";
export type ReportStatus = "Pending" | "Approved" | "Rejected";

export interface TravelReport {
  id: string;
  employeeId: string;
  employeeName: string;
  vehicleUsed: VehicleType;
  travelArea: string;
  expenseType: ExpenseType;
  cost: number;
  currency: string; // e.g., "USD"
  receiptUrl?: string;
  submissionDate: string; // ISO string
  status: ReportStatus;
  notes?: string;
}

export interface TravelReportFormInput {
  vehicleUsed: VehicleType;
  travelArea: string;
  expenseType: ExpenseType;
  cost: string; // Use string for input, convert to number on submission
  receipt?: FileList;
  notes?: string;
}

export interface ExpenseSubmission {
  id: string;
  userId: string;
  userName: string;
  submissionDate: string; // YYYY-MM-DD
  distance: number;
  toll: number;
  vehicleType: string;
  totalCost: number;
  status: "Pending" | "Approved" | "Rejected";
  notes?: string;
}

export interface RateConfig {
  id: string;
  userId: string;
  userName: string;
  vehicleType: string;
  ratePerKm: number;
}

export interface Geofence {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number; // in meters
  type: "office" | "site" | "restricted" | "other";
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // admin user ID
}

export interface GeofenceLog {
  id: string;
  geofenceId: string;
  engineerId: string;
  timestamp: string;
  eventType: "entry" | "exit";
  location: {
    lat: number;
    lng: number;
  };
}
