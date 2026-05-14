
"use client";

import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ClothingItem, Outfit, PersonImage } from '@/lib/types';
import { curateOutfit } from '@/ai/flows/curate-outfit';
import { Sparkles, Heart, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutfitCurationProps {
  clothingItems: ClothingItem[];
  personImage: PersonImage | null;
  onSaveOutfit: (outfit: Outfit) => void;
}

interface CuratedOutfitDetails {
  suggestion: string;
  imageUri: string;
}

const OutfitCuration: FC<OutfitCurationProps> = ({ clothingItems, personImage, onSaveOutfit }) => {
  const [occasion, setOccasion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [curatedOutfitDetails, setCuratedOutfitDetails] = useState<CuratedOutfitDetails | null>(null);
  const { toast } = useToast();

  const handleCuration = async (e: FormEvent) => {
    e.preventDefault();
    if (!occasion) {
      toast({ title: "Missing occasion", description: "Please specify an occasion for the outfit.", variant: "destructive" });
      return;
    }
    if (clothingItems.length === 0) {
      toast({ title: "No clothing items", description: "Please upload some clothing items first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setCuratedOutfitDetails(null);
    toast({ title: "Curating Outfit...", description: "AI is generating your outfit suggestion and image. This may take a moment." });

    try {
      const itemDataUris = clothingItems.map(item => item.imageDataUri);
      const result = await curateOutfit({
        clothingItems: itemDataUris,
        occasion,
        personImageDataUri: personImage?.imageDataUri,
      });
      setCuratedOutfitDetails({ suggestion: result.outfitSuggestion, imageUri: result.generatedOutfitImageUri });
      toast({ title: "Outfit Curated!", description: "AI has suggested an outfit and generated an image for you." });
    } catch (error: any) {
      console.error("Error curating outfit:", error);
      toast({ title: "Curation Error", description: error.message || "Could not generate an outfit. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrentOutfit = () => {
    if (!curatedOutfitDetails || !occasion) return;

    const newOutfit: Outfit = {
      id: crypto.randomUUID(),
      occasion,
      itemsUsedDataUris: clothingItems.map(item => item.imageDataUri),
      itemNames: clothingItems.map(item => item.name),
      suggestion: curatedOutfitDetails.suggestion,
      generatedOutfitImageUri: curatedOutfitDetails.imageUri,
      savedAt: new Date().toISOString(),
    };
    onSaveOutfit(newOutfit);
    toast({ title: "Outfit Saved!", description: "The outfit has been added to your lookbook." });
    setCuratedOutfitDetails(null);
    // setOccasion(''); // Optionally clear occasion
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCuration} className="space-y-4">
        <div>
          <Label htmlFor="occasion" className="text-base">Occasion*</Label>
          <Input
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="e.g., Casual Brunch, Formal Dinner"
            className="mt-1"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading || clothingItems.length === 0} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Curating...' : 'Curate Outfit with AI Image'}
        </Button>
      </form>

      {curatedOutfitDetails && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>AI Outfit Suggestion</CardTitle>
            <CardDescription>For: {occasion}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {curatedOutfitDetails.imageUri && (
              <div className="w-full aspect-[3/4] relative rounded-md overflow-hidden border mx-auto max-w-xs bg-muted">
                <Image 
                  src={curatedOutfitDetails.imageUri} 
                  alt="AI Generated Outfit on a figure" 
                  layout="fill" 
                  objectFit="contain"
                  data-ai-hint="outfit mannequin"
                />
              </div>
            )}
            <ScrollArea className="h-24 pr-2">
              <p className="text-foreground">{curatedOutfitDetails.suggestion}</p>
            </ScrollArea>
          </CardContent>
          <CardContent>
             <Button onClick={handleSaveCurrentOutfit} className="w-full">
              <Heart className="mr-2 h-4 w-4" /> Save to Lookbook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OutfitCuration;

