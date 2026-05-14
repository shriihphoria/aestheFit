"use client";

import Image from 'next/image';
import type { FC } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ClothingItem } from '@/lib/types';

interface ClothingItemCardProps {
  item: ClothingItem;
  onRemove: (itemId: string) => void;
}

const ClothingItemCard: FC<ClothingItemCardProps> = ({ item, onRemove }) => {
  return (
    <Card className="overflow-hidden shadow-lg flex flex-col">
      <CardHeader className="p-0 relative aspect-[3/4]">
        <Image
          src={item.imagePreview}
          alt={item.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint="clothing fashion"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="font-semibold text-lg truncate" title={item.name}>{item.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden text-ellipsis">
          {item.description || "No description."}
        </p>
      </CardContent>
      <CardFooter className="p-2 border-t">
        <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remove
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClothingItemCard;
