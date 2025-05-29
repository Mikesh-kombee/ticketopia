import { Metadata } from "next";
import { CostSettingsForm } from "@/components/expenses/CostSettingsForm";

export const metadata: Metadata = {
  title: "Expense Settings | Ticketopia",
  description: "Configure expense rates and policies",
};

export default function ExpenseSettingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Rate Settings
          </h1>
          <p className="text-muted-foreground">
            Configure reimbursement rates for different vehicle types
          </p>
        </div>
      </div>
      <div className="max-w-2xl">
        <CostSettingsForm />
      </div>
    </div>
  );
}
