export type VehicleType = "Two Wheeler" | "Four Wheeler" | "Public Transport";

export type ExpenseStatus = "Pending" | "Approved" | "Rejected";

export interface ExpenseSubmission {
  id: string;
  userId: string;
  userName: string;
  submissionDate: string;
  distance: number;
  toll: number;
  vehicleType: VehicleType;
  totalCost: number;
  status: ExpenseStatus;
  notes?: string;
}

export interface RateConfig {
  id: string;
  userId: string;
  userName: string;
  vehicleType: VehicleType;
  ratePerKm: number;
}
