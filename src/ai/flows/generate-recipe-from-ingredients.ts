'use server';
/**
 * @fileOverview AI agent that generates a recipe from a list of ingredients.
 *
 * - generateRecipeFromIngredients - A function that generates a recipe from a list of ingredients.
 * - GenerateRecipeFromIngredientsInput - The input type for the generateRecipeFromIngredients function.
 * - GenerateRecipeFromIngredientsOutput - The return type for the generateRecipeFromingredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeFromIngredientsInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients to use in the recipe.'),
});
export type GenerateRecipeFromIngredientsInput = z.infer<
  typeof GenerateRecipeFromIngredientsInputSchema
>;

const GenerateRecipeFromIngredientsOutputSchema = z.object({
  recipe: z.string().describe('The generated recipe in markdown format.'),
  nutrition: z
    .object({
      calories: z.string().describe('Estimated calories per serving.'),
      fat: z.string().describe('Estimated fat content in grams per serving.'),
      protein: z
        .string()
        .describe('Estimated protein content in grams per serving.'),
      sugar: z.string().describe('Estimated sugar content in grams per serving.'),
    })
    .describe('Estimated nutritional information per serving.'),
  healthAnalysis: z
    .string()
    .describe(
      'A brief, one-sentence analysis on whether the recipe is more suitable for weight loss, weight gain, or maintenance, based on its nutritional content.'
    ),
});
export type GenerateRecipeFromIngredientsOutput = z.infer<
  typeof GenerateRecipeFromIngredientsOutputSchema
>;

export async function generateRecipeFromIngredients(
  input: GenerateRecipeFromIngredientsInput
): Promise<GenerateRecipeFromIngredientsOutput> {
  return generateRecipeFromIngredientsFlow(input);
}

const generateRecipePrompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeFromIngredientsInputSchema},
  output: {schema: GenerateRecipeFromIngredientsOutputSchema},
  prompt: `You are a world-class creative chef and recipe agent. Your mission is to create a delicious, practical, and easy-to-follow recipe using the following ingredients: {{{ingredients}}}.

**Rules:**
1.  **Primary Ingredients:** You MUST use the ingredients provided by the user.
2.  **Pantry Staples:** You MAY suggest 1-3 common pantry staples (like salt, pepper, olive oil, water, flour, sugar, basic spices) if they are essential to make a complete dish. Clearly state these.
3.  **No Exotic Ingredients:** Do not suggest any ingredients that are not on the user's list or are not common pantry staples.
4.  **Structure:** The recipe must have a clear structure.
5.  **Formatting:** Use Markdown for formatting.
    - The recipe title should be a Level 2 Heading (##).
    - Include a short, enticing one-paragraph description of the dish.
    - Use a Level 3 Heading (###) for "Ingredients" and "Instructions".
    - List ingredients with bullet points (*).
    - List instructions with numbers (1., 2., 3.).
    - Do NOT use bold formatting (e.g., **text**). Present all information like Prep time, Cook time, and Cuisine type as plain text.
6.  **Creativity & Details:** Provide an estimated prep time and cook time. Suggest a suitable cuisine type (e.g., "Mediterranean," "Asian-inspired").
7.  **Nutrition:** You must provide an estimated nutritional breakdown per serving for calories, fat, protein, and sugar.
8.  **Health Analysis:** Based on the nutritional information, provide a brief, one-sentence analysis on whether the recipe is generally better for weight loss, weight gain, or weight maintenance.

Create a recipe based on the user's input.`,
});

const generateRecipeFromIngredientsFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromIngredientsFlow',
    inputSchema: GenerateRecipeFromIngredientsInputSchema,
    outputSchema: GenerateRecipeFromIngredientsOutputSchema,
  },
  async input => {
    const {output} = await generateRecipePrompt(input);
    return output!;
  }
);
