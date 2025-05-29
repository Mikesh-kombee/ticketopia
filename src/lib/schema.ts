import { z } from "zod";
import type { IssueType } from "./types";
import { issueTypes } from "./types";

export const ticketFormSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: "Customer name must be at least 2 characters." }),
  address: z
    .string()
    .min(10, { message: "Address must be at least 10 characters." }),
  issueType: z.enum(issueTypes as [IssueType, ...IssueType[]], {
    required_error: "Issue type is required.",
  }),
  notes: z
    .string()
    .min(10, { message: "Notes must be at least 10 characters." })
    .max(500, { message: "Notes cannot exceed 500 characters." }),
  photo: z
    .custom<FileList>()
    .optional() // Placeholder, actual file validation can be more complex
    .refine(
      (files) =>
        !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024,
      `Max file size is 5MB.`
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ["image/jpeg", "image/png", "image/gif"].includes(files[0].type),
      ".jpg, .png, .gif files are accepted."
    ),
  assignedEngineerId: z.string().optional(),
});

export type TicketFormSchema = z.infer<typeof ticketFormSchema>;
