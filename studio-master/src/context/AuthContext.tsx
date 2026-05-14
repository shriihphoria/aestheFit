
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  password?: string; 
}

interface AuthContextType {
  currentUser: User | null;
  users: User[]; 
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const StoredUsersKey = 'demoAppUsers'; // Temporarily disabled

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Simplified: Start as false
  const router = useRouter();
  const { toast } = useToast();

  // useEffect(() => { // Temporarily disable localStorage loading
  //   setIsLoading(true); 
  //   try {
  //     const storedUsers = localStorage.getItem(StoredUsersKey);
  //     if (storedUsers) {
  //       setUsers(JSON.parse(storedUsers));
  //     }
  //     const storedCurrentUserEmail = localStorage.getItem('currentUserEmail');
  //     if(storedCurrentUserEmail){
  //       const parsedStoredUsers = JSON.parse(storedUsers || "[]") as User[];
  //       const foundUser = parsedStoredUsers.find(u => u.email === storedCurrentUserEmail);
  //       if(foundUser) {
  //           setCurrentUser(foundUser);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Failed to load users from localStorage", error);
  //   }
  //   setIsLoading(false);
  // }, []);

  // useEffect(() => { // Temporarily disable localStorage saving
  //   if(!isLoading) { 
  //       try {
  //           localStorage.setItem(StoredUsersKey, JSON.stringify(users));
  //       } catch (error) {
  //           console.error("Failed to save users to localStorage", error);
  //           toast({
  //               title: "Storage Error",
  //               description: "Could not save user data. Local storage might be full.",
  //               variant: "destructive",
  //           });
  //       }
  //   }
  // }, [users, isLoading, toast]);


  const signUp = async (email: string, password: string): Promise<boolean> => {
    // setIsLoading(true); // Simplified
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

    if (users.find(user => user.email === email)) {
      toast({ title: "Sign Up Failed", description: "Email already exists.", variant: "destructive" });
      // setIsLoading(false); // Simplified
      return false;
    }

    const newUser: User = { id: crypto.randomUUID(), email, password };
    setUsers(prevUsers => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    // localStorage.setItem('currentUserEmail', newUser.email); // Temporarily disabled
    toast({ title: "Sign Up Successful!", description: `Welcome, ${email}!` });
    // setIsLoading(false); // Simplified
    return true;
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // setIsLoading(true); // Simplified
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      setCurrentUser(user);
      // localStorage.setItem('currentUserEmail', user.email); // Temporarily disabled
      toast({ title: "Sign In Successful!", description: `Welcome back, ${email}!` });
      // setIsLoading(false); // Simplified
      return true;
    } else {
      toast({ title: "Sign In Failed", description: "Invalid email or password.", variant: "destructive" });
      // setIsLoading(false); // Simplified
      return false;
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    // localStorage.removeItem('currentUserEmail'); // Temporarily disabled
    toast({ title: "Signed Out", description: "You have been signed out." });
    router.push('/');
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, users, signUp, signIn, signOut, isLoading }}>
      {/*isLoading state is now simplified and starts false, so loader won't show initially based on this flag */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
