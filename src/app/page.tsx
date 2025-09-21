import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { RecipeGenerator } from '@/components/recipe-generator';

export default function Home() {
  const bgImage = PlaceHolderImages.find(img => img.id === 'chef-mascot');

  return (
    <main className="relative overflow-hidden">
      {bgImage && (
        <div className="absolute inset-0 w-full min-h-screen">
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            fill
            className="object-cover"
            data-ai-hint={bgImage.imageHint}
            priority
          />
        </div>
      )}
      <div className="absolute inset-0 w-full min-h-screen bg-background/80 backdrop-blur-sm"></div>

      <div className="relative container mx-auto max-w-4xl min-h-screen p-4 md:p-8 flex flex-col justify-center">
        <header className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-center items-center container mx-auto max-w-4xl">
            <div className="text-center fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Leftover Chef</h1>
              <p className="text-lg text-muted-foreground mt-2">Transform leftovers into culinary delights.</p>
            </div>
        </header>

        <section className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border animate-in fade-in zoom-in-95 duration-500">
          <RecipeGenerator />
        </section>
      </div>
    </main>
  );
}
