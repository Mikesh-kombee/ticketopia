"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

interface ExpenseSummary {
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  recentExpenses: {
    id: string;
    engineerName: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export default function ExpenseDashboard() {
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
    recentExpenses: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenseSummary() {
      try {
        const expensesRef = collection(db, "expenses");
        const querySnapshot = await getDocs(expensesRef);

        let totalAmount = 0;
        let approvedAmount = 0;
        let pendingAmount = 0;
        let rejectedAmount = 0;
        const recentExpenses: ExpenseSummary["recentExpenses"] = [];

        querySnapshot.docs.forEach((doc) => {
          const expense = doc.data();
          const amount = expense.amount || 0;
          totalAmount += amount;

          switch (expense.status) {
            case "approved":
              approvedAmount += amount;
              break;
            case "pending":
              pendingAmount += amount;
              break;
            case "rejected":
              rejectedAmount += amount;
              break;
          }

          recentExpenses.push({
            id: doc.id,
            engineerName: expense.engineerName,
            amount: expense.amount,
            date: expense.date,
            status: expense.status,
          });
        });

        // Sort recent expenses by date
        recentExpenses.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setSummary({
          totalAmount,
          approvedAmount,
          pendingAmount,
          rejectedAmount,
          recentExpenses: recentExpenses.slice(0, 5), // Get only the 5 most recent
        });
      } catch (error) {
        console.error("Error fetching expense summary:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenseSummary();
  }, []);

  if (isLoading) {
    return <div>Loading expense summary...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{summary.totalAmount.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₹{summary.approvedAmount.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            ₹{summary.pendingAmount.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ₹{summary.rejectedAmount.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
