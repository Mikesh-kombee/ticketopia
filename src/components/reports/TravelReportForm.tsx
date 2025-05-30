"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Car, FileText, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// Surat locations for dropdown suggestions
const SURAT_LOCATIONS = [
  "Varachha Diamond Market",
  "Adajan Area",
  "City Light Area",
  "Ring Road",
  "Vesu",
  "Althan",
  "Katargam",
  "Udhna",
  "Piplod",
  "Athwa",
  "New Civil Road",
  "Ghod Dod Road",
  "Magdalla",
  "Pal",
  "Rander",
  "Sachin GIDC",
  "Hazira Industrial Area",
];

const formSchema = z.object({
  vehicleUsed: z.enum(["car", "bike", "public_transport", "other"] as const),
  travelArea: z.string().min(3, {
    message: "Travel area must be at least 3 characters.",
  }),
  expenseType: z.enum([
    "Fuel",
    "Toll",
    "Meals",
    "Accommodation",
    "Other",
  ] as const),
  cost: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Cost must be a positive number.",
    }),
  receipt: z
    .any()
    .optional()
    .refine(
      (files) => !files || !files.length || files[0].size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) =>
        !files || !files.length || ACCEPTED_FILE_TYPES.includes(files[0].type),
      "Only .jpg, .png, and .pdf files are accepted."
    ),
  notes: z.string().optional(),
});

interface TravelReportFormProps {
  onSubmit: (data: TravelReportFormInput) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: {
    employeeName: string;
    vehicleUsed: VehicleType;
    expenseType: ExpenseType;
  };
}

export function TravelReportForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: TravelReportFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleUsed: defaultValues?.vehicleUsed || "car",
      travelArea: "",
      expenseType: defaultValues?.expenseType || "Fuel",
      cost: "",
      notes: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values as TravelReportFormInput);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Vehicle Type Field */}
        <FormField
          control={form.control}
          name="vehicleUsed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="car">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>Car</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bike">
                    <div className="flex items-center gap-2">
                      <span>🚲</span>
                      <span>Bike</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public_transport">
                    <div className="flex items-center gap-2">
                      <span>🚌</span>
                      <span>Public Transport</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <span>🚕</span>
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of vehicle used for travel.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Travel Area Field */}
        <FormField
          control={form.control}
          name="travelArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Travel Area</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || SURAT_LOCATIONS[0]}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area in Surat" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SURAT_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the area in Surat where travel occurred.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expense Type Field */}
        <FormField
          control={form.control}
          name="expenseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Fuel">
                    <div className="flex items-center gap-2">
                      <span>⛽</span>
                      <span>Fuel</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Toll">
                    <div className="flex items-center gap-2">
                      <span>🛣️</span>
                      <span>Toll</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Meals">
                    <div className="flex items-center gap-2">
                      <span>🍔</span>
                      <span>Meals</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Accommodation">
                    <div className="flex items-center gap-2">
                      <span>🏨</span>
                      <span>Accommodation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Other">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of expense for this report.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cost Field */}
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (INR)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the total cost in Indian Rupees.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Receipt Upload Field */}
        <FormField
          control={form.control}
          name="receipt"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Receipt (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="cursor-pointer"
                  onChange={(e) => onChange(e.target.files)}
                  {...fieldProps}
                />
              </FormControl>
              <FormDescription>
                Upload a receipt (JPG, PNG, or PDF, max 5MB).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional details about this expense..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any additional information or context for this expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
