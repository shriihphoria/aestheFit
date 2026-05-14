"use client";

import type { FC } from 'react';
import type { Outfit } from '@/lib/types';
import OutfitCard from './OutfitCard';

interface SavedOutfitsProps {
  savedOutfits: Outfit[];
  onRemoveOutfit: (outfitId: string) => void;
}

const SavedOutfits: FC<SavedOutfitsProps> = ({ savedOutfits, onRemoveOutfit }) => {
  if (savedOutfits.length === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text mx-auto text-muted-foreground opacity-50">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            <path d="M6 8h2"/>
            <path d="M6 12h2"/>
            <path d="M16 8h2"/>
            <path d="M16 12h2"/>
        </svg>
        <p className="mt-4 text-muted-foreground">Your lookbook is empty.</p>
        <p className="text-sm text-muted-foreground">Curate and save outfits to see them here.</p>
      </div>
    );
  }

  // Sort outfits by savedAt date, newest first
  const sortedOutfits = [...savedOutfits].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedOutfits.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} onRemove={onRemoveOutfit} />
      ))}
    </div>
  );
};

export default SavedOutfits;
