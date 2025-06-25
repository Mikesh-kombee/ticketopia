export interface Coordinates {
  latitude: number;
  longitude: number;
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
  avatar?: string;
  specialization: string[];
  location: Coordinates;
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
  type: "OverSpeed" | "GeofenceBreach" | "NightRiding";
  engineerId: string;
  engineerName: string;
  location: Coordinates;
  timestamp: string;
  details: {
    speed?: number;
    geofenceName?: string;
    duration?: number;
  };
  severity: "High" | "Medium" | "Low";
  status: "Active" | "Resolved";
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
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
  center: Coordinates;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLog {
  id: string;
  logId: string;
  siteId: string;
  siteName: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  syncStatus: "pending" | "synced" | "failed";
  createdAt: string;
  updatedAt: string;
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

export interface RouteData {
  id: string;
  engineerId: string;
  engineerName?: string;
  date: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  heading?: number;
  accuracy?: number;
}

export interface Expense {
  id: string;
  engineerId: string;
  engineerName: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  receiptUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RouteLogEntry {
  id: string;
  engineerId: string;
  engineerName: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: Coordinates;
  endLocation: Coordinates;
  distanceKm: number;
  durationMinutes: number;
  stops: number;
  status: "completed" | "in_progress" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  location?: Coordinates;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
