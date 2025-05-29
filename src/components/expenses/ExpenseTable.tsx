import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpenseSubmission, ExpenseStatus } from "@/lib/types/expense";

interface ExpenseTableProps {
  expenses: ExpenseSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewNotes: (notes: string) => void;
}

const statusColors: Record<ExpenseStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export function ExpenseTable({
  expenses,
  onApprove,
  onReject,
  onViewNotes,
}: ExpenseTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Name</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead>Distance (km)</TableHead>
            <TableHead>Toll (₹)</TableHead>
            <TableHead>Vehicle Type</TableHead>
            <TableHead>Total Cost (₹)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.userName}</TableCell>
              <TableCell>
                {new Date(expense.submissionDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{expense.distance}</TableCell>
              <TableCell>{expense.toll}</TableCell>
              <TableCell>{expense.vehicleType}</TableCell>
              <TableCell>{expense.totalCost}</TableCell>
              <TableCell>
                <Badge className={statusColors[expense.status]}>
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {expense.status === "Pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApprove(expense.id)}
                        className="bg-green-50 hover:bg-green-100 text-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(expense.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {expense.notes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewNotes(expense.notes!)}
                    >
                      View Notes
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
