
import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer'; // Import Footer
import { AuthProvider } from '@/context/AuthContext';
import Chatbot from '@/components/app/Chatbot'; // Import Chatbot

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AestheFit',
  description: 'AI-Powered Outfit Curation & Virtual Try-On',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="antialiased font-sans flex flex-col min-h-screen"> {/* Ensure full height and flex column */}
        <AuthProvider>
          <Header />
          <main className="flex-grow"> {/* Main content will take available space */}
            {children}
          </main>
          <Chatbot /> {/* Add Chatbot here so it floats above */}
          <Footer /> {/* Add Footer here */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
