'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface SavedRecipe {
  title: string;
  content: string;
  savedAt: string;
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
        html += `<h2 class="text-2xl font-bold mt-4 mb-2">${line.substring(3)}</h2>`;
        continue;
      }
      if (line.startsWith('### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        html += `<h3 class="text-xl font-semibold mt-3 mb-1">${line.substring(4)}</h3>`;
        continue;
      }
      if (line.startsWith('* ')) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul class="list-disc pl-5">'; inUl = true; }
        html += `<li class="mb-1">${line.substring(2)}</li>`;
        continue;
      }
      if (line.match(/^\d+\. /)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol class="list-decimal pl-5">'; inOl = true; }
        html += `<li class="mb-1">${line.replace(/^\d+\. /, '')}</li>`;
        continue;
      }
  
      if (inUl && !line.startsWith('* ')) { html += '</ul>'; inUl = false; }
      if (inOl && !line.match(/^\d+\. /)) { html += '</ol>'; inOl = false; }
      
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
      if (processedLine.trim()) {
        html += `<p class="mb-2">${processedLine}</p>`;
      }
    }
  
    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';
  
    return html;
}


export default function SavedRecipesPage() {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const recipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
      setSavedRecipes(recipes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    } catch (error) {
      console.error("Could not load recipes:", error);
      setSavedRecipes([]);
    }
  }, []);

  const heroImage = PlaceHolderImages.find(img => img.id === 'saved-recipes-hero');

  const filteredRecipes = useMemo(() => {
    return savedRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      recipe.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [savedRecipes, searchTerm]);

  if (!isMounted) {
    return null;
  }

  const handleDeleteRecipe = (recipeTitle: string) => {
    const updatedRecipes = savedRecipes.filter(r => r.title !== recipeTitle);
    localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
    setSavedRecipes(updatedRecipes);
    if (selectedRecipe?.title === recipeTitle) {
      setSelectedRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
            <div className="text-center flex-grow">
                <h1 className="text-4xl md:text-5xl font-bold">My Saved Recipes</h1>
                <p className="text-lg text-muted-foreground mt-2">Your personal collection of culinary creations.</p>
            </div>
          <Link href="/" passHref>
            <Button variant="outline" className="shrink-0">Home</Button>
          </Link>
        </header>

        {heroImage && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg border">
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={1080}
                    height={256}
                    className="w-full h-64 object-cover"
                    data-ai-hint={heroImage.imageHint}
                    priority
                />
            </div>
        )}

        <div className="mb-6">
            <Input 
                type="text"
                placeholder="Search saved recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md mx-auto"
            />
        </div>

        {savedRecipes.length === 0 ? (
          <div className="text-center bg-card p-8 rounded-lg shadow-md">
            <p className="text-xl text-muted-foreground">You haven't saved any recipes yet.</p>
            <Link href="/" passHref>
              <Button className="mt-4">Generate a Recipe</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe, index) => (
              <div key={index} className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-xl mb-2 truncate">{recipe.title}</h3>
                  <p className="text-muted-foreground text-sm">Saved on: {new Date(recipe.savedAt).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-muted/50 flex justify-between items-center">
                  <Button variant="ghost" onClick={() => setSelectedRecipe(recipe)}>View</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your recipe for "{recipe.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRecipe(recipe.title)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="p-6 flex justify-between items-center border-b">
                <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecipe(null)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </Button>
             </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedRecipe.content) }} />
            </div>
             <div className="p-4 bg-muted/50 flex justify-end">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Recipe</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your recipe for "{selectedRecipe.title}".
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            handleDeleteRecipe(selectedRecipe.title);
                            setSelectedRecipe(null);
                        }}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
