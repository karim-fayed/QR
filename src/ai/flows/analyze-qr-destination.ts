// 'use server';
'use server';

/**
 * @fileOverview An AI agent that analyzes the destination content of a QR code to assess its safety and appropriateness.
 *
 * - analyzeQrDestination - A function that handles the analysis process.
 * - AnalyzeQrDestinationInput - The input type for the analyzeQrDestination function.
 * - AnalyzeQrDestinationOutput - The return type for the analyzeQrDestination function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQrDestinationInputSchema = z.object({
  destinationUrl: z
    .string()
    .url()
    .describe('The URL that the QR code will direct users to.'),
});
export type AnalyzeQrDestinationInput = z.infer<typeof AnalyzeQrDestinationInputSchema>;

const AnalyzeQrDestinationOutputSchema = z.object({
  safetyAssessment: z
    .string()
    .describe(
      'An assessment of the safety and appropriateness of the destination URL, including potential risks and recommendations.'
    ),
  contentSummary: z
    .string()
    .describe('A brief summary of the content found at the destination URL.'),
  suggestedAction: z
    .enum(['allow', 'rewrite', 'refuse'])
    .describe(
      'A suggested action to take based on the analysis: allow the URL, rewrite the content, or refuse to use the URL.'
    ),
});
export type AnalyzeQrDestinationOutput = z.infer<typeof AnalyzeQrDestinationOutputSchema>;

export async function analyzeQrDestination(
  input: AnalyzeQrDestinationInput
): Promise<AnalyzeQrDestinationOutput> {
  return analyzeQrDestinationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeQrDestinationPrompt',
  input: {schema: AnalyzeQrDestinationInputSchema},
  output: {schema: AnalyzeQrDestinationOutputSchema},
  prompt: `You are an AI assistant that analyzes the content of a given URL and assesses its safety and appropriateness. Your task is to provide a comprehensive evaluation, including a summary of the content, a safety assessment, and a suggested action (allow, rewrite, or refuse).

  URL: {{{destinationUrl}}}
  \n  Provide your analysis in the following format:
  - Content Summary: [A brief summary of the content found at the destination URL]
  - Safety Assessment: [An assessment of the safety and appropriateness of the destination URL, including potential risks and recommendations]
  - Suggested Action: [A suggested action to take based on the analysis: allow the URL, rewrite the content, or refuse to use the URL]`,
});

const analyzeQrDestinationFlow = ai.defineFlow(
  {
    name: 'analyzeQrDestinationFlow',
    inputSchema: AnalyzeQrDestinationInputSchema,
    outputSchema: AnalyzeQrDestinationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
