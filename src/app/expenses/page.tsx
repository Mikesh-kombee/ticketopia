import { Metadata } from "next";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export const metadata: Metadata = {
  title: "Expenses | Ticketopia",
  description: "Manage travel expenses and reimbursements",
};

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Expenses
          </h1>
          <p className="text-muted-foreground">
            Manage and track travel expense submissions
          </p>
        </div>
      </div>
      <ExpenseList />
    </div>
  );
}
