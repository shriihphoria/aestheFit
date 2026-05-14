"use client";

import type { FC, ChangeEvent, FormEvent } from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ClothingItem } from '@/lib/types';
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface ClothingUploadFormProps {
  onAddItem: (item: ClothingItem) => void;
  itemCount: number;
}

const MAX_ITEMS = 10;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ClothingUploadForm: FC<ClothingUploadFormProps> = ({ onAddItem, itemCount }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (!name) { // Auto-fill name from filename if empty
        setName(file.name.split('.').slice(0, -1).join('.') || file.name);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !name) {
      toast({ title: "Missing fields", description: "Please provide an image and a name.", variant: "destructive" });
      return;
    }
    if (itemCount >= MAX_ITEMS) {
      toast({ title: "Limit reached", description: `You can upload a maximum of ${MAX_ITEMS} items.`, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const imageDataUri = await fileToDataUri(imageFile);
      const newItem: ClothingItem = {
        id: crypto.randomUUID(),
        name,
        description,
        imagePreview: imagePreview!, // Already set if imageFile is present
        imageDataUri,
      };
      onAddItem(newItem);
      toast({ title: "Item added!", description: `${name} has been added to your wardrobe.` });
      // Reset form
      setName('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({ title: "Upload Error", description: "Could not process the image. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clothing-image">Clothing Image*</Label>
        <Input
          id="clothing-image"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleImageChange}
          ref={fileInputRef}
          required
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {imagePreview && (
          <div className="mt-2 w-32 h-32 relative rounded-md overflow-hidden border">
            <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="clothing preview"/>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="clothing-name">Item Name*</Label>
        <Input
          id="clothing-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Blue Denim Jacket"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clothing-description">Description (Optional)</Label>
        <Textarea
          id="clothing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Slightly faded, size M"
        />
      </div>
      <Button type="submit" disabled={isLoading || itemCount >= MAX_ITEMS} className="w-full">
        <UploadCloud className="mr-2 h-4 w-4" /> {isLoading ? 'Adding...' : 'Add Item to Wardrobe'}
      </Button>
      {itemCount >= MAX_ITEMS && (
        <p className="text-sm text-destructive text-center">Maximum of {MAX_ITEMS} items reached.</p>
      )}
    </form>
  );
};

export default ClothingUploadForm;
