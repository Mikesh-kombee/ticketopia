import { Metadata } from "next";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export const metadata: Metadata = {
  title: "Expenses | Ticketopia",
  description: "Manage travel expenses and reimbursements",
};

export default function ExpensesPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Manage and track travel expense submissions
          </p>
        </div>
      </div>
      <ExpenseList />
    </div>
  );
}
