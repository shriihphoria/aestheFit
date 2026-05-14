
import type { Timestamp } from 'firebase/firestore';

export type ClothingItem = {
  id: string;
  name: string;
  description: string;
  imagePreview: string; // For client-side preview
  imageDataUri: string; // For AI processing (data:image/jpeg;base64,...)
};

export type Outfit = {
  id: string;
  occasion: string;
  itemsUsedDataUris: string[]; // Store which specific items (by data URI) were used by AI
  itemNames: string[]; // Store names of items used for display
  suggestion: string;
  generatedOutfitImageUri?: string; // AI-generated image of the outfit
  savedAt: string; // ISO string date
};

export type PersonImage = {
  id: string;
  imagePreview: string; // For client-side preview
  imageDataUri: string; // For AI processing (data:image/jpeg;base64,...)
};

export interface ChatMessageReaction {
  nickname: string;
  emoji: string;
}

export interface PollOption {
  id: string; // e.g., 'option1', 'option2'
  imageDataUri: string;
  voteCount: number;
}

export interface ChatMessage {
  id: string; // Firestore document ID
  roomId: string;
  nickname: string;
  text?: string;
  timestamp: Timestamp | string; // Firestore Timestamp or ISO string for local messages
  type: 'message' | 'image' | 'poll';
  imageDataUri?: string; // For image messages (stored as data URI, local for now)
  reactions?: ChatMessageReaction[]; // Local for now
  // For polls (local for now)
  pollQuestion?: string;
  pollOptions?: PollOption[];
  pollVoters?: { [nickname: string]: string };
}
