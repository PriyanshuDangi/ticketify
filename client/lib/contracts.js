import { ethers } from 'ethers';

// Contract addresses
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
export const PYUSD_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_ADDRESS;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

// Ticketify Contract ABI
export const TICKETIFY_ABI = [
  // Events
  "event EventCreated(uint256 indexed eventId, address indexed organizer, uint256 price, uint256 maxAttendees, uint256 eventTime)",
  "event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 price, uint256 timestamp)",
  "event RevenueWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount)",
  "event PlatformFeesWithdrawn(address indexed owner, uint256 amount)",
  
  // Write functions
  "function createEvent(uint256 price, uint256 maxAttendees, uint256 eventTime) external returns (uint256)",
  "function purchaseTicket(uint256 eventId) external",
  "function withdrawRevenue(uint256 eventId) external",
  "function withdrawPlatformFees() external",
  
  // View functions
  "function getEvent(uint256 eventId) external view returns (tuple(uint256 id, address organizer, uint256 price, uint256 maxAttendees, uint256 eventTime, bool isActive, uint256 ticketsSold, bool hasWithdrawn))",
  "function getTicketsSold(uint256 eventId) external view returns (uint256)",
  "function hasUserPurchasedTicket(uint256 eventId, address user) external view returns (bool)",
  "function getEventRevenue(uint256 eventId) external view returns (uint256)",
  "function getPlatformFees() external view returns (uint256)",
  "function getEventCounter() external view returns (uint256)",
  "function getEventTickets(uint256 eventId) external view returns (tuple(uint256 eventId, address buyer, uint256 purchaseTime)[])",
  
  // Constants
  "function PLATFORM_FEE_BASIS_POINTS() external view returns (uint256)",
  "function BASIS_POINTS_DIVISOR() external view returns (uint256)",
  "function pyusdToken() external view returns (address)",
  "function platformFeesAccumulated() external view returns (uint256)",
  "function eventCounter() external view returns (uint256)",
  "function owner() external view returns (address)"
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

// Blockchain interaction functions

/**
 * Check PYUSD balance
 * @param {string} address - Wallet address to check
 * @returns {Promise<string>} - Balance in PYUSD (formatted, 2 decimals)
 */
export const checkPYUSDBalance = async (address) => {
  try {
    const contract = await getPYUSDContract(false);
    const balance = await contract.balanceOf(address);
    return formatPYUSD(balance);
  } catch (error) {
    console.error('Error checking PYUSD balance:', error);
    throw error;
  }
};

/**
 * Check PYUSD allowance for Ticketify contract
 * @param {string} ownerAddress - Token owner address
 * @returns {Promise<string>} - Allowance in PYUSD (formatted)
 */
export const checkPYUSDAllowance = async (ownerAddress) => {
  try {
    const contract = await getPYUSDContract(false);
    const allowance = await contract.allowance(ownerAddress, CONTRACT_ADDRESS);
    return formatPYUSD(allowance);
  } catch (error) {
    console.error('Error checking PYUSD allowance:', error);
    throw error;
  }
};

/**
 * Approve PYUSD spending for Ticketify contract
 * @param {number|string} amount - Amount to approve (in PYUSD with 2 decimals)
 * @returns {Promise<object>} - Transaction receipt
 */
export const approvePYUSD = async (amount) => {
  try {
    const contract = await getPYUSDContract(true);
    const amountInWei = parsePYUSD(amount);
    const tx = await contract.approve(CONTRACT_ADDRESS, amountInWei);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error approving PYUSD:', error);
    throw error;
  }
};

/**
 * Create event on blockchain
 * @param {number} price - Ticket price in PYUSD (2 decimals)
 * @param {number} maxAttendees - Maximum number of attendees
 * @param {number} eventTime - Unix timestamp of event start
 * @returns {Promise<{eventId: string, txHash: string}>} - Event ID and transaction hash
 */
export const createEventOnChain = async (price, maxAttendees, eventTime) => {
  try {
    const contract = await getTicketifyContract(true);
    const priceInWei = parsePYUSD(price);
    
    // Estimate gas
    const gasEstimate = await contract.createEvent.estimateGas(
      priceInWei,
      maxAttendees,
      eventTime
    );
    
    const tx = await contract.createEvent(priceInWei, maxAttendees, eventTime, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    const receipt = await tx.wait();
    
    // Parse EventCreated event to get event ID
    const eventCreatedEvent = receipt.logs.find(
      log => log.fragment?.name === 'EventCreated'
    );
    
    const eventId = eventCreatedEvent?.args?.eventId?.toString() || '0';
    
    return {
      eventId,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Error creating event on chain:', error);
    throw error;
  }
};

/**
 * Purchase ticket on blockchain
 * @param {string|number} eventId - Contract event ID
 * @returns {Promise<{txHash: string}>} - Transaction hash
 */
export const purchaseTicketOnChain = async (eventId) => {
  try {
    const contract = await getTicketifyContract(true);
    
    // Estimate gas
    const gasEstimate = await contract.purchaseTicket.estimateGas(eventId);
    
    const tx = await contract.purchaseTicket(eventId, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Error purchasing ticket on chain:', error);
    throw error;
  }
};

/**
 * Withdraw revenue from event
 * @param {string|number} eventId - Contract event ID
 * @returns {Promise<{txHash: string, amount: string}>} - Transaction hash and withdrawn amount
 */
export const withdrawRevenueOnChain = async (eventId) => {
  try {
    const contract = await getTicketifyContract(true);
    
    // Get expected revenue first
    const revenue = await contract.getEventRevenue(eventId);
    
    // Estimate gas
    const gasEstimate = await contract.withdrawRevenue.estimateGas(eventId);
    
    const tx = await contract.withdrawRevenue(eventId, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      amount: formatPYUSD(revenue)
    };
  } catch (error) {
    console.error('Error withdrawing revenue on chain:', error);
    throw error;
  }
};

/**
 * Get event details from blockchain
 * @param {string|number} eventId - Contract event ID
 * @returns {Promise<object>} - Event details
 */
export const getEventFromChain = async (eventId) => {
  try {
    const contract = await getTicketifyContract(false);
    const event = await contract.getEvent(eventId);
    
    return {
      id: event.id.toString(),
      organizer: event.organizer,
      price: formatPYUSD(event.price),
      maxAttendees: event.maxAttendees.toString(),
      eventTime: event.eventTime.toString(),
      isActive: event.isActive,
      ticketsSold: event.ticketsSold.toString(),
      hasWithdrawn: event.hasWithdrawn
    };
  } catch (error) {
    console.error('Error getting event from chain:', error);
    throw error;
  }
};

/**
 * Check if user has purchased ticket
 * @param {string|number} eventId - Contract event ID
 * @param {string} userAddress - User wallet address
 * @returns {Promise<boolean>} - Whether user has purchased
 */
export const hasUserPurchased = async (eventId, userAddress) => {
  try {
    const contract = await getTicketifyContract(false);
    return await contract.hasUserPurchasedTicket(eventId, userAddress);
  } catch (error) {
    console.error('Error checking if user purchased:', error);
    return false;
  }
};

/**
 * Estimate gas for a transaction
 * @param {string} functionName - Function to estimate ('createEvent', 'purchaseTicket', 'withdrawRevenue')
 * @param {Array} args - Function arguments
 * @returns {Promise<{gasLimit: string, estimatedCost: string}>} - Gas estimate and cost in ETH
 */
export const estimateGas = async (functionName, args = []) => {
  try {
    const contract = await getTicketifyContract(true);
    const provider = getProvider();
    
    // Get gas estimate
    let gasLimit;
    switch (functionName) {
      case 'createEvent':
        gasLimit = await contract.createEvent.estimateGas(...args);
        break;
      case 'purchaseTicket':
        gasLimit = await contract.purchaseTicket.estimateGas(...args);
        break;
      case 'withdrawRevenue':
        gasLimit = await contract.withdrawRevenue.estimateGas(...args);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    
    // Calculate estimated cost
    const estimatedCost = ethers.formatEther(gasLimit * gasPrice);
    
    return {
      gasLimit: gasLimit.toString(),
      estimatedCost
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return conservative estimates
    return {
      gasLimit: '200000',
      estimatedCost: '0.002'
    };
  }
};

