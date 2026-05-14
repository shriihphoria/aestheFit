
"use client";

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatMessageReaction, PollOption } from '@/lib/types';
import { ArrowLeft, Send, User, ImagePlus, XCircle, Heart, ListPlus, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';

const MAX_IMAGE_SIZE_MB = 2;
const MAX_RECENT_ROOMS = 5;
const RECENT_ROOMS_KEY = 'aesthefit-recentChatRooms';

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const roomId = typeof params.roomId === 'string' ? params.roomId : '';

  const [isClient, setIsClient] = useState(false);
  const [nickname, setNickname] = useState('');
  const [tempNickname, setTempNickname] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoadingNickname, setIsLoadingNickname] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestionInput, setPollQuestionInput] = useState('');
  const [pollOptionFiles, setPollOptionFiles] = useState<[File | null, File | null]>([null, null]);
  const [pollOptionPreviews, setPollOptionPreviews] = useState<[string | null, string | null]>([null, null]);
  const pollOption1FileInputRef = useRef<HTMLInputElement>(null);
  const pollOption2FileInputRef = useRef<HTMLInputElement>(null);

  const [isTypingBotMessage, setIsTypingBotMessage] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (roomId) {
      const storedNickname = localStorage.getItem(`chatRoom-${roomId}-nickname`);
      if (storedNickname) {
        setNickname(storedNickname);
      }
      setIsLoadingNickname(false);

      try {
        const recentRoomsRaw = localStorage.getItem(RECENT_ROOMS_KEY);
        let recentRooms: string[] = recentRoomsRaw ? JSON.parse(recentRoomsRaw) : [];
        recentRooms = recentRooms.filter(id => id !== roomId);
        recentRooms.unshift(roomId);
        recentRooms = recentRooms.slice(0, MAX_RECENT_ROOMS);
        localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(recentRooms));
      } catch (error) {
        console.error("Error saving recent room ID:", error);
      }
    }
  }, [roomId]);

 useEffect(() => {
    if (!roomId || !isClient) return;

    setIsLoadingMessages(true);
    const messagesColRef = collection(db, 'chatRooms', roomId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const firestoreMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp, // Firestore Timestamp
        } as ChatMessage);
      });
      setMessages(firestoreMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages from Firestore:", error);
      toast({ title: "Error loading chat", description: "Could not connect to fetch messages.", variant: "destructive"});
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [roomId, isClient, toast]);


  useEffect(() => {
    if (isClient && roomId && nickname) {
      localStorage.setItem(`chatRoom-${roomId}-nickname`, nickname);
    }
  }, [nickname, roomId, isClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTypingBotMessage]);

  useEffect(() => {
    if (!isLoadingNickname && nickname && inputRef.current && !isCreatingPoll) {
      inputRef.current.focus();
    }
  }, [isLoadingNickname, nickname, isCreatingPoll]);

  const handleSetNickname = (e: FormEvent) => {
    e.preventDefault();
    if (tempNickname.trim()) {
      setNickname(tempNickname.trim());
    } else {
      toast({
        title: 'Nickname required',
        description: 'Please enter a nickname to join the chat.',
        variant: 'destructive',
      });
    }
  };

  const handleSingleImageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ title: "Image too large", description: `Max ${MAX_IMAGE_SIZE_MB}MB.`, variant: "destructive" });
        return;
      }
      setSelectedImageFile(file);
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!currentMessage.trim() && !selectedImageFile) || !nickname || !roomId) return;

    const messagesColRef = collection(db, 'chatRooms', roomId, 'messages');

    if (selectedImageFile) {
      toast({
        title: "Image Sent (Locally)",
        description: "Image sharing is local to your browser. Text messages are real-time.",
        variant: "default",
        duration: 8000,
      });
      try {
        const imageDataUri = await fileToDataUri(selectedImageFile);
        const localImageMessage: ChatMessage = {
          id: crypto.randomUUID(), roomId, nickname,
          text: currentMessage.trim() || undefined,
          timestamp: new Date().toISOString(), type: 'image', imageDataUri, reactions: [],
        };
        setMessages(prev => [...prev, localImageMessage]);
        // FashionPal reacts to local image
        handleReaction(localImageMessage.id, '❤️', 'FashionPal');
        setCurrentMessage('');
        clearSelectedImage();
      } catch (error) {
        console.error("Error converting image to data URI:", error);
        toast({ title: "Image Error", description: "Could not process the image.", variant: "destructive" });
      }
      return;
    }

    if (currentMessage.trim()) {
      const userMessageContent = currentMessage.trim();
      try {
        await addDoc(messagesColRef, {
          roomId, nickname, text: userMessageContent,
          timestamp: serverTimestamp(), type: 'message',
        });
        setCurrentMessage(''); // Clear input after successful send

        // Automated bot responses
        const lowerCaseMessage = userMessageContent.toLowerCase();
        if (lowerCaseMessage === 'hi') {
          await addDoc(messagesColRef, {
            roomId, nickname: 'FashionPal', text: 'hi',
            timestamp: serverTimestamp(), type: 'message',
          });
        } else if (lowerCaseMessage === 'help me choose my outfit for today') {
          setIsTypingBotMessage(true);
          setTimeout(async () => {
            await addDoc(messagesColRef, {
              roomId, nickname: 'FashionPal', text: 'sure let\'s see the options',
              timestamp: serverTimestamp(), type: 'message',
            });
            setIsTypingBotMessage(false);
          }, 5000);
        }

      } catch (error) {
        console.error("Error sending message to Firestore:", error);
        toast({ title: "Send Error", description: "Could not send message. Check Firebase setup.", variant: "destructive" });
      }
    }
  };

   const handleReaction = (messageId: string, emoji: string, reactorNickname: string = nickname) => {
    if (!reactorNickname) return;
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const userReactionIndex = existingReactions.findIndex(
            r => r.nickname === reactorNickname && r.emoji === emoji
          );
          if (userReactionIndex > -1) { // User is un-reacting
            return { ...msg, reactions: existingReactions.filter((_, index) => index !== userReactionIndex) };
          } else { // User is adding a new reaction
            const withoutOldReaction = existingReactions.filter(r => !(r.nickname === reactorNickname));
            return { ...msg, reactions: [...withoutOldReaction, { nickname: reactorNickname, emoji }] };
          }
        }
        return msg;
      })
    );
    if(reactorNickname === nickname){ // Only toast for user's own reactions
        toast({ title: "Reaction (Local)", description: "Reactions are local for now."});
    }
  };

  const handlePollImageChange = (index: 0 | 1, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ title: "Image too large", description: `Max ${MAX_IMAGE_SIZE_MB}MB per option.`, variant: "destructive" });
        return;
      }
      const newFiles = [...pollOptionFiles] as [File | null, File | null];
      newFiles[index] = file;
      setPollOptionFiles(newFiles);
      const newPreviews = [...pollOptionPreviews] as [string | null, string | null];
      newPreviews[index] = URL.createObjectURL(file);
      setPollOptionPreviews(newPreviews);
    }
  };

  const handleSendPoll = async (e: FormEvent) => {
    e.preventDefault();
    toast({ title: "Poll Created (Locally)", description: "Polls are local to your browser for now.", variant: "default", duration: 9000 });
    if (!pollQuestionInput.trim() || !pollOptionFiles[0] || !pollOptionFiles[1] || !nickname) return;
    try {
      const option1DataUri = await fileToDataUri(pollOptionFiles[0]!);
      const option2DataUri = await fileToDataUri(pollOptionFiles[1]!);
      const pollOptions: PollOption[] = [
        { id: 'option1', imageDataUri: option1DataUri, voteCount: 0 },
        { id: 'option2', imageDataUri: option2DataUri, voteCount: 0 },
      ];
      const newPollMessage: ChatMessage = {
        id: crypto.randomUUID(), roomId, nickname, timestamp: new Date().toISOString(),
        type: 'poll', pollQuestion: pollQuestionInput.trim(), pollOptions, pollVoters: {}, reactions: [],
      };
      setMessages(prev => [...prev, newPollMessage]);
      setIsCreatingPoll(false); setPollQuestionInput(''); setPollOptionFiles([null, null]); setPollOptionPreviews([null, null]);
      if (pollOption1FileInputRef.current) pollOption1FileInputRef.current.value = '';
      if (pollOption2FileInputRef.current) pollOption2FileInputRef.current.value = '';
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({ title: "Poll Error", description: "Could not process poll images.", variant: "destructive" });
    }
  };

  const handleVote = (messageId: string, optionIdToVoteFor: string) => {
    if (!nickname) return;
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.type === 'poll' && msg.pollOptions && msg.pollVoters) {
           if (msg.pollVoters[nickname]) {
                toast({ title: "Already Voted", description: "You can only vote once per poll.", variant: "default" });
                return msg;
          }
          const updatedOptions = msg.pollOptions.map(opt => opt.id === optionIdToVoteFor ? { ...opt, voteCount: opt.voteCount + 1 } : opt);
          const updatedVoters = { ...msg.pollVoters, [nickname]: optionIdToVoteFor };
          return { ...msg, pollOptions: updatedOptions, pollVoters: updatedVoters };
        }
        return msg;
      })
    );
     toast({ title: "Vote (Local)", description: "Votes on polls are local for now."});
  };

  if (!isClient || isLoadingNickname) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!nickname) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Enter Nickname</CardTitle>
            <CardDescription className="text-center">
              Choose a nickname to join room: <span className="font-semibold truncate block max-w-xs mx-auto">{roomId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetNickname} className="space-y-4">
              <div>
                <Label htmlFor="nickname">Nickname</Label>
                <Input id="nickname" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} placeholder="Your cool nickname" required autoFocus />
              </div>
              <Button type="submit" className="w-full">Join Chat</Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col space-y-2 pt-4">
            <Button variant="outline" asChild className="w-full"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const formatTimestamp = (timestamp: Timestamp | string | undefined | null): string => {
    if (!timestamp) return '...';
    if (typeof timestamp === 'string') { // Local message (ISO string)
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Firestore Timestamp or potentially unresolved serverTimestamp
    if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      try {
        return (timestamp as Timestamp).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'invalid date';
      }
    }
    return 'sending...';
  };


  return (
    <div className="container mx-auto p-4 md:p-8 h-[calc(100vh-8rem)] flex flex-col">
      <Card className="shadow-xl flex-grow flex flex-col">
        <CardHeader className="border-b">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
            <div className="flex-grow">
              <CardTitle className="text-xl sm:text-2xl">
                Chat Room: <span className="font-mono text-xs sm:text-sm ml-1 sm:ml-2 bg-muted px-2 py-1 rounded truncate max-w-[150px] xs:max-w-[180px] sm:max-w-[200px] md:max-w-xs inline-block align-bottom">{roomId}</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Chatting as: <span className="font-semibold text-primary">{nickname}</span>
                <span className="text-xs text-muted-foreground/80 block sm:inline sm:ml-1">
                   (Text messages are real-time. Images/polls are local to this browser)
                </span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/"><ArrowLeft className="mr-0 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Exit Room</span></Link>
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-grow p-4 bg-muted/20">
          <div className="space-y-6">
            {isLoadingMessages && messages.length === 0 && (
                 <div className="text-center text-muted-foreground py-10">Loading messages...</div>
            )}
            {!isLoadingMessages && messages.length === 0 && !isTypingBotMessage && (
                <div className="text-center text-muted-foreground py-10">
                    No messages yet. Start the conversation!
                </div>
            )}
            {messages.map((msg) => {
              const isMyMessage = msg.nickname === nickname;
              const isFashionPalMessage = msg.nickname === 'FashionPal';
              const userHasHeartedImage = msg.type === 'image' && msg.reactions?.some(r => r.nickname === nickname && r.emoji === '❤️');
              
              if (msg.type === 'poll') {
                const userVotedOptionId = msg.pollVoters?.[nickname];
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2 max-w-[95%] sm:max-w-[85%]", isMyMessage ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}>
                    <User className="h-8 w-8 text-muted-foreground self-start shrink-0 rounded-full bg-background p-1 border" title={msg.nickname}/>
                    <div className={cn("p-4 rounded-xl shadow-md w-full", isMyMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none border")}>
                      <p className="text-xs text-muted-foreground/80 mb-1">
                        {isMyMessage ? "You" : msg.nickname} (Poll - Local)
                        <span className="ml-2 text-xs text-muted-foreground/60">{formatTimestamp(msg.timestamp)}</span>
                      </p>
                      <p className="font-semibold mb-3 text-base">{msg.pollQuestion}</p>
                      <div className="space-y-3">
                        {msg.pollOptions?.map(option => {
                          const hasVotedForThisOption = userVotedOptionId === option.id;
                          return (
                            <Card key={option.id} className={cn("overflow-hidden cursor-pointer hover:shadow-lg transition-shadow", hasVotedForThisOption && "ring-2 ring-offset-1 ring-accent", userVotedOptionId && !hasVotedForThisOption && "opacity-70 cursor-not-allowed")}
                              onClick={() => !userVotedOptionId && handleVote(msg.id, option.id)} role="button" aria-pressed={hasVotedForThisOption}>
                              <CardContent className="p-2">
                                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-2 bg-muted"><NextImage src={option.imageDataUri} alt={`Poll option ${option.id}`} layout="fill" objectFit="contain" data-ai-hint="poll option"/></div>
                                <div className="flex justify-between items-center text-sm"><span>Votes: {option.voteCount}</span>{hasVotedForThisOption && <CheckCircle className="h-5 w-5 text-accent"/>}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const heartReactions = msg.reactions?.filter(r => r.emoji === '❤️').length || 0;
              return (
                <div key={msg.id} className={cn("flex items-end gap-2 max-w-[85%]", isMyMessage ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}>
                  <User className="h-8 w-8 text-muted-foreground self-start shrink-0 rounded-full bg-background p-1 border" title={msg.nickname}/>
                  <div className={cn("p-3 rounded-xl shadow-md", 
                    isMyMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none border")}>
                    <p className="text-xs text-muted-foreground/80 mb-0.5">
                      {isMyMessage ? "You" : msg.nickname} {msg.type === 'image' ? '(Image - Local)' : ''}
                      <span className="ml-2 text-xs text-muted-foreground/60">{formatTimestamp(msg.timestamp)}</span>
                    </p>
                    {msg.type === 'image' && msg.imageDataUri && (
                      <div className="my-2">
                        <NextImage src={msg.imageDataUri} alt={msg.text || `Image from ${msg.nickname}`} width={280} height={280} className="rounded-md object-contain max-w-full h-auto" data-ai-hint="chat image"/>
                      </div>
                    )}
                    {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                    {msg.type === 'image' && (
                      <div className="mt-2 flex items-center">
                        <Button variant="ghost" size="sm" className={cn("p-1 h-auto", userHasHeartedImage ? "text-red-500" : "text-muted-foreground hover:text-red-500")} onClick={() => handleReaction(msg.id, '❤️')}>
                          <Heart className={cn("h-4 w-4", userHasHeartedImage ? "fill-red-500" : "")} />
                          <span className="ml-1 text-xs">{heartReactions > 0 ? heartReactions : ''}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isTypingBotMessage && (
              <div className="flex items-end gap-2 max-w-[85%] mr-auto flex-row">
                <User className="h-8 w-8 text-muted-foreground self-start shrink-0 rounded-full bg-background p-1 border" title="FashionPal"/>
                <div className="p-3 rounded-xl shadow-md bg-muted text-foreground rounded-bl-none border">
                  <p className="text-xs text-muted-foreground/80 mb-0.5">FashionPal</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">typing</span>
                    <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <CardFooter className="p-4 border-t bg-background flex flex-col items-start">
          {isCreatingPoll && (
            <form onSubmit={handleSendPoll} className="w-full mb-4 p-4 border rounded-lg shadow-sm bg-muted/50 space-y-4">
              <h3 className="text-lg font-semibold text-center">Create New Poll (Local)</h3>
              <div><Label htmlFor="poll-question">Poll Question</Label><Textarea id="poll-question" value={pollQuestionInput} onChange={(e) => setPollQuestionInput(e.target.value)} placeholder="What's your fashion question?" required className="mt-1 bg-background"/></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map(index => (<div key={index} className="space-y-1">
                    <Label htmlFor={`poll-option-${index + 1}`}>Image Option ${index + 1}</Label>
                    <Input id={`poll-option-${index + 1}`} type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => handlePollImageChange(index as 0 | 1, e)} ref={index === 0 ? pollOption1FileInputRef : pollOption2FileInputRef} required className="file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 bg-background"/>
                    {pollOptionPreviews[index] && (<div className="mt-2 w-full aspect-video relative rounded-md overflow-hidden border bg-background"><NextImage src={pollOptionPreviews[index]!} alt={`Preview Option ${index + 1}`} layout="fill" objectFit="contain" data-ai-hint="poll preview"/></div>)}
                  </div>))}
              </div>
              <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsCreatingPoll(false)}>Cancel</Button><Button type="submit">Submit Poll (Local)</Button></div>
            </form>
          )}

          {!isCreatingPoll && (
            <>
            {selectedImagePreview && (
                <div className="mb-2 p-2 border rounded-md relative w-20 h-20 sm:w-24 sm:h-24">
                <NextImage src={selectedImagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="image preview"/>
                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={clearSelectedImage}><XCircle className="h-4 w-4" /></Button>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleSingleImageInputChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
                <Button variant="outline" size="icon" type="button" onClick={() => fileInputRef.current?.click()} title="Add Image (Local)">
                <ImagePlus className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" type="button" onClick={() => setIsCreatingPoll(true)} title="Create Poll (Local)">
                <ListPlus className="h-5 w-5" />
                </Button>
                <Input ref={inputRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Type your message..." className="flex-1" autoComplete="off"/>
                <Button type="submit" size="icon" disabled={(!currentMessage.trim() && !selectedImageFile) || !nickname} aria-label="Send message"><Send className="h-5 w-5" /></Button>
            </form>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
