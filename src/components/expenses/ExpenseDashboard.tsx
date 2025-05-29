"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db.json";
import {
  ExpenseStatus,
  ExpenseSubmission,
  RateConfig,
} from "@/lib/types/expense";
import { useState } from "react";
import { CostSettingsForm, type FormData } from "./CostSettingsForm";
import { ExpenseTable } from "./ExpenseTable";

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<ExpenseSubmission[]>(
    db.expenseSubmissions as ExpenseSubmission[]
  );
  const [rateConfigs, setRateConfigs] = useState<RateConfig[]>(
    db.rateConfigs as RateConfig[]
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

  const handleRateSubmit = (data: FormData) => {
    const newConfig: RateConfig = {
      id: `rate${rateConfigs.length + 1}`,
      userId: data.userId,
      userName:
        (db.users as { id: string; name: string }[]).find(
          (usr) => usr.id === data.userId
        )?.name || "",
      vehicleType: data.vehicleType,
      ratePerKm: data.ratePerKm,
    };
    setRateConfigs([...rateConfigs, newConfig]);
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
    <div className="container mx-auto py-6">
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expense Submissions</TabsTrigger>
          <TabsTrigger value="settings">Cost Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Submissions</CardTitle>
              <div className="flex gap-4 mt-4">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value as ExpenseStatus })
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
            </CardHeader>
            <CardContent>
              <ExpenseTable
                expenses={filteredExpenses}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewNotes={handleViewNotes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Cost Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <CostSettingsForm onSubmit={handleRateSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog({ ...notesDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <p>{notesDialog.content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
