const { ethers } = require('ethers');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// Contract ABI - Only the events we need
const TICKETIFY_ABI = [
  'event EventCreated(uint256 indexed eventId, address indexed organizer, uint256 price, uint256 maxAttendees, uint256 eventTime)',
  'event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 price, uint256 timestamp)',
  'event RevenueWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount)',
  'event PlatformFeesWithdrawn(address indexed owner, uint256 amount)'
];

let provider;
let contract;
let isListening = false;

/**
 * Initialize blockchain listener
 */
const initializeListener = async () => {
  try {
    // Validate environment variables
    if (!process.env.SEPOLIA_RPC_URL) {
      console.error('SEPOLIA_RPC_URL not configured');
      return false;
    }

    if (!process.env.CONTRACT_ADDRESS) {
      console.error('CONTRACT_ADDRESS not configured');
      return false;
    }

    // Create provider
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

    // Create contract instance
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      TICKETIFY_ABI,
      provider
    );

    // Verify connection
    await provider.getBlockNumber();
    console.log('✅ Connected to Sepolia network');
    console.log(`📝 Listening to contract: ${process.env.CONTRACT_ADDRESS}`);

    return true;
  } catch (error) {
    console.error('Failed to initialize blockchain listener:', error);
    return false;
  }
};

/**
 * Handle EventCreated event
 */
const handleEventCreated = async (eventId, organizer, price, maxAttendees, eventTime, eventLog) => {
  try {
    console.log(`📅 EventCreated: ID ${eventId}, Organizer ${organizer}`);

    // This event is primarily created from the backend when organizer creates event
    // We use this listener as a backup/verification mechanism
    
    // Check if event already exists in database
    const existingEvent = await Event.findOne({ contractEventId: eventId.toString() });

    if (existingEvent) {
      console.log(`Event ${eventId} already exists in database`);
      return;
    }

    console.log(`⚠️ Warning: Event ${eventId} found on blockchain but not in database`);
    // In production, you might want to create the event here or alert admins
  } catch (error) {
    console.error('Error handling EventCreated:', error);
  }
};

/**
 * Handle TicketPurchased event
 */
const handleTicketPurchased = async (eventId, buyer, price, timestamp, eventLog) => {
  try {
    console.log(`🎫 TicketPurchased: Event ${eventId}, Buyer ${buyer}`);

    // Find the event in database
    const event = await Event.findOne({ contractEventId: eventId.toString() });

    if (!event) {
      console.error(`Event ${eventId} not found in database`);
      return;
    }

    // Get transaction hash
    const txHash = eventLog.transactionHash;

    // Check if ticket already exists with this transaction
    const existingTicket = await Ticket.findOne({ transactionHash: txHash.toLowerCase() });

    if (existingTicket) {
      console.log(`Ticket for transaction ${txHash} already exists`);
      return;
    }

    // Find ticket in 'created' or 'blockchain_added' status
    const ticket = await Ticket.findOne({
      event: event._id,
      buyerWalletAddress: buyer.toLowerCase(),
      status: { $in: ['created', 'blockchain_added'] }
    }).sort({ createdAt: -1 });

    if (ticket) {
      // Update ticket with transaction hash
      if (ticket.status === 'created') {
        ticket.transactionHash = txHash.toLowerCase();
        ticket.status = 'blockchain_added';
        await ticket.save();
        console.log(`✅ Updated ticket ${ticket._id} to blockchain_added`);
      }
    } else {
      console.log(`⚠️ Warning: No pending ticket found for buyer ${buyer} on event ${eventId}`);
      // Ticket might have been purchased directly on blockchain without going through API
      // In production, you might want to handle this case
    }
  } catch (error) {
    console.error('Error handling TicketPurchased:', error);
  }
};

/**
 * Handle RevenueWithdrawn event
 */
const handleRevenueWithdrawn = async (eventId, organizer, amount, eventLog) => {
  try {
    console.log(`💰 RevenueWithdrawn: Event ${eventId}, Amount ${ethers.formatUnits(amount, 6)} PYUSD`);

    // Find the event in database
    const event = await Event.findOne({ contractEventId: eventId.toString() });

    if (!event) {
      console.error(`Event ${eventId} not found in database`);
      return;
    }

    // You might want to add a 'hasWithdrawn' field to Event model to track this
    console.log(`Organizer ${organizer} withdrew ${ethers.formatUnits(amount, 6)} PYUSD from event ${event.title}`);
  } catch (error) {
    console.error('Error handling RevenueWithdrawn:', error);
  }
};

/**
 * Handle PlatformFeesWithdrawn event
 */
const handlePlatformFeesWithdrawn = async (owner, amount, eventLog) => {
  try {
    console.log(`💵 PlatformFeesWithdrawn: Amount ${ethers.formatUnits(amount, 6)} PYUSD`);
    // Log platform fee withdrawals for accounting
  } catch (error) {
    console.error('Error handling PlatformFeesWithdrawn:', error);
  }
};

/**
 * Start listening to blockchain events
 */
const startListening = async () => {
  if (isListening) {
    console.log('Blockchain listener already running');
    return;
  }

  const initialized = await initializeListener();
  if (!initialized) {
    console.error('Failed to start blockchain listener');
    return;
  }

  try {
    // Listen to EventCreated
    contract.on('EventCreated', handleEventCreated);

    // Listen to TicketPurchased
    contract.on('TicketPurchased', handleTicketPurchased);

    // Listen to RevenueWithdrawn
    contract.on('RevenueWithdrawn', handleRevenueWithdrawn);

    // Listen to PlatformFeesWithdrawn
    contract.on('PlatformFeesWithdrawn', handlePlatformFeesWithdrawn);

    isListening = true;
    console.log('🎧 Blockchain listener started successfully');

    // Handle provider errors
    provider.on('error', (error) => {
      console.error('Provider error:', error);
      // Attempt to reconnect
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        stopListening();
        startListening();
      }, 5000);
    });
  } catch (error) {
    console.error('Error starting blockchain listener:', error);
    isListening = false;
  }
};

/**
 * Stop listening to blockchain events
 */
const stopListening = () => {
  if (!isListening) {
    console.log('Blockchain listener not running');
    return;
  }

  try {
    // Remove all listeners
    contract.removeAllListeners('EventCreated');
    contract.removeAllListeners('TicketPurchased');
    contract.removeAllListeners('RevenueWithdrawn');
    contract.removeAllListeners('PlatformFeesWithdrawn');

    isListening = false;
    console.log('🛑 Blockchain listener stopped');
  } catch (error) {
    console.error('Error stopping blockchain listener:', error);
  }
};

/**
 * Query past events (useful for syncing historical data)
 */
const queryPastEvents = async (eventName, fromBlock = 0, toBlock = 'latest') => {
  try {
    if (!contract) {
      await initializeListener();
    }

    const filter = contract.filters[eventName]();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    console.log(`Found ${events.length} ${eventName} events from block ${fromBlock} to ${toBlock}`);
    return events;
  } catch (error) {
    console.error(`Error querying past ${eventName} events:`, error);
    return [];
  }
};

/**
 * Get current block number
 */
const getCurrentBlock = async () => {
  try {
    if (!provider) {
      await initializeListener();
    }
    const blockNumber = await provider.getBlockNumber();
    return blockNumber;
  } catch (error) {
    console.error('Error getting current block:', error);
    return null;
  }
};

module.exports = {
  initializeListener,
  startListening,
  stopListening,
  queryPastEvents,
  getCurrentBlock
};

