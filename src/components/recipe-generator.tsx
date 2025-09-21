'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { getRecipeAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  recipeMarkdown: undefined,
  error: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed">
      {pending ? 'Generating...' : 'Generate Recipe'}
    </Button>
  );
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h2>${line.substring(3)}</h2>`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      html += `<h3>${line.substring(4)}</h3>`;
      continue;
    }
    if (line.startsWith('* ')) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${line.substring(2)}</li>`;
      continue;
    }
    if (line.match(/^\d+\. /)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${line.replace(/^\d+\. /, '')}</li>`;
      continue;
    }

    if (inUl && !line.startsWith('* ')) { html += '</ul>'; inUl = false; }
    if (inOl && !line.match(/^\d+\. /)) { html += '</ol>'; inOl = false; }
    
    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    if (processedLine.trim()) {
      html += `<p>${processedLine}</p>`;
    }
  }

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return html;
}

export function RecipeGenerator() {
  const [state, formAction] = useActionState(getRecipeAction, initialState);
  const { pending } = useFormStatus();
  const [saveMessage, setSaveMessage] = useState('');
  const [currentRecipe, setCurrentRecipe] = useState<string | undefined>();

  useEffect(() => {
    if (state.recipeMarkdown) {
      setCurrentRecipe(state.recipeMarkdown);
      setSaveMessage(''); // Reset save message when new recipe is generated
    }
  }, [state.timestamp, state.recipeMarkdown]);

  const handleSaveRecipe = () => {
    if (currentRecipe) {
      try {
        let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const recipeTitleMatch = currentRecipe.match(/^##\s*(.*)$/m);
        const title = recipeTitleMatch ? recipeTitleMatch[1].trim() : "Untitled Recipe";

        const isDuplicate = savedRecipes.some(recipe => recipe.content === currentRecipe);

        if (!isDuplicate) {
          savedRecipes.push({ title: title, content: currentRecipe, savedAt: new Date().toISOString() });
          localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
          setSaveMessage(`"${title}" saved successfully!`);
        } else {
          setSaveMessage('This recipe is already saved!');
        }
      } catch (error) {
        console.error("Could not save recipe:", error);
        setSaveMessage('Failed to save recipe.');
      }
    }
  };

  return (
    <div>
      <form action={formAction} className="text-center">
        <Label htmlFor="ingredientsInput" className="block text-xl font-semibold text-foreground mb-2">
          What ingredients do you have?
        </Label>
        <p className="text-muted-foreground mb-4">
          Enter a few items (e.g., "chicken breast, tomatoes, rice") and let the AI agent create a recipe for you!
        </p>
        <Textarea
          id="ingredientsInput"
          name="ingredients"
          rows={4}
          className="w-full max-w-xl mx-auto p-3 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-shadow bg-background"
          placeholder="e.g., chicken, broccoli, garlic, lemon, olive oil..."
          required
        />
        <div className="flex justify-center items-center space-x-4 mt-5">
          <SubmitButton />
          {currentRecipe && !pending && (
            <Button
              type="button"
              onClick={handleSaveRecipe}
              variant="secondary"
              className="font-bold py-3 px-8 rounded-full hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Save Recipe
            </Button>
          )}
           <Link href="/saved-recipes" passHref>
                <Button variant="outline" className="font-bold py-3 px-8 rounded-full hover:bg-accent/10 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">My Saved Recipes</Button>
            </Link>
        </div>
      </form>

      <div className="mt-8">
        {pending && <div className="mx-auto loader"></div>}

        {state.error && !pending && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        
        {saveMessage && (
            <p className="text-center text-green-600 font-medium mt-4">{saveMessage}</p>
        )}

        {currentRecipe && !pending && (
          <div className="prose prose-lg max-w-none bg-background/70 p-6 mt-4 rounded-lg border border-border">
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(currentRecipe) }} />
          </div>
        )}
      </div>
    </div>
  );
}
