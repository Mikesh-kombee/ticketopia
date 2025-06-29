"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useTicketStore } from "@/hooks/use-ticket-store";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";
import { createTicketAction, getEngineerEta } from "@/lib/actions";
import { ticketFormSchema, type TicketFormSchema } from "@/lib/schema";
import type { Coordinates, Engineer, IssueType, Ticket } from "@/lib/types";
import { issueTypes } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SubmissionModal } from "./submission-modal";

import {
  Camera,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  Refrigerator,
  Search,
  Send,
  User,
  UsersRound,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Mock data for engineers
const mockEngineers: Engineer[] = [
  {
    id: "eng1",
    name: "Alice Smith",
    location: { lat: 21.1702, lng: 72.8311 },
    specialization: ["Plumbing", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=AS",
  },
  {
    id: "eng2",
    name: "Bob Johnson",
    location: { lat: 21.175, lng: 72.835 },
    specialization: ["Electrical"],
    avatar: "https://placehold.co/40x40.png?text=BJ",
  },
  {
    id: "eng3",
    name: "Charlie Brown",
    location: { lat: 21.165, lng: 72.828 },
    specialization: ["Appliance Repair", "HVAC"],
    avatar: "https://placehold.co/40x40.png?text=CB",
  },
];

const issueTypeIcons: Record<IssueType, React.ElementType> = {
  Plumbing: Wrench,
  Electrical: Zap,
  HVAC: Wind,
  "Appliance Repair": Refrigerator,
  Other: HelpCircle,
};

interface TicketFormProps {
  initialValues?: Partial<TicketFormSchema>;
}

export function TicketForm({ initialValues }: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addTicket } = useTicketStore();
  const { toast } = useToast();
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMapsApi();

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [engineersWithEta, setEngineersWithEta] = useState<Engineer[]>([]);
  const [isFetchingEta, setIsFetchingEta] = useState(false);

  const form = useForm<TicketFormSchema>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      customerName: initialValues?.customerName || "",
      address: initialValues?.address || "",
      issueType: initialValues?.issueType || undefined,
      notes: initialValues?.notes || "",
      photo: undefined, // Photo cannot be pre-filled easily
      assignedEngineerId: initialValues?.assignedEngineerId || undefined,
    },
  });

  const fetchAddressFromCoordinates = useCallback(
    async (coords: Coordinates) => {
      try {
        // Use Google Maps Geocoding API for reverse geocoding
        if (isGoogleMapsLoaded && window.google && window.google.maps) {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({
            location: { lat: coords.lat, lng: coords.lng },
          });

          console.log("response", response);
          if (response.results && response.results.length > 0) {
            // Get the formatted address from the first result
            const formattedAddress = response.results[0].formatted_address;
            form.setValue("address", formattedAddress);
          } else {
            // Fallback if no results found
            form.setValue(
              "address",
              `Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
            );
          }
        } else {
          // Fallback if Google Maps API is not loaded yet
          form.setValue(
            "address",
            `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
          );
        }
        setLocationError(null);
      } catch (error) {
        console.error("Geocoding error:", error);
        // Fallback on error
        form.setValue(
          "address",
          `Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
        );
        setLocationError("Could not fetch address details");
      }
    },
    [form, isGoogleMapsLoaded]
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(coords);
        // Only fetch address if it's not already pre-filled by initialValues
        if (!form.getValues("address")) {
          fetchAddressFromCoordinates(coords);
        } else {
          // If address was pre-filled, ensure currentPosition is set for ETA
          // This assumes pre-filled address corresponds to current location for now
          // A proper solution would geocode the pre-filled address
        }
        setIsLocating(false);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsLocating(false);
      }
    );
  }, [fetchAddressFromCoordinates, form]);

  const fetchEngineersEta = useCallback(async (ticketCoords: Coordinates) => {
    if (!ticketCoords) return;
    setIsFetchingEta(true);
    const engineers = await Promise.all(
      mockEngineers.map(async (engineer) => {
        const etaResult = await getEngineerEta(
          engineer.location,
          ticketCoords,
          engineer.name
        );
        return {
          ...engineer,
          etaMinutes: etaResult.etaMinutes,
          etaExplanation: etaResult.explanation,
        };
      })
    );
    engineers.sort(
      (a, b) => (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity)
    );
    setEngineersWithEta(engineers);
    setIsFetchingEta(false);
  }, []);

  // Effect to reset form when initialValues change (e.g. simulate call button pressed again)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        customerName: initialValues.customerName || "",
        address: initialValues.address || "",
        issueType: initialValues.issueType || undefined,
        notes: initialValues.notes || "",
        photo: undefined,
        assignedEngineerId: initialValues.assignedEngineerId || undefined,
      });
    }
  }, [initialValues, form]);

  useEffect(() => {
    if (currentPosition) {
      fetchEngineersEta(currentPosition);
    }
  }, [currentPosition, fetchEngineersEta]);

  async function onSubmit(data: TicketFormSchema) {
    setIsSubmitting(true);
    const result = await createTicketAction(data, currentPosition ?? undefined);
    setIsSubmitting(false);

    if (result.success && result.ticket) {
      addTicket(result.ticket as Ticket);
      form.reset({
        // Reset to empty or default initial values if any
        customerName:
          initialValues?.customerName && initialValues === form.getValues()
            ? initialValues.customerName
            : "",
        address:
          initialValues?.address && initialValues === form.getValues()
            ? initialValues.address
            : "",
        issueType:
          initialValues?.issueType && initialValues === form.getValues()
            ? initialValues.issueType
            : undefined,
        notes:
          initialValues?.notes && initialValues === form.getValues()
            ? initialValues.notes
            : "",
        photo: undefined,
        assignedEngineerId:
          initialValues?.assignedEngineerId &&
          initialValues === form.getValues()
            ? initialValues.assignedEngineerId
            : undefined,
      });
      if (!initialValues) {
        // Removed automatic geolocation after form submission
        // User can manually click "Locate Me" if needed for next ticket
      }
      setEngineersWithEta([]);
      if (currentPosition && !initialValues) fetchEngineersEta(currentPosition);
      setIsModalOpen(true);
    } else {
      if (result.validationErrors) {
        console.error("Validation errors:", result.validationErrors);
        Object.keys(result.validationErrors).forEach((key) => {
          form.setError(key as keyof TicketFormSchema, {
            type: "manual",
            message:
              result.validationErrors?.[
                key as keyof typeof result.validationErrors
              ]?.[0] || "Invalid input",
          });
        });
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to create ticket.",
      });
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto my-8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 lucide lucide-clipboard-plus"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M9 14h6" />
              <path d="M12 11v6" />
            </svg>
            New Service Ticket
          </CardTitle>
          <CardDescription className="text-center">
            Fill in the details below to create a new service ticket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Customer Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      Address
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          placeholder="e.g., 123 Main St, Anytown, USA"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeolocate}
                        disabled={isLocating}
                        className="shrink-0"
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Locate Me</span>
                      </Button>
                    </div>
                    {locationError && (
                      <FormDescription className="text-destructive">
                        {locationError}
                      </FormDescription>
                    )}
                    <FormDescription>
                      Enter address manually or click &quot;Locate Me&quot; to
                      detect your current location. Location is needed for
                      accurate ETA calculations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      {field.value ? (
                        React.createElement(issueTypeIcons[field.value], {
                          className: "mr-2 h-4 w-4",
                        })
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      Issue Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {issueTypes.map((type) => {
                          const IconComponent = issueTypeIcons[type];
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center">
                                <IconComponent className="mr-2 h-4 w-4" />
                                {type}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedEngineerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <UsersRound className="mr-2 h-4 w-4" />
                      Available Engineers
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isFetchingEta || engineersWithEta.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isFetchingEta
                                ? "Fetching ETAs..."
                                : engineersWithEta.length === 0 &&
                                  currentPosition
                                ? "No engineers found or ETAs unavailable"
                                : "Select an engineer (sorted by ETA)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isFetchingEta && (
                          <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        )}
                        {!isFetchingEta &&
                          engineersWithEta.map((engineer) => (
                            <SelectItem key={engineer.id} value={engineer.id}>
                              <div className="flex justify-between w-full items-center">
                                <span>
                                  {engineer.name} (
                                  {engineer.specialization.join(", ")})
                                </span>
                                {engineer.etaMinutes !== undefined && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center ml-2">
                                    <Clock className="mr-1 h-3 w-3" /> ETA:{" "}
                                    {engineer.etaMinutes} min
                                  </span>
                                )}
                              </div>
                              {engineer.etaExplanation && (
                                <FormDescription className="text-xs">
                                  {engineer.etaExplanation}
                                </FormDescription>
                              )}
                            </SelectItem>
                          ))}
                        {!isFetchingEta && engineersWithEta.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No engineers available for current address.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Engineers are sorted by estimated time of arrival to the
                      provided address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Camera className="mr-2 h-4 w-4" />
                      Photo Upload (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => onChange(e.target.files)}
                        {...restField}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a photo of the issue (max 5MB, JPG/PNG/GIF).
                      {value?.[0] && (
                        <span className="block mt-1">
                          Selected: {value[0].name}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Create Ticket
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <SubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
