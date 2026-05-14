
"use client"; 

import type { FC } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer: FC = () => {
  return (
    <footer className="py-8 bg-muted/50 dark:bg-muted/20 border-t mt-auto"> {/* mt-auto helps ensure it's pushed down */}
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AestheFit. All rights reserved.
        </p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Instagram" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </Link>
          <Link 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Facebook" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Facebook className="h-5 w-5" />
          </Link>
          <Link 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Twitter" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Twitter className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
