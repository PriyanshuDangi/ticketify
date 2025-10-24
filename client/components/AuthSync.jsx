'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/**
 * AuthSync Component
 * Synchronizes Privy authentication state with browser cookies.
 * Sets walletAddress cookie when authenticated, removes it when not.
 */
export default function AuthSync() {
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    // Wait for Privy to be ready
    if (!ready) return;

    // Get wallet address from Privy user object
    const walletAddress = user?.wallet?.address;

    if (authenticated && walletAddress) {
      // Set cookie when authenticated
      document.cookie = `walletAddress=${walletAddress}; path=/; SameSite=Lax`;
    } else {
      // Remove cookie when not authenticated
      document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    }
  }, [ready, authenticated, user]);

  // This component doesn't render anything
  return null;
}

