'use client';

import { useActionState, useEffect, useState, useMemo, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { getRecipeAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flame, Droplet, Beef, Wheat, TrendingUp, TrendingDown, Scale, Upload, X } from 'lucide-react';
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
    <Button type="submit" disabled={pending} className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed">
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
        html += `<h2 class="text-3xl font-bold mt-6 mb-4 text-center text-primary tracking-tight">${line.substring(3)}</h2>`;
        continue;
      }
      if (line.startsWith('### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        html += `<h3 class="text-2xl font-semibold mt-6 mb-3 border-b-2 border-primary/50 pb-2 text-primary/90">${line.substring(4)}</h3>`;
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const currentRecipe = useMemo(() => state.result?.recipe, [state.result]);
  const nutrition = useMemo(() => state.result?.nutrition, [state.result]);
  const healthAnalysis = useMemo(() => state.result?.healthAnalysis, [state.result]);

  useEffect(() => {
    if (state.result) {
      setSaveMessage('');
    }
  }, [state.timestamp, state.result]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoDataUri(dataUri);
        setPhotoPreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoDataUri(undefined);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

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
            <Badge variant={variant} className="flex gap-2 items-center text-sm p-2 rounded-md shadow-sm">
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
            <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Label htmlFor="ingredientsInput" className="block text-xl font-semibold text-foreground mb-2">
                    What ingredients do you have?
                </Label>
                <p className="text-muted-foreground mb-4">
                    Type your ingredients below, or upload a photo for the AI to detect them.
                </p>
                <div className="flex gap-4">
                    <Textarea
                    id="ingredientsInput"
                    name="ingredients"
                    rows={4}
                    className="flex-grow p-3 border-border rounded-lg focus:ring-2 focus:ring-primary transition-shadow bg-background/70"
                    placeholder="e.g., chicken, broccoli, garlic... (optional if uploading photo)"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    />
                     <div className="relative w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-background/70 hover:border-primary transition-colors flex-shrink-0">
                        <input
                            type="file"
                            id="photoInput"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {photoPreview ? (
                            <>
                                <Image src={photoPreview} alt="Ingredients preview" layout="fill" objectFit="contain" className="rounded-lg p-1 animate-in fade-in zoom-in-95" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-5 w-5 z-10"
                                    onClick={handleRemovePhoto}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground p-1">
                                <Upload className="mx-auto h-6 w-6" />
                                <p className="text-xs mt-1">Upload</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <input type="hidden" name="photoDataUri" value={photoDataUri || ''} />
            <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
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
                        className="w-full p-3 border-border rounded-lg focus:ring-2 focus:ring-primary transition-shadow bg-background/70"
                        placeholder="e.g., gluten, nuts, dairy..."
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <div className="flex justify-center items-center flex-wrap gap-4 mt-6 fade-in-up" style={{ animationDelay: '0.6s' }}>
          <SubmitButton />
          {currentRecipe && !pending && (
            <Button
              type="button"
              onClick={handleSaveRecipe}
              variant="secondary"
              className="font-bold py-3 px-8 rounded-full hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Save Recipe
            </Button>
          )}
           <Link href="/saved-recipes" passHref>
                <Button variant="outline" className="font-bold py-3 px-8 rounded-full hover:bg-accent/10 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">My Saved Recipes</Button>
            </Link>
        </div>
      </form>

      <div className="mt-8">
        {pending && <div className="mx-auto loader"></div>}

        {state.error && !pending && (
          <Alert variant="destructive" className="animate-in fade-in">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        
        {saveMessage && (
            <p className="text-center text-green-600 font-medium mt-4 animate-in fade-in">{saveMessage}</p>
        )}

        {currentRecipe && !pending && (
          <div className="prose prose-lg max-w-none bg-card/80 p-6 mt-4 rounded-lg border animate-in fade-in-up duration-700">
            {nutrition && (
              <div className="not-prose flex flex-wrap justify-around items-center mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center p-2">
                  <Flame className="mx-auto h-8 w-8 text-red-500" />
                  <p className="font-bold text-lg">{nutrition.calories}</p>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
                <div className="text-center p-2">
                  <Droplet className="mx-auto h-8 w-8 text-yellow-500" />
                  <p className="font-bold text-lg">{nutrition.fat}</p>
                  <p className="text-sm text-muted-foreground">Fat</p>
                </div>
                <div className="text-center p-2">
                  <Beef className="mx-auto h-8 w-8 text-sky-500" />
                  <p className="font-bold text-lg">{nutrition.protein}</p>
                  <p className="text-sm text-muted-foreground">Protein</p>
                </div>
                <div className="text-center p-2">
                  <Wheat className="mx-auto h-8 w-8 text-amber-600" />
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
