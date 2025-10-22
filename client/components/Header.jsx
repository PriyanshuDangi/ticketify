'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">T</span>
          </div>
          <span className="text-xl font-bold">Ticketify</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/events" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Browse Events
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link 
            href="/tickets" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            My Tickets
          </Link>
        </nav>

        {/* Right side - Wallet button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/events/create')}
            className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create Event
          </button>
          
          {/* Wallet connection button - will be replaced with Privy in 4.2 */}
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Connect Wallet
          </button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>
    </header>
  );
}

