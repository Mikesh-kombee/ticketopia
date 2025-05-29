"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseType, TravelReportFormInput, VehicleType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const reportSchema = z.object({
  // employeeName: z.string().min(1, "Employee name is required"), // Auto-filled
  vehicleUsed: z.enum(["car", "bike", "public_transport", "other"], {
    errorMap: () => ({ message: "Please select a vehicle type." }),
  }),
  travelArea: z.string().min(1, "Travel area is required"),
  expenseType: z.enum(["Fuel", "Toll", "Meals", "Accommodation", "Other"], {
    errorMap: () => ({ message: "Please select an expense type." }),
  }),
  cost: z
    .string()
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
      message: "Please enter a valid cost greater than 0",
    }),
  receipt: z.any().optional(),
  notes: z.string().optional(),
});

interface TravelReportFormProps {
  onSubmit: (data: TravelReportFormInput) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<TravelReportFormInput & { employeeName: string }>;
}

const vehicleOptions: { label: string; value: VehicleType }[] = [
  { label: "Car", value: "car" },
  { label: "Bike", value: "bike" },
  { label: "Public Transport", value: "public_transport" },
  { label: "Other", value: "other" },
];

const expenseTypeOptions: { label: string; value: ExpenseType }[] = [
  { label: "Fuel", value: "Fuel" },
  { label: "Toll", value: "Toll" },
  { label: "Meals", value: "Meals" },
  { label: "Accommodation", value: "Accommodation" },
  { label: "Other", value: "Other" },
];

export function TravelReportForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: TravelReportFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TravelReportFormInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      vehicleUsed: defaultValues?.vehicleUsed || undefined,
      travelArea: defaultValues?.travelArea || "",
      expenseType: defaultValues?.expenseType || undefined,
      cost: defaultValues?.cost || "",
      notes: defaultValues?.notes || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div>
        <Label htmlFor="employeeName">Employee Name</Label>
        <Input
          id="employeeName"
          type="text"
          value={defaultValues?.employeeName || "N/A"}
          readOnly
          disabled
          className="mt-1 bg-muted/50"
        />
      </div>

      <div>
        <Label htmlFor="vehicleUsed">Vehicle Used</Label>
        <Controller
          name="vehicleUsed"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="vehicleUsed" className="mt-1">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.vehicleUsed && (
          <p className="text-sm text-red-500 mt-1">
            {errors.vehicleUsed.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="travelArea">Travel Area</Label>
        <Input
          id="travelArea"
          type="text"
          {...register("travelArea")}
          placeholder="e.g., Downtown, Client Site X"
          className="mt-1"
        />
        {errors.travelArea && (
          <p className="text-sm text-red-500 mt-1">
            {errors.travelArea.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="expenseType">Expense Type</Label>
        <Controller
          name="expenseType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="expenseType" className="mt-1">
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.expenseType && (
          <p className="text-sm text-red-500 mt-1">
            {errors.expenseType.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="cost">Cost (USD)</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          {...register("cost")}
          placeholder="e.g., 25.50"
          className="mt-1"
        />
        {errors.cost && (
          <p className="text-sm text-red-500 mt-1">{errors.cost.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="receipt">Receipt (Optional)</Label>
        <Input
          id="receipt"
          type="file"
          {...register("receipt")}
          className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {errors.receipt && (
          <p className="text-sm text-red-500 mt-1">{errors.receipt.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Add any additional details..."
          className="mt-1"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Report"
        )}
      </Button>
    </form>
  );
}
