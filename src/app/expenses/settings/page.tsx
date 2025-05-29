import { Metadata } from "next";
import { CostSettingsForm } from "@/components/expenses/CostSettingsForm";

export const metadata: Metadata = {
  title: "Expense Settings | Ticketopia",
  description: "Configure expense rates and policies",
};

export default function ExpenseSettingsPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rate Settings</h2>
          <p className="text-muted-foreground">
            Configure reimbursement rates for different vehicle types
          </p>
        </div>
      </div>
      <div className="max-w-2xl">
        <CostSettingsForm  />
      </div>
    </div>
  );
}
