
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

const Header: FC = () => {
  const { currentUser, signOut, isLoading } = useAuth();

  return (
    <header className="py-4 bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          AestheFit
        </Link>
        <nav className="flex items-center space-x-2">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse bg-muted rounded-md"></div>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {currentUser.email}
              </span>
              <Button onClick={signOut} variant="ghost" size="sm">
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
