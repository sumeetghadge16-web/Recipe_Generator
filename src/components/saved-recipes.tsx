
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SavedContent {
  title: string;
  content: string;
  savedAt: string;
  type: 'recipe' | 'preservation';
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


export function SavedRecipes() {
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const content = JSON.parse(localStorage.getItem('savedContent') || '[]');
      setSavedContent(content.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    } catch (error) {
      console.error("Could not load content:", error);
      setSavedContent([]);
    }
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!isMounted) return [];
    return savedContent.filter(item => 
      item.type === 'recipe' &&
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [savedContent, searchTerm, isMounted]);
  
  const handleDeleteRecipe = (recipeTitle: string) => {
    const updatedContent = savedContent.filter(r => r.title !== recipeTitle);
    localStorage.setItem('savedContent', JSON.stringify(updatedContent));
    setSavedContent(updatedContent);
  };

  if (!isMounted) {
    return <div className="text-center p-8">Loading...</div>;
  }


  return (
    <Card>
        <CardHeader>
            <CardTitle>My Saved Recipes</CardTitle>
            <CardDescription>Your personal collection of culinary creations.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-6">
                <Input 
                    type="text"
                    placeholder="Search saved recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md mx-auto"
                />
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="text-center border-2 border-dashed border-border rounded-lg p-8">
                <p className="text-xl text-muted-foreground">You haven't saved any recipes yet.</p>
                <p className="text-muted-foreground mt-2">Generated recipes can be saved here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="truncate">{recipe.title}</CardTitle>
                      <CardDescription>Saved on: {new Date(recipe.savedAt).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto p-4 bg-muted/50 flex justify-between items-center">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost">View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>{recipe.title}</DialogTitle>
                          </DialogHeader>
                          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(recipe.content) }} />
                          </div>
                        </DialogContent>
                      </Dialog>
                      
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
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
        </CardContent>
    </Card>
  );
}
