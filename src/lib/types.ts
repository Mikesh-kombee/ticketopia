export type Coordinates = {
  lat: number;
  lng: number;
};

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
  notes: string;
  photoFileName?: string;
  assignedEngineerId?: string;
  status: TicketStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  priority?: TicketPriority; // Added for dashboard
}

export interface Engineer {
  id: string;
  name: string;
  location: Coordinates;
  specialization: IssueType[];
  etaMinutes?: number;
  etaExplanation?: string;
  status?: EngineerStatus; // Added for dashboard
  avatar?: string; // Added for dashboard
  distanceKm?: number; // For nearby engineers feature
}

export interface TicketFormValues {
  customerName: string;
  address: string;
  issueType: IssueType;
  notes: string;
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
  "Service Due",
  "Unusual Activity",
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
  timestamp: string; // ISO string
  type: AlertType;
  severity: AlertSeverity;
  engineerId: string;
  engineerName: string;
  location: Coordinates;
  locationSnippet: string;
  details?: string;
  routeTrace?: Coordinates[];
  status: AlertStatus;
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
  assignedEngineerName?: string;
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

// Types for DashboardHomePage component data (mock data for now)
// export type EngineerStatus = // This line is commented out to resolve the linting error
