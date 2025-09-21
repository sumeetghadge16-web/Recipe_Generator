'use server';
/**
 * @fileOverview AI agent that generates a recipe and a preservation plan from a list of ingredients.
 *
 * - generateRecipeFromIngredients - A function that handles the generation process.
 * - GenerateRecipeFromIngredientsInput - The input type for the function.
 * - GenerateRecipeFromIngredientsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeFromIngredientsInputSchema = z.object({
  ingredients: z
    .string()
    .optional()
    .describe('A comma-separated list of ingredients to use.'),
  allergies: z
    .string()
    .optional()
    .describe('A comma-separated list of allergies to avoid.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of the ingredients, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateRecipeFromIngredientsInput = z.infer<
  typeof GenerateRecipeFromIngredientsInputSchema
>;

const GenerateRecipeFromIngredientsOutputSchema = z.object({
  recipe: z.object({
    content: z.string().describe('The generated recipe in markdown format.'),
    nutrition: z
      .object({
        calories: z.string().describe('Estimated calories per serving.'),
        fat: z.string().describe('Estimated fat content in grams per serving.'),
        protein: z
          .string()
          .describe('Estimated protein content in grams per serving.'),
        sugar: z.string().describe('Estimated sugar content in grams per serving.'),
      })
      .describe('Estimated nutritional information per serving for the recipe.'),
    healthAnalysis: z
      .string()
      .describe(
        'A brief, one-sentence analysis on whether the recipe is more suitable for weight loss, weight gain, or maintenance.'
      ),
  }),
  preservation: z.object({
      content: z.string().describe('The generated preservation plan in markdown format.'),
      preservationDays: z
      .string()
      .describe(
        'An estimation of how many days the food can be preserved using the provided plan.'
      ),
  })

});
export type GenerateRecipeFromIngredientsOutput = z.infer<
  typeof GenerateRecipeFromIngredientsOutputSchema
>;

export async function generateRecipeFromIngredients(
  input: GenerateRecipeFromIngredientsInput
): Promise<GenerateRecipeFromIngredientsOutput> {
  return generateRecipeFromIngredientsFlow(input);
}

const generateContentPrompt = ai.definePrompt({
  name: 'generateContentPrompt',
  input: {schema: GenerateRecipeFromIngredientsInputSchema},
  output: {schema: GenerateRecipeFromIngredientsOutputSchema},
  prompt: `You are a world-class creative chef and food preservation expert. Your mission is to provide a helpful response based on the user's ingredients. You will generate both a recipe and a preservation plan.

You will use the text description and, if provided, a photo of the ingredients as your primary sources of information. If a photo is provided, you MUST identify the ingredients in the photo and use them as the primary ingredients.

{{#if ingredients}}
Text-described ingredients: {{{ingredients}}}
{{/if}}

{{#if photoDataUri}}
Photo of ingredients: {{media url=photoDataUri}}
{{/if}}

{{#if allergies}}
**Allergy Alert:** The user is allergic to the following: {{{allergies}}}. You MUST NOT include any of these ingredients or their derivatives in your response.
{{/if}}

---

**Task 1: Generate a Recipe**

**Rules:**
1.  **Primary Ingredients:** You MUST use the ingredients provided by the user.
2.  **Pantry Staples:** You MAY suggest 1-3 common pantry staples (like salt, pepper, olive oil, water).
3.  **No Exotic Ingredients:** Do not suggest any ingredients not on the user's list or common pantry staples.
4.  **Formatting:** Use Markdown.
    - Recipe title should be a Level 2 Heading (##).
    - Include a short, enticing one-paragraph description.
    - Use Level 3 Headings (###) for "Ingredients" and "Instructions".
    - List ingredients with bullet points (*).
    - List instructions with numbers (1., 2., 3.).
    - Provide estimated prep time and cook time.
5.  **Nutrition:** Provide an estimated nutritional breakdown per serving for calories, fat, protein, and sugar.
6.  **Health Analysis:** Provide a brief, one-sentence analysis on whether the recipe is better for weight loss, gain, or maintenance.
7.  **Output Fields:** Fill the 'recipe.content', 'recipe.nutrition' and 'recipe.healthAnalysis' fields.

---

**Task 2: Create a Preservation Plan**

**Rules:**
1.  **Analyze Ingredients:** Identify the best preservation method for the provided ingredients (e.g., refrigeration, freezing, pickling, drying).
2.  **Step-by-Step Guide:** Provide a simple, clear, step-by-step guide for each recommended preservation method.
3.  **Storage Instructions:** Explain how and where to store the preserved food.
4.  **Estimate Shelf Life:** Provide an estimated number of days the food will remain healthy and safe to eat (e.g., "3-5 days," "up to 6 months"). This is crucial.
5.  **Formatting:** Use Markdown.
    - The title should be a Level 2 Heading (##), like "## Preservation Plan for Your Ingredients".
    - Use Level 3 Headings (###) for each ingredient or method (e.g., "### Freezing Berries," "### Refrigerating Leafy Greens").
    - Use numbered lists for instructions.
6.  **Output Fields:** Fill the 'preservation.content' and 'preservation.preservationDays' fields.

Generate both the recipe and the preservation plan.`,
});

const generateRecipeFromIngredientsFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromIngredientsFlow',
    inputSchema: GenerateRecipeFromIngredientsInputSchema,
    outputSchema: GenerateRecipeFromIngredientsOutputSchema,
  },
  async input => {
    const {output} = await generateContentPrompt(input);
    return output!;
  }
);
