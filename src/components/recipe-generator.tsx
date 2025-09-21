
'use client';

import { useActionState, useEffect, useState, useMemo, useRef, useTransition } from 'react';
import Image from 'next/image';
import { getRecipeAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flame, Droplet, Beef, Wheat, TrendingUp, TrendingDown, Scale, Upload, X, Clock, Save } from 'lucide-react';
import { Terminal } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Card, CardContent } from '@/components/ui/card';

const initialState = {
  result: undefined,
  error: undefined,
  timestamp: Date.now(),
};

function SubmitButton({ pending }: { pending: boolean }) {
    const text = 'Generating...';
    const buttonText = 'Generate Recipe';
    return (
      <Button type="submit" disabled={pending} className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed">
        {pending ? text : buttonText}
      </Button>
    );
  }

function markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    let html = markdown
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // H2
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-6 mb-4 text-center text-primary tracking-tight">$1</h2>')
      // H3
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mt-6 mb-3 border-b-2 border-primary/50 pb-2 text-primary/90">$1</h3>')
      // Lists
      .replace(/^\s*\n\* (.*)/gm, (m, p1) => {
          const items = m.split('\n').map(item => item.replace(/^\* /, '').trim()).filter(Boolean);
          return '<ul class="list-disc pl-6 space-y-2 text-foreground/90">' + items.map(item => `<li class="text-base">${item}</li>`).join('') + '</ul>';
      })
      .replace(/^\s*\n\d+\. (.*)/gm, (m, p1) => {
          const items = m.split('\n').map(item => item.replace(/^\d+\. /, '').trim()).filter(Boolean);
          return '<ol class="list-decimal pl-6 space-y-3 text-foreground/90">' + items.map(item => `<li class="text-base">${item}</li>`).join('') + '</ol>';
      })
      // Paragraphs
      .replace(/\n\n/g, '<br/>')
      .replace(/^(?!<h[23]>|<ul>|<ol>|<li>)(.*)$/gim, '<p class="mb-4 text-base leading-relaxed text-foreground/80">$1</p>')
      .replace(/<p><\/p>/g, ''); // Remove empty paragraphs

    return html;
}

export function RecipeGenerator() {
  const [state, formAction] = useActionState(getRecipeAction, initialState);
  const [isPending, startTransition] = useTransition();
  const [ingredients, setIngredients] = useState('');
  const [allergies, setAllergies] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const lastSuccessfulResult = useMemo(() => {
    if (state.result) {
      return state.result;
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timestamp]);

  const { recipe, preservation } = lastSuccessfulResult || {};
  const { content: currentContent, nutrition, healthAnalysis } = recipe || {};
  const { content: preservationContent, preservationDays } = preservation || {};

  useEffect(() => {
    if (preservationContent) {
        try {
            let savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]');
            const titleMatch = preservationContent.match(/^##\s*(.*)$/m);
            const title = titleMatch ? titleMatch[1].trim() : "Untitled Preservation Plan";
            const isDuplicate = savedContent.some(item => item.title === title && item.content === preservationContent);

            if (!isDuplicate) {
                savedContent.push({ title: title, content: preservationContent, savedAt: new Date().toISOString(), type: 'preservation' });
                localStorage.setItem('savedContent', JSON.stringify(savedContent));
                toast({
                    title: "Preservation Plan Saved!",
                    description: `"${title}" has been auto-saved to your 'Preservatives' tab.`,
                });
            }
        } catch (error) {
            console.error("Could not save preservation plan:", error);
        }
    }
  }, [preservationContent, toast]);


  const formRef = useRef<HTMLFormElement>(null);

  const handleFormAction = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

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

  const handleSaveContent = () => {
    if (currentContent) {
      try {
        let savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]');
        const titleMatch = currentContent.match(/^##\s*(.*)$/m);
        const title = titleMatch ? titleMatch[1].trim() : "Untitled";

        const isDuplicate = savedContent.some(item => item.title === title && item.content === currentContent);

        if (!isDuplicate) {
          savedContent.push({ title: title, content: currentContent, savedAt: new Date().toISOString(), type: 'recipe' });
          localStorage.setItem('savedContent', JSON.stringify(savedContent));
          toast({
            title: "Content Saved!",
            description: `"${title}" has been saved successfully.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Already Saved",
            description: "This content is already in your saved list.",
          });
        }
      } catch (error) {
        console.error("Could not save content:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save content.",
        });
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
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} action={handleFormAction} className="text-center">
            <div className='max-w-xl mx-auto'>
                <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <Label htmlFor="ingredientsInput" className="block text-xl font-semibold text-foreground mb-2">
                        What ingredients do you have?
                    </Label>
                    <p className="text-muted-foreground mb-4">
                        Type your ingredients or upload a photo.
                    </p>
                    <div className="flex gap-4">
                        <Textarea
                        id="ingredientsInput"
                        name="ingredients"
                        rows={4}
                        className="flex-grow p-3 border-border rounded-lg focus:ring-2 focus:ring-primary transition-shadow bg-background/70"
                        placeholder="e.g., chicken, broccoli, garlic..."
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
              <SubmitButton pending={isPending} />
            </div>
        </form>

        <div className="mt-8">
            {isPending && <div className="mx-auto loader"></div>}

            {state.error && !isPending && (
            <Alert variant="destructive" className="animate-in fade-in">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            )}
            
            {currentContent && !isPending && (
              <div className="prose prose-lg max-w-none bg-card/80 p-6 mt-4 rounded-lg border animate-in fade-in-up duration-700">
                <div className="flex justify-center mb-6">
                  <Button
                    type="button"
                    onClick={handleSaveContent}
                    className="font-bold py-3 px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Recipe
                  </Button>
                </div>

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
                    <div className="not-prose my-8 flex justify-center">
                        <HealthAnalysisBadge />
                    </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(currentContent) }} />
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    