"use server";

/**
 * @fileOverview Calculates estimated time of arrival (ETA) for engineers to a ticket location using GenAI.
 *
 * - engineerEtaCalculation - A function that calculates the ETA for an engineer.
 * - EngineerEtaInput - The input type for the engineerEtaCalculation function.
 * - EngineerEtaOutput - The return type for the engineerEtaCalculation function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const EngineerEtaInputSchema = z.object({
  engineerLocation: z
    .string()
    .describe(
      "The current location of the engineer as a string (e.g., latitude, longitude)."
    ),
  ticketLocation: z
    .string()
    .describe(
      "The location of the ticket as a string (e.g., latitude, longitude)."
    ),
  engineerName: z.string().describe("The name of the engineer."),
});
export type EngineerEtaInput = z.infer<typeof EngineerEtaInputSchema>;

const EngineerEtaOutputSchema = z.object({
  etaMinutes: z
    .number()
    .describe(
      "The estimated time of arrival in minutes, based on current traffic conditions."
    ),
  explanation: z
    .string()
    .describe(
      "A brief explanation of how the ETA was calculated, considering distance and traffic."
    ),
});
export type EngineerEtaOutput = z.infer<typeof EngineerEtaOutputSchema>;

export async function engineerEtaCalculation(
  input: EngineerEtaInput
): Promise<EngineerEtaOutput> {
  return engineerEtaFlow(input);
}

const prompt = ai.definePrompt({
  name: "engineerEtaPrompt",
  input: { schema: EngineerEtaInputSchema },
  output: { schema: EngineerEtaOutputSchema },
  prompt: `You are an expert in estimating travel times. Given the current location of an engineer and the location of a ticket, estimate the arrival time in minutes.

  Engineer Name: {{{engineerName}}}
  Engineer Location: {{{engineerLocation}}}
  Ticket Location: {{{ticketLocation}}}

  Consider current traffic conditions and provide a brief explanation of your calculation.
  Return the ETA in minutes.
  `,
});

const engineerEtaFlow = ai.defineFlow(
  {
    name: "engineerEtaFlow",
    inputSchema: EngineerEtaInputSchema,
    outputSchema: EngineerEtaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
