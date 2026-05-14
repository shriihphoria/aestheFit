
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ClothingItem, Outfit, PersonImage } from '@/lib/types';
import ClothingUploadForm from '@/components/app/ClothingUploadForm';
import ClothingItemCard from '@/components/app/ClothingItemCard';
import OutfitCuration from '@/components/app/OutfitCuration';
import SavedOutfits from '@/components/app/SavedOutfits';
import PersonImageUploadForm from '@/components/app/PersonImageUploadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shirt, UserCircle2, MessagesSquare, PlusCircle, LogIn, Trash2, History } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast'; 

const MAX_ITEMS = 10;
const RECENT_ROOMS_KEY = 'aesthefit-recentChatRooms';

export default function HomePage() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [personImage, setPersonImage] = useState<PersonImage | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast(); 
  const router = useRouter();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [recentRoomIds, setRecentRoomIds] = useState<string[]>([]);


  useEffect(() => {
    setIsClient(true);
    const storedClothing = localStorage.getItem('clothingItems');
    if (storedClothing) {
      setClothingItems(JSON.parse(storedClothing));
    }
    const storedOutfits = localStorage.getItem('savedOutfits');
    if (storedOutfits) {
      setSavedOutfits(JSON.parse(storedOutfits));
    }
    const storedPersonImage = localStorage.getItem('personImage');
    if (storedPersonImage) {
      setPersonImage(JSON.parse(storedPersonImage));
    }
    const storedRecentRooms = localStorage.getItem(RECENT_ROOMS_KEY);
    if (storedRecentRooms) {
      setRecentRoomIds(JSON.parse(storedRecentRooms));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('clothingItems', JSON.stringify(clothingItems));
    }
  }, [clothingItems, isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        // When saving outfits, include the generatedOutfitImageUri
        localStorage.setItem('savedOutfits', JSON.stringify(savedOutfits));
      } catch (error) {
        console.error("Error saving outfits to localStorage:", error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          toast({
            title: "Storage Limit Reached",
            description: "Cannot save more outfits with images due to browser storage limits. Older outfits' images might not be persistently stored.",
            variant: "destructive",
            duration: 10000, 
          });
        } else {
          toast({
            title: "Storage Error",
            description: "Could not save outfit history.",
            variant: "destructive",
          });
        }
      }
    }
  }, [savedOutfits, isClient, toast]);

  useEffect(() => {
    if (isClient) {
      if (personImage) {
        localStorage.setItem('personImage', JSON.stringify(personImage));
      } else {
        localStorage.removeItem('personImage');
      }
    }
  }, [personImage, isClient]);

  const handleAddItem = (item: ClothingItem) => {
    if (clothingItems.length < MAX_ITEMS) {
      setClothingItems((prevItems) => [...prevItems, item]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setClothingItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleSaveOutfit = (outfit: Outfit) => {
    setSavedOutfits((prevOutfits) => [outfit, ...prevOutfits]);
  };

  const handleRemoveOutfit = (outfitId: string) => {
    setSavedOutfits((prevOutfits) => prevOutfits.filter((outfit) => outfit.id !== outfitId));
  };

  const handleSetPersonImage = (image: PersonImage | null) => {
    setPersonImage(image);
  };

  const handleCreateRoom = () => {
    const newRoomId = crypto.randomUUID();
    router.push(`/chat/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      router.push(`/chat/${joinRoomId.trim()}`);
    } else {
      toast({
        title: "Invalid Room ID",
        description: "Please enter a Room ID to join.",
        variant: "destructive",
      });
    }
  };

  const handleClearRecentRooms = () => {
    localStorage.removeItem(RECENT_ROOMS_KEY);
    setRecentRoomIds([]);
    toast({
      title: "Recent Rooms Cleared",
      description: "Your list of recently visited chat rooms has been cleared.",
    });
  };
  
  if (!isClient) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <section aria-labelledby="wardrobe-title">
            <Card className="shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle id="wardrobe-title" className="text-2xl flex items-center">
                  <Shirt className="mr-3 h-7 w-7 text-primary" />
                  Manage Your Wardrobe
                </CardTitle>
                <CardDescription>
                  Add items to your digital closet. You can upload up to {MAX_ITEMS} pieces.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 p-2 rounded-lg">
                  <ClothingUploadForm onAddItem={handleAddItem} itemCount={clothingItems.length} />
                </div>
                <div className="md:col-span-2">
                  {clothingItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-1 max-h-[600px] overflow-y-auto">
                      {clothingItems.map((item) => (
                        <ClothingItemCard key={item.id} item={item} onRemove={handleRemoveItem} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-10 border border-dashed rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive-restore text-muted-foreground opacity-50"><path d="M14 2H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12v-4M6 14H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2"></path><path d="M18 16h-4v4h4v-4Z"></path><path d="M12 12v4h4"></path><path d="M18 4v4h4"></path></svg>
                      <p className="mt-4 text-center text-muted-foreground">Your wardrobe is currently empty.</p>
                      <p className="text-sm text-center text-muted-foreground">Start by adding some clothing items using the form.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <section aria-labelledby="person-image-title">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle id="person-image-title" className="text-2xl flex items-center">
                  <UserCircle2 className="mr-3 h-7 w-7 text-primary" />
                  Your Try-On Model
                </CardTitle>
                <CardDescription>
                  Upload an image of yourself or a model for virtual try-on.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersonImageUploadForm currentPersonImage={personImage} onSetPersonImage={handleSetPersonImage} />
              </CardContent>
            </Card>
          </section>

          {clothingItems.length > 0 && (
            <section aria-labelledby="curate-title">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle id="curate-title" className="text-2xl">Curate Your Outfit</CardTitle>
                  <CardDescription>
                    Specify an occasion and let AI suggest an outfit and generate an image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OutfitCuration 
                    clothingItems={clothingItems} 
                    personImage={personImage} 
                    onSaveOutfit={handleSaveOutfit} 
                  />
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
      
      <Separator />

      {recentRoomIds.length > 0 && (
        <section aria-labelledby="recent-chat-rooms-title">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle id="recent-chat-rooms-title" className="text-2xl flex items-center">
                  <History className="mr-3 h-7 w-7 text-primary" />
                  Your Recent Chat Rooms
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleClearRecentRooms}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear History
                </Button>
              </div>
              <CardDescription>
                Quickly rejoin your recently visited chat rooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1">
                {recentRoomIds.map((id) => (
                  <li key={id}>
                    <Button variant="link" asChild className="p-0 h-auto justify-start">
                      <Link href={`/chat/${id}`} className="truncate block font-mono text-sm">
                        {id}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
      
      <Separator />

      <section aria-labelledby="chat-rooms-title">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle id="chat-rooms-title" className="text-2xl flex items-center">
              <MessagesSquare className="mr-3 h-7 w-7 text-primary" />
              Fashion Chat Rooms
            </CardTitle>
            <CardDescription>
              Join a discussion or create your own private room. (Note: Chat is local to your browser)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-room-id">Join Existing Room</Label>
              <div className="flex space-x-2">
                <Input
                  id="join-room-id"
                  placeholder="Enter Room ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <Button onClick={handleJoinRoom}><LogIn className="mr-2 h-4 w-4"/> Join</Button>
              </div>
            </div>
            <Separator />
            <div>
              <Button onClick={handleCreateRoom} className="w-full" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="lookbook-title">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle id="lookbook-title" className="text-2xl">Your Lookbook</CardTitle>
            <CardDescription>
              Browse your saved outfits for inspiration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavedOutfits savedOutfits={savedOutfits} onRemoveOutfit={handleRemoveOutfit} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
