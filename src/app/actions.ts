
'use server';

import { GenerateRecipeFromIngredientsOutput, generateRecipeFromIngredients } from '@/ai/flows/generate-recipe-from-ingredients';

interface GenerateRecipeState {
  result?: GenerateRecipeFromIngredientsOutput;
  error?: string;
  timestamp?: number;
}

export async function getRecipeAction(
  prevState: GenerateRecipeState,
  formData: FormData
): Promise<GenerateRecipeState> {
  const ingredients = formData.get('ingredients') as string;
  const allergies = formData.get('allergies') as string;
  const photoDataUri = formData.get('photoDataUri') as string | undefined;

  if (!photoDataUri && (!ingredients || ingredients.trim().length === 0)) {
    return { error: 'Please enter at least one ingredient or upload a photo to generate a recipe.' };
  }

  try {
    const result = await generateRecipeFromIngredients({ ingredients, allergies, photoDataUri });
    return { result, timestamp: Date.now() };
  } catch (e) {
    console.error(e);
    return { error: 'Sorry, something went wrong while creating your recipe. Please check your connection and try again.' };
  }
}
