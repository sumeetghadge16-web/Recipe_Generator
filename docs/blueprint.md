# **App Name**: Leftover Chef

## Core Features:

- Ingredient Input: Accepts a list of ingredients from the user through a text input field.
- AI Recipe Generation: Generates a recipe based on the provided ingredients, using the Gemini AI model. The model will use tool reasoning to decide which ingredients it should include in the output.
- Recipe Display: Displays the generated recipe in a user-friendly format, converting markdown from the AI model to HTML.
- Save Recipe: Allows users to save the generated recipe to their local storage.
- Error Handling: Provides user-friendly error messages when recipe generation fails.

## Style Guidelines:

- Primary color: Emerald green (#34D399) to convey freshness and health, nodding to the natural aspect of cooking.
- Background color: Very light gray (#F9FAFA), providing a clean and neutral backdrop that enhances readability.
- Accent color: Blue (#3B82F6), used for interactive elements like buttons to draw attention and signal functionality.
- Font: 'Inter' sans-serif font for a clean and modern reading experience. Note: currently only Google Fonts are supported.
- The layout should use a max-width container to center the content on larger screens, with adequate padding on smaller screens for comfortable reading.
- Use a subtle loading animation (e.g., a spinner) while the recipe is being generated.