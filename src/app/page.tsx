import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { RecipeGenerator } from '@/components/recipe-generator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const bgImage = PlaceHolderImages.find(img => img.id === 'background-food');

  return (
    <main className="relative">
      <div 
        className="absolute inset-0 w-full min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgImage?.imageUrl})` }}
        data-ai-hint={bgImage?.imageHint}
      ></div>
      <div className="absolute inset-0 w-full min-h-screen bg-background/80"></div>

      <div className="relative container mx-auto max-w-4xl min-h-screen p-4 md:p-8 flex flex-col justify-center">
        <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center container mx-auto max-w-4xl">
            <div className="text-center flex-grow">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Leftover Chef</h1>
              <p className="text-lg text-muted-foreground mt-2">Transform leftovers into culinary delights.</p>
            </div>
            <Link href="/saved-recipes" passHref>
                <Button variant="outline" className="shrink-0">My Saved Recipes</Button>
            </Link>
        </header>

        <section className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8">
          <RecipeGenerator />
        </section>
      </div>
    </main>
  );
}
