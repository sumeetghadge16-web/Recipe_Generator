'use client';

import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { getRecipeAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flame, Droplet, Beef, Wheat, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';

const initialState = {
  result: undefined,
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
        html += `<h2 class="text-3xl font-bold mt-6 mb-4 text-center text-primary">${line.substring(3)}</h2>`;
        continue;
      }
      if (line.startsWith('### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        html += `<h3 class="text-2xl font-semibold mt-6 mb-3 border-b-2 border-primary pb-2 text-primary/90">${line.substring(4)}</h3>`;
        continue;
      }
      if (line.startsWith('* ')) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul class="list-disc pl-6 space-y-2 text-foreground/90">'; inUl = true; }
        html += `<li class="text-base">${line.substring(2)}</li>`;
        continue;
      }
      if (line.match(/^\d+\. /)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol class="list-decimal pl-6 space-y-3 text-foreground/90">'; inOl = true; }
        html += `<li class="text-base">${line.replace(/^\d+\. /, '')}</li>`;
        continue;
      }
  
      if (inUl && !line.startsWith('* ')) { html += '</ul>'; inUl = false; }
      if (inOl && !line.match(/^\d+\. /)) { html += '</ol>'; inOl = false; }
      
      let processedLine = line;
  
      if (processedLine.trim()) {
        html += `<p class="mb-4 text-base leading-relaxed text-foreground/80">${processedLine}</p>`;
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
  const [ingredients, setIngredients] = useState('');
  const [allergies, setAllergies] = useState('');
  const { toast } = useToast();
  
  const currentRecipe = useMemo(() => state.result?.recipe, [state.result]);
  const nutrition = useMemo(() => state.result?.nutrition, [state.result]);
  const healthAnalysis = useMemo(() => state.result?.healthAnalysis, [state.result]);

  useEffect(() => {
    if (state.result) {
      setSaveMessage('');
    }
  }, [state.timestamp, state.result]);

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

  const HealthAnalysisBadge = () => {
    if (!healthAnalysis) return null;

    const analysis = healthAnalysis.toLowerCase();
    let icon: React.ReactNode;
    let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
    let text = "Maintenance";

    if (analysis.includes('loss')) {
        icon = <TrendingDown className="h-4 w-4" />;
        variant = 'default';
        text = 'Weight Loss';
    } else if (analysis.includes('gain')) {
        icon = <TrendingUp className="h-4 w-4" />;
        variant = 'destructive';
        text = 'Weight Gain';
    } else {
        icon = <Scale className="h-4 w-4" />;
        variant = 'secondary';
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <Badge variant={variant} className="flex gap-2 items-center text-sm p-2 rounded-md">
                {icon}
                <span>{text}</span>
            </Badge>
            <p className="text-sm text-center text-muted-foreground">{healthAnalysis}</p>
        </div>
    );
};

  return (
    <div>
      <form action={formAction} className="text-center">
        <div className='max-w-xl mx-auto'>
            <Label htmlFor="ingredientsInput" className="block text-xl font-semibold text-foreground mb-2">
              What ingredients do you have?
            </Label>
            <p className="text-muted-foreground mb-4">
              Enter a few items (e.g., "chicken breast, tomatoes, rice") and let the AI agent create a recipe for you!
            </p>
            <div className="relative w-full">
              <Textarea
                id="ingredientsInput"
                name="ingredients"
                rows={4}
                className="w-full p-3 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-shadow bg-background"
                placeholder="e.g., chicken, broccoli, garlic, lemon, olive oil..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                required
              />
            </div>
            <Label htmlFor="allergiesInput" className="block text-xl font-semibold text-foreground mt-6 mb-2">
                Any allergies? <span className="text-sm text-muted-foreground">(Optional)</span>
            </Label>
            <p className="text-muted-foreground mb-4">
                List any allergies to exclude from the recipe.
            </p>
            <div className="relative w-full">
                <Input
                    id="allergiesInput"
                    name="allergies"
                    className="w-full p-3 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-shadow bg-background"
                    placeholder="e.g., gluten, nuts, dairy..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                />
            </div>
        </div>
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
            {nutrition && (
              <div className="not-prose flex justify-around items-center mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Flame className="mx-auto h-8 w-8 text-red-500" />
                  <p className="font-bold text-lg">{nutrition.calories}</p>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
                <div className="text-center">
                  <Droplet className="mx-auto h-8 w-8 text-yellow-500" />
                  <p className="font-bold text-lg">{nutrition.fat}</p>
                  <p className="text-sm text-muted-foreground">Fat</p>
                </div>
                <div className="text-center">
                  <Beef className="mx-auto h-8 w-8 text-blue-500" />
                  <p className="font-bold text-lg">{nutrition.protein}</p>
                  <p className="text-sm text-muted-foreground">Protein</p>
                </div>
                <div className="text-center">
                  <Wheat className="mx-auto h-8 w-8 text-purple-500" />
                  <p className="font-bold text-lg">{nutrition.sugar}</p>
                  <p className="text-sm text-muted-foreground">Sugar</p>
                </div>
              </div>
            )}

            {healthAnalysis && (
                <div className="not-prose my-6 flex justify-center">
                    <HealthAnalysisBadge />
                </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(currentRecipe) }} />
          </div>
        )}
      </div>
    </div>
  );
}
