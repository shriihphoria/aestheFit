
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger, // Added SheetTrigger here
} from "@/components/ui/sheet";
import { MessageSquare, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithBot, type ChatInput } from '@/ai/flows/chat-flow';
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const INITIAL_AI_GREETING = "Hi there! I'm AestheFit Assistant. How can I help you with your style today?";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), sender: 'ai', text: INITIAL_AI_GREETING }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const currentInput = inputValue.trim();
    if (!currentInput || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: currentInput,
    };

    let historyForAI: Array<{sender: 'user' | 'ai', text: string}> = [];
    
    // Filter out the initial AI greeting from the history sent to the LLM
    const relevantMessages = messages.filter(msg => 
      !(msg.sender === 'ai' && msg.text === INITIAL_AI_GREETING)
    );

    if (relevantMessages.length > 0) {
        historyForAI = relevantMessages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
        }));
    }
    
    // Add the user message to the UI state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await chatWithBot({
        userInput: currentInput,
        history: historyForAI.length > 0 ? historyForAI : undefined, 
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.aiResponse,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      const errorMessageText = error.message || "Sorry, I couldn't get a response. Please try again.";
      toast({
        title: "Chatbot Error",
        description: errorMessageText,
        variant: "destructive",
      });
      const aiErrorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "I'm having a little trouble responding right now. Please try again in a moment.",
      };
      setMessages((prevMessages) => [...prevMessages, aiErrorMessage]);
    } finally {
      setIsLoading(false);
       setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="primary"
          size="icon"
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 rounded-full w-14 h-14 shadow-xl z-50 bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Open Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-2 border-b">
          <SheetTitle className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            AestheFit Assistant
          </SheetTitle>
          <SheetDescription>
            Your personal AI fashion advisor.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2 max-w-[85%]",
                  message.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                )}
              >
                 {message.sender === 'ai' && <Bot className="h-6 w-6 text-muted-foreground self-start shrink-0" />}
                 {message.sender === 'user' && <User className="h-6 w-6 text-muted-foreground self-start shrink-0" />}
                <div
                  className={cn(
                    "p-3 rounded-xl shadow-md",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about fashion..."
              className="flex-1"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
