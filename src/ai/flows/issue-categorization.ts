// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for categorizing issue types based on the notes provided in the ticket.
 *
 * - categorizeIssue - A function that takes issue notes as input and returns the categorized issue type.
 * - IssueCategorizationInput - The input type for the categorizeIssue function.
 * - IssueCategorizationOutput - The return type for the categorizeIssue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IssueCategorizationInputSchema = z.object({
  notes: z.string().describe('The notes provided in the ticket describing the issue.'),
});
export type IssueCategorizationInput = z.infer<typeof IssueCategorizationInputSchema>;

const IssueCategorizationOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The categorized issue type. Possible values include: Plumbing, Electrical, HVAC, Appliance Repair, Other.'
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence level of the categorization, between 0 and 1.'),
});
export type IssueCategorizationOutput = z.infer<typeof IssueCategorizationOutputSchema>;

export async function categorizeIssue(input: IssueCategorizationInput): Promise<IssueCategorizationOutput> {
  return categorizeIssueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'issueCategorizationPrompt',
  input: {schema: IssueCategorizationInputSchema},
  output: {schema: IssueCategorizationOutputSchema},
  prompt: `You are an expert in issue categorization for a home repair service.

  Based on the notes provided, determine the most appropriate issue category and your confidence level.

  Notes: {{{notes}}}
  `,
});

const categorizeIssueFlow = ai.defineFlow(
  {
    name: 'categorizeIssueFlow',
    inputSchema: IssueCategorizationInputSchema,
    outputSchema: IssueCategorizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
