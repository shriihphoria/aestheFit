
"use client";

import type { FC, ChangeEvent, FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PersonImage } from '@/lib/types';
import { UploadCloud, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonImageUploadFormProps {
  currentPersonImage: PersonImage | null;
  onSetPersonImage: (image: PersonImage | null) => void;
}

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PersonImageUploadForm: FC<PersonImageUploadFormProps> = ({ currentPersonImage, onSetPersonImage }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(currentPersonImage?.imagePreview || null);
  }, [currentPersonImage]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      // If no file is selected (e.g., user cancels file dialog), revert to current or null.
      setImageFile(null);
      setPreview(currentPersonImage?.imagePreview || null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast({ title: "No image selected", description: "Please select an image file to upload.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const imageDataUri = await fileToDataUri(imageFile);
      const newPersonImage: PersonImage = {
        id: currentPersonImage?.id || crypto.randomUUID(),
        imagePreview: preview!, // Preview is set if imageFile is present
        imageDataUri,
      };
      onSetPersonImage(newPersonImage);
      toast({ title: "Model Image Updated!", description: "Your try-on model image has been set." });
      setImageFile(null); // Clear the file input after successful upload
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

  const handleRemoveImage = () => {
    onSetPersonImage(null);
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({ title: "Model Image Removed", description: "Your try-on model image has been cleared." });
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="person-image" className="text-base font-medium">
              {preview ? 'Change Model Image' : 'Upload Model Image'}
            </Label>
            <Input
              id="person-image"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          {preview && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Current Model Preview:</p>
              <div className="w-full aspect-[3/4] relative rounded-md overflow-hidden border">
                <Image src={preview} alt="Person preview" layout="fill" objectFit="contain" data-ai-hint="person model" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isLoading || !imageFile} className="w-full sm:flex-1">
              <UploadCloud className="mr-2 h-4 w-4" />
              {isLoading ? 'Uploading...' : (currentPersonImage ? 'Update Image' : 'Upload Image')}
            </Button>
            {currentPersonImage && (
              <Button variant="outline" onClick={handleRemoveImage} type="button" className="w-full sm:flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive">
                <XCircle className="mr-2 h-4 w-4" /> Remove Image
              </Button>
            )}
          </div>
           {!preview && !imageFile && (
             <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg min-h-[150px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-up text-muted-foreground opacity-50"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L13 16"></path><path d="m14 19.5 3-3 3 3"></path><path d="M17 22v-5.5"></path><path d="M21 7v6h-6"></path><path d="M5 16l2.2-2.2a2 2 0 0 1 2.8 0L13 17"></path></svg>
                <p className="mt-2 text-sm text-muted-foreground">Upload an image of a person to use as your try-on model.</p>
              </div>
           )}
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonImageUploadForm;
