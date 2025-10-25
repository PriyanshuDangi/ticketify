'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import AuthSync from './AuthSync';

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url.com/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
          name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://sepolia.infura.io/v3/'],
            },
          },
          blockExplorers: {
            default: {
              name: 'Etherscan',
              url: process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io',
            },
          },
        },
        supportedChains: [
          {
            id: 11155111,
            name: 'Sepolia',
            network: 'sepolia',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia.infura.io/v3/'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Etherscan',
                url: 'https://sepolia.etherscan.io',
              },
            },
          },
        ],
      }}
    >
      <AuthSync />
      {children}
    </PrivyProvider>
  );
}

