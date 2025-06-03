import  ExpenseList from "@/components/expenses/ExpenseList";
import { CreditCard } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses | Ticketopia",
  description: "Manage travel expenses and reimbursements",
};

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Expenses
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and track travel expense submissions
          </p>
        </div>
      </div>
      <ExpenseList />
    </div>
  );
}
