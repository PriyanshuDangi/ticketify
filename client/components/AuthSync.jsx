'use client';

import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuthStore } from '@/store/authStore';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

/**
 * AuthSync Component
 * Synchronizes Privy authentication state with browser cookies and auth store.
 * Handles active wallet tracking and account switching.
 */
export default function AuthSync() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setWallet, logout } = useAuthStore();

  useEffect(() => {
    // Wait for Privy to be ready
    if (!ready) return;

    if (authenticated && wallets.length > 0) {
      // Use the first wallet in the array - Privy orders them with the active wallet first
      const activeWallet = wallets[0];
      
      const walletAddress = activeWallet.address;

      // Set cookie with current active wallet
      document.cookie = `walletAddress=${walletAddress}; path=/; SameSite=Lax`;
      
      // Update auth store with wallet info
      setWallet({
        address: walletAddress,
        chainId: activeWallet.chainId,
        walletClientType: activeWallet.walletClientType
      });
    } else {
      // Remove cookie when not authenticated
      document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      logout();
    }
  }, [ready, authenticated, wallets, setWallet, logout]);

  // Prompt user to switch to Sepolia if on wrong network
  useEffect(() => {
    const checkAndSwitchNetwork = async () => {
      if (!authenticated || wallets.length === 0) return;
      
      const activeWallet = wallets[0];
      
      // Check if wallet is on Sepolia (chain ID 11155111)
      if (activeWallet.chainId && parseInt(activeWallet.chainId) !== 11155111) {
        try {
          // Try to switch to Sepolia
          const provider = await activeWallet.getEthereumProvider();
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          // If Sepolia is not added to the wallet, add it
          if (switchError.code === 4902) {
            try {
              const provider = await activeWallet.getEthereumProvider();
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: SEPOLIA_CHAIN_ID,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Error adding Sepolia network:', addError);
            }
          }
        }
      }
    };

    checkAndSwitchNetwork();
  }, [authenticated, wallets]);

  // Listen for account changes in external wallets (like MetaMask)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        logout();
        document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      } else if (authenticated && wallets.length > 0) {
        // User switched accounts - update if it matches one of our connected wallets
        const newAddress = accounts[0].toLowerCase();
        const matchingWallet = wallets.find(w => w.address.toLowerCase() === newAddress);
        
        if (matchingWallet) {
          document.cookie = `walletAddress=${matchingWallet.address}; path=/; SameSite=Lax`;
          setWallet({
            address: matchingWallet.address,
            chainId: matchingWallet.chainId,
            walletClientType: matchingWallet.walletClientType
          });
        } else {
          // Account not in our wallets list - require reconnection
          console.warn('Switched to unrecognized account. Please reconnect.');
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [authenticated, wallets, setWallet, logout]);

  // This component doesn't render anything
  return null;
}

