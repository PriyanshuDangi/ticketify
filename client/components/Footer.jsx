'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">T</span>
              </div>
              <span className="text-lg font-bold">Ticketify</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Blockchain-powered event ticketing with automatic Google Meet access
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="text-muted-foreground hover:text-foreground transition-colors">
                  Create Event
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Ticketify. Built for ETHOnline 2025.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Contract
            </a>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              Network: Sepolia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

