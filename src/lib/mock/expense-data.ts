import { ExpenseSubmission, RateConfig, VehicleType } from "../types/expense";

export const mockUsers = [
  { id: "user1", name: "Rajesh Kumar" },
  { id: "user2", name: "Priya Patel" },
  { id: "user3", name: "Amit Shah" },
  { id: "user4", name: "Meera Singh" },
];

export const mockExpenseSubmissions: ExpenseSubmission[] = [
  {
    id: "exp1",
    userId: "user1",
    userName: "Rajesh Kumar",
    submissionDate: "2024-03-15",
    distance: 45,
    toll: 100,
    vehicleType: "Two Wheeler",
    totalCost: 325,
    status: "Pending",
    notes: "Client visit to Diamond Market",
  },
  {
    id: "exp2",
    userId: "user2",
    userName: "Priya Patel",
    submissionDate: "2024-03-14",
    distance: 30,
    toll: 50,
    vehicleType: "Four Wheeler",
    totalCost: 450,
    status: "Approved",
  },
  {
    id: "exp3",
    userId: "user3",
    userName: "Amit Shah",
    submissionDate: "2024-03-13",
    distance: 20,
    toll: 0,
    vehicleType: "Public Transport",
    totalCost: 200,
    status: "Rejected",
    notes: "Incomplete documentation",
  },
];

export const mockRateConfigs: RateConfig[] = [
  {
    id: "rate1",
    userId: "user1",
    userName: "Rajesh Kumar",
    vehicleType: "Two Wheeler",
    ratePerKm: 5,
  },
  {
    id: "rate2",
    userId: "user2",
    userName: "Priya Patel",
    vehicleType: "Four Wheeler",
    ratePerKm: 12,
  },
  {
    id: "rate3",
    userId: "user3",
    userName: "Amit Shah",
    vehicleType: "Public Transport",
    ratePerKm: 8,
  },
];

export const defaultRates: Record<VehicleType, number> = {
  "Two Wheeler": 5,
  "Four Wheeler": 12,
  "Public Transport": 8,
};
