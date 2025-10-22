import { ethers } from 'ethers';

// Contract addresses
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
export const PYUSD_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_ADDRESS;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

// ABI placeholders (to be populated after contract deployment)
export const TICKETIFY_ABI = [
  // Will be populated with actual ABI after contract deployment
];

export const PYUSD_ABI = [
  // Standard ERC-20 functions
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Helper function to get provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

// Helper function to get signer
export const getSigner = async () => {
  const provider = getProvider();
  if (provider) {
    return await provider.getSigner();
  }
  return null;
};

// Helper function to get contract instance
export const getTicketifyContract = async (withSigner = true) => {
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, TICKETIFY_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, TICKETIFY_ABI, provider);
  }
};

// Helper function to get PYUSD contract instance
export const getPYUSDContract = async (withSigner = true) => {
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, provider);
  }
};

// Helper function to format PYUSD (6 decimals)
export const formatPYUSD = (amount) => {
  return ethers.formatUnits(amount, 6);
};

// Helper function to parse PYUSD (6 decimals)
export const parsePYUSD = (amount) => {
  return ethers.parseUnits(amount.toString(), 6);
};

