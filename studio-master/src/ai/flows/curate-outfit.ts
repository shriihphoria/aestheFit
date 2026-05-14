
'use server';
/**
 * @fileOverview Outfit curation flow.
 *
 * This file defines a Genkit flow that takes a list of clothing items (as data URIs), an occasion,
 * and an optional person image. It returns an outfit suggestion (text) and an AI-generated image
 * of the outfit.
 *
 * @exports curateOutfit - The main function to call for outfit curation.
 * @exports CurateOutfitInput - The input type for the curateOutfit function.
 * @exports CurateOutfitOutput - The output type for the curateOutfit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenkitMediaPart, GenkitTextPart } from 'genkit';


const CurateOutfitInputSchema = z.object({
  clothingItems: z
    .array(
      z
        .string()
        .describe(
          "A clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .describe('An array of clothing items to choose from.'),
  occasion: z.string().describe('The occasion for which the outfit is being curated.'),
  personImageDataUri: z.string().optional().describe(
    "An optional image of the person for try-on, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});

export type CurateOutfitInput = z.infer<typeof CurateOutfitInputSchema>;

const CurateOutfitOutputSchema = z.object({
  outfitSuggestion: z.string().describe('A textual description of the suggested outfit.'),
  generatedOutfitImageUri: z.string().describe(
    'A data URI of the AI-generated image of the outfit being worn. Expected format: "data:image/png;base64,<encoded_data>".'
  ),
});

export type CurateOutfitOutput = z.infer<typeof CurateOutfitOutputSchema>;

export async function curateOutfit(input: CurateOutfitInput): Promise<CurateOutfitOutput> {
  return curateOutfitFlow(input);
}

const textSuggestionPrompt = ai.definePrompt({
  name: 'textSuggestionPrompt',
  input: {schema: CurateOutfitInputSchema},
  output: {schema: z.object({outfitSuggestion: z.string().describe('A description of the suggested outfit.')})},
  prompt: `You are a personal stylist AI, helping users create outfits from their existing wardrobe.
Given the following clothing items and occasion, suggest a stylish outfit. Be as descriptive as possible.

Occasion: {{{occasion}}}

Clothing Items:
{{#each clothingItems}}
- {{media url=this}}
{{/each}}

{{#if personImageDataUri}}
(Note: A reference image of the person has been provided. You can use this to tailor the textual suggestion if appropriate, e.g., considering styles that might suit their features, but primarily focus on the clothing items and occasion for the outfit description itself.)
{{/if}}`,
});

const curateOutfitFlow = ai.defineFlow(
  {
    name: 'curateOutfitFlow',
    inputSchema: CurateOutfitInputSchema,
    outputSchema: CurateOutfitOutputSchema,
  },
  async (input) => {
    // 1. Get textual outfit suggestion
    const { output: textOutput } = await textSuggestionPrompt(input);
    if (!textOutput?.outfitSuggestion) {
      throw new Error('Failed to generate outfit suggestion text.');
    }

    // 2. Prepare prompt for image generation
    const imagePromptElements: (GenkitTextPart | GenkitMediaPart)[] = [
      {
        text: `Create a clean, professional product-style image of the following outfit: "${textOutput.outfitSuggestion}". Display the outfit on a neutral, abstract mannequin or a stylized display form, suitable for an e-commerce presentation. The focus should be entirely on the clothing items, clearly showing their details and how they are worn together. Use a plain, light-colored studio background. The entire outfit must be visible.`
      }
      // The input.personImageDataUri is intentionally not added here for image generation,
      // as the request is to display the outfit on a figure/mannequin.
      // It is still available to the textSuggestionPrompt if needed there.
    ];

    // 3. Generate image
    const { media, text: imageGenText } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Specific model for image generation
      prompt: imagePromptElements,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Ensure IMAGE is requested, TEXT for any textual feedback
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media?.url) {
      console.error("Image generation failed. Text response from image gen model:", imageGenText);
      const errorMessage = imageGenText || 'Failed to generate outfit image. The model may have refused due to safety settings or other issues.';
      throw new Error(errorMessage);
    }

    return {
      outfitSuggestion: textOutput.outfitSuggestion,
      generatedOutfitImageUri: media.url,
    };
  }
);

