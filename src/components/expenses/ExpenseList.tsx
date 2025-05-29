"use client";

import React, { useState } from "react";
import { ExpenseTable } from "./ExpenseTable";
import db from "@/lib/db.json";
import { ExpenseSubmission, ExpenseStatus } from "@/lib/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";

export function ExpenseList() {
  const [expenses, setExpenses] = useState<ExpenseSubmission[]>(
    db.expenseSubmissions as ExpenseSubmission[]
  );
  const [notesDialog, setNotesDialog] = useState({ open: false, content: "" });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all" as ExpenseStatus | "all",
  });

  const handleApprove = (id: string) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id ? { ...exp, status: "Approved" as ExpenseStatus } : exp
      )
    );
  };

  const handleReject = (id: string) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id ? { ...exp, status: "Rejected" as ExpenseStatus } : exp
      )
    );
  };

  const handleViewNotes = (notes: string) => {
    setNotesDialog({ open: true, content: notes });
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesStartDate =
      !filters.startDate ||
      new Date(exp.submissionDate) >= new Date(filters.startDate);
    const matchesEndDate =
      !filters.endDate ||
      new Date(exp.submissionDate) <= new Date(filters.endDate);
    const matchesStatus =
      filters.status === "all" || exp.status === filters.status;
    return matchesStartDate && matchesEndDate && matchesStatus;
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Expense Submissions</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/expenses/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value as ExpenseStatus | "all",
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ExpenseTable
              expenses={filteredExpenses}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewNotes={handleViewNotes}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog({ ...notesDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{notesDialog.content}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
