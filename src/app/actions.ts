
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

  if (!ingredients || ingredients.split(',').map(i => i.trim()).filter(Boolean).length < 2) {
    return { error: 'Please enter at least two ingredients to generate a creative recipe.' };
  }

  try {
    const result = await generateRecipeFromIngredients({ ingredients });
    return { result, timestamp: Date.now() };
  } catch (e) {
    console.error(e);
    return { error: 'Sorry, something went wrong while creating your recipe. Please check your connection and try again.' };
  }
}
