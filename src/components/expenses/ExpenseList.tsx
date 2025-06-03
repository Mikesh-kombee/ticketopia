"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  engineerId: string;
  engineerName: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  receiptUrl?: string;
}

type SortField = "date" | "amount" | "engineerName" | "category";
type SortOrder = "asc" | "desc";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const expensesRef = collection(db, "expenses");
        const q = query(expensesRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        const expensesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[];

        setExpenses(expensesData);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenses();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    const modifier = sortOrder === "asc" ? 1 : -1;
    switch (sortField) {
      case "date":
        return (
          modifier * (new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      case "amount":
        return modifier * (a.amount - b.amount);
      case "engineerName":
        return modifier * a.engineerName.localeCompare(b.engineerName);
      case "category":
        return modifier * a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const handleStatusUpdate = async (
    expenseId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        approvedBy: "Admin", // You can replace this with actual admin user
        approvedAt: new Date().toISOString(),
      });

      // Update local state
      setExpenses(
        expenses.map((expense) =>
          expense.id === expenseId
            ? {
                ...expense,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                approvedBy: "Admin",
                approvedAt: new Date().toISOString(),
              }
            : expense
        )
      );

      toast({
        title: "Status Updated",
        description: `Expense has been ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating expense status:", error);
      toast({
        title: "Error",
        description: "Failed to update expense status.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "PPP") : "N/A";
  };

  if (isLoading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("date")}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("engineerName")}
                  >
                    Engineer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("category")}
                  >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("amount")}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.engineerName}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        expense.status.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800"
                          : expense.status.toLowerCase()   === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {expense.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {expense.status.toLowerCase() === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 border-green-200"
                            onClick={() =>
                              handleStatusUpdate(expense.id, "approved")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-200"
                            onClick={() =>
                              handleStatusUpdate(expense.id, "rejected")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedExpense}
        onOpenChange={() => setSelectedExpense(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Engineer</h4>
                <p>{selectedExpense.engineerName}</p>
              </div>
              <div>
                <h4 className="font-medium">Date</h4>
                <p>{formatDate(selectedExpense.date)}</p>
              </div>
              <div>
                <h4 className="font-medium">Category</h4>
                <p>{selectedExpense.category}</p>
              </div>
              <div>
                <h4 className="font-medium">Amount</h4>
                <p>₹{selectedExpense.amount.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="font-medium">Description</h4>
                <p>{selectedExpense.description}</p>
              </div>
              {selectedExpense.receiptUrl && (
                <div>
                  <h4 className="font-medium">Receipt</h4>
                  <a
                    href={selectedExpense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
