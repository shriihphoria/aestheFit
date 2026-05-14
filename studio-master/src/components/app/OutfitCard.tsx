
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import type { Outfit } from '@/lib/types';

interface OutfitCardProps {
  outfit: Outfit;
  onRemove: (outfitId: string) => void;
}

const OutfitCard: FC<OutfitCardProps> = ({ outfit, onRemove }) => {
  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl">Outfit for: {outfit.occasion}</CardTitle>
            <CardDescription>Saved on: {new Date(outfit.savedAt).toLocaleDateString()}</CardDescription>
          </div>
          <div className="w-24 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs overflow-hidden relative">
             {outfit.generatedOutfitImageUri ? (
                <Image 
                  src={outfit.generatedOutfitImageUri} 
                  alt={`AI generated outfit for ${outfit.occasion} on a figure`} 
                  layout="fill" 
                  objectFit="contain" 
                  data-ai-hint="outfit mannequin"
                />
             ) : (
                <Image 
                  src="https://placehold.co/96x128.png" 
                  alt="Outfit placeholder" 
                  width={96} 
                  height={128} 
                  data-ai-hint="outfit display"
                />
             )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="font-semibold mb-1">AI Suggestion:</h4>
          <ScrollArea className="h-24 pr-2">
            <p className="text-sm text-foreground">{outfit.suggestion}</p>
          </ScrollArea>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Items Used:</h4>
          {outfit.itemNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {outfit.itemNames.map((name, index) => (
                <Badge key={index} variant="secondary">{name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific items listed.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t p-2">
        <Button variant="ghost" size="sm" onClick={() => onRemove(outfit.id)} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-2 h-4 w-4" /> Remove from Lookbook
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OutfitCard;

