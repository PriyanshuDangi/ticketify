// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPYUSD.sol";

/**
 * @title Ticketify
 * @dev Immutable smart contract for blockchain-based event ticketing with PYUSD payments
 * @notice This contract is NOT upgradeable - no proxy pattern for MVP
 * 
 * Features:
 * - Event creation by organizers
 * - Ticket purchases with PYUSD (6 decimals)
 * - One ticket per wallet per event
 * - Platform fee: 2.5% (250 basis points)
 * - Revenue withdrawal anytime (no time restrictions)
 * - Reentrancy protection on all fund transfers
 * 
 * Business Rules:
 * - One wallet can only purchase one ticket per event
 * - Organizers can withdraw revenue at any time
 * - Platform owner withdraws accumulated fees
 * - No refunds in MVP (placeholder for future)
 */
contract Ticketify is Ownable, ReentrancyGuard {
    // ============ State Variables ============

    /// @dev PYUSD token contract (immutable for security)
    IPYUSD public immutable pyusdToken;

    /// @dev Platform fee in basis points (250 = 2.5%)
    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 250;
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;

    /// @dev Event counter for generating unique IDs
    uint256 private eventCounter;

    /// @dev Accumulated platform fees available for withdrawal
    uint256 public platformFeesAccumulated;

    // ============ Structs ============

    /**
     * @dev Event struct containing all event information
     * @param id Unique event identifier
     * @param organizer Address of event creator
     * @param price Ticket price in PYUSD (6 decimals)
     * @param maxAttendees Maximum number of tickets available
     * @param eventTime Unix timestamp when event starts
     * @param isActive Whether event is active (can be deactivated)
     * @param ticketsSold Number of tickets sold
     * @param hasWithdrawn Whether organizer has withdrawn revenue
     */
    struct Event {
        uint256 id;
        address organizer;
        uint256 price;
        uint256 maxAttendees;
        uint256 eventTime;
        bool isActive;
        uint256 ticketsSold;
        bool hasWithdrawn;
    }

    /**
     * @dev Ticket struct containing purchase information
     * @param eventId ID of the event
     * @param buyer Address of ticket purchaser
     * @param purchaseTime Unix timestamp of purchase
     */
    struct Ticket {
        uint256 eventId;
        address buyer;
        uint256 purchaseTime;
    }

    // ============ Mappings ============

    /// @dev Mapping from event ID to Event struct
    mapping(uint256 => Event) public events;

    /// @dev Mapping from event ID to array of tickets for that event
    mapping(uint256 => Ticket[]) public eventTickets;

    /// @dev Mapping to track if a wallet has purchased a ticket for an event
    /// @notice eventId => buyer address => has purchased
    /// @notice Enforces one ticket per wallet per event rule
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;

    // ============ Events ============

    /**
     * @dev Emitted when a new event is created
     * @param eventId Unique identifier for the event
     * @param organizer Address of the event creator
     * @param price Ticket price in PYUSD (6 decimals)
     * @param maxAttendees Maximum capacity
     * @param eventTime When the event starts (Unix timestamp)
     */
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 price,
        uint256 maxAttendees,
        uint256 eventTime
    );

    /**
     * @dev Emitted when a ticket is purchased
     * @param eventId ID of the event
     * @param buyer Address of the ticket purchaser
     * @param price Amount paid in PYUSD (6 decimals)
     * @param purchaseTime When the ticket was purchased
     */
    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 price,
        uint256 purchaseTime
    );

    /**
     * @dev Emitted when an organizer withdraws event revenue
     * @param eventId ID of the event
     * @param organizer Address of the organizer
     * @param amount Amount withdrawn in PYUSD (6 decimals)
     */
    event RevenueWithdrawn(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 amount
    );

    /**
     * @dev Emitted when platform owner withdraws accumulated fees
     * @param owner Address of platform owner
     * @param amount Amount withdrawn in PYUSD (6 decimals)
     */
    event PlatformFeesWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ============ Constructor ============

    /**
     * @dev Initializes the contract with PYUSD token address
     * @param _pyusdAddress Address of PYUSD token contract on Sepolia
     * @notice PYUSD Sepolia: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
     */
    constructor(address _pyusdAddress) Ownable(msg.sender) {
        require(_pyusdAddress != address(0), "Invalid PYUSD address");
        pyusdToken = IPYUSD(_pyusdAddress);
        eventCounter = 0;
    }

    // ============ Functions ============

    /**
     * @dev Creates a new event
     * @param price Ticket price in PYUSD (6 decimals, e.g., 10.50 PYUSD = 10500000)
     * @param maxAttendees Maximum number of tickets available
     * @param eventTime Unix timestamp when event starts (must be in future)
     * @return eventId The unique identifier for the created event
     * 
     * Requirements:
     * - eventTime must be in the future
     * - price must be greater than 0
     * - maxAttendees must be greater than 0
     * 
     * Emits EventCreated event
     */
    function createEvent(
        uint256 price,
        uint256 maxAttendees,
        uint256 eventTime
    ) external returns (uint256) {
        // Validate inputs
        require(price > 0, "Price must be greater than 0");
        require(maxAttendees > 0, "Max attendees must be greater than 0");
        require(eventTime > block.timestamp, "Event time must be in future");

        // Generate unique event ID
        uint256 eventId = eventCounter;
        eventCounter++;

        // Create and store event
        events[eventId] = Event({
            id: eventId,
            organizer: msg.sender,
            price: price,
            maxAttendees: maxAttendees,
            eventTime: eventTime,
            isActive: true,
            ticketsSold: 0,
            hasWithdrawn: false
        });

        // Emit event for off-chain tracking
        emit EventCreated(
            eventId,
            msg.sender,
            price,
            maxAttendees,
            eventTime
        );

        return eventId;
    }

    /**
     * @dev Purchase a ticket for an event with PYUSD
     * @param eventId The ID of the event to purchase ticket for
     * 
     * Requirements:
     * - Event must exist and be active
     * - Event must not have started
     * - Event must have available capacity
     * - Buyer must not have already purchased a ticket for this event (one per wallet)
     * - Buyer must have approved sufficient PYUSD allowance
     * 
     * Emits TicketPurchased event
     * 
     * @notice Buyer must approve PYUSD spending before calling this function
     * @notice One wallet can only purchase one ticket per event
     */
    function purchaseTicket(uint256 eventId) external nonReentrant {
        Event storage eventData = events[eventId];

        // Validate event exists and is active
        require(eventData.organizer != address(0), "Event does not exist");
        require(eventData.isActive, "Event is not active");

        // Validate event hasn't started
        require(block.timestamp < eventData.eventTime, "Event has already started");

        // Validate capacity available
        require(eventData.ticketsSold < eventData.maxAttendees, "Event is sold out");

        // Validate buyer hasn't already purchased (one ticket per wallet per event)
        require(!hasPurchasedTicket[eventId][msg.sender], "Already purchased ticket for this event");

        // Calculate platform fee (2.5% of ticket price)
        uint256 platformFee = (eventData.price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;

        // Transfer PYUSD from buyer to contract
        // Buyer must have approved this contract to spend PYUSD
        require(
            pyusdToken.transferFrom(msg.sender, address(this), eventData.price),
            "PYUSD transfer failed"
        );

        // Accumulate platform fee
        platformFeesAccumulated += platformFee;

        // Create and store ticket
        Ticket memory newTicket = Ticket({
            eventId: eventId,
            buyer: msg.sender,
            purchaseTime: block.timestamp
        });
        eventTickets[eventId].push(newTicket);

        // Increment ticket count
        eventData.ticketsSold++;

        // Mark that buyer has purchased ticket for this event
        hasPurchasedTicket[eventId][msg.sender] = true;

        // Emit event for off-chain tracking
        emit TicketPurchased(
            eventId,
            msg.sender,
            eventData.price,
            block.timestamp
        );
    }

    /**
     * @dev Allows organizer to withdraw revenue from their event
     * @param eventId The ID of the event to withdraw from
     * 
     * Requirements:
     * - Caller must be the event organizer
     * - Event must have sold at least one ticket
     * - Organizer must not have already withdrawn
     * - Can withdraw anytime (no time restrictions)
     * 
     * Emits RevenueWithdrawn event
     * 
     * @notice Platform fee (2.5%) is deducted automatically
     * @notice Organizer can withdraw anytime - no restrictions
     */
    function withdrawRevenue(uint256 eventId) external nonReentrant {
        Event storage eventData = events[eventId];

        // Validate caller is event organizer
        require(msg.sender == eventData.organizer, "Only organizer can withdraw");

        // Validate event exists
        require(eventData.organizer != address(0), "Event does not exist");

        // Validate has tickets sold
        require(eventData.ticketsSold > 0, "No tickets sold");

        // Validate hasn't already withdrawn
        require(!eventData.hasWithdrawn, "Revenue already withdrawn");

        // Calculate organizer's share (total revenue - platform fees)
        // Platform fee per ticket: (price * 250) / 10000
        uint256 platformFeePerTicket = (eventData.price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        uint256 organizerSharePerTicket = eventData.price - platformFeePerTicket;
        uint256 totalOrganizerShare = organizerSharePerTicket * eventData.ticketsSold;

        // Mark as withdrawn to prevent double withdrawal
        eventData.hasWithdrawn = true;

        // Transfer PYUSD to organizer
        require(
            pyusdToken.transfer(msg.sender, totalOrganizerShare),
            "PYUSD transfer failed"
        );

        // Emit event for off-chain tracking
        emit RevenueWithdrawn(
            eventId,
            msg.sender,
            totalOrganizerShare
        );
    }

    /**
     * @dev Allows platform owner to withdraw accumulated platform fees
     * 
     * Requirements:
     * - Caller must be contract owner
     * - Must have accumulated fees available
     * 
     * Emits PlatformFeesWithdrawn event
     * 
     * @notice Only contract owner can call this function
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeesAccumulated;

        // Validate fees available
        require(amount > 0, "No fees to withdraw");

        // Reset accumulated fees to zero
        platformFeesAccumulated = 0;

        // Transfer PYUSD to owner
        require(
            pyusdToken.transfer(msg.sender, amount),
            "PYUSD transfer failed"
        );

        // Emit event for off-chain tracking
        emit PlatformFeesWithdrawn(
            msg.sender,
            amount
        );
    }

    // ============ View Functions ============

    /**
     * @dev Get complete event details by ID
     * @param eventId The ID of the event to query
     * @return Event struct containing all event information
     * 
     * @notice Returns default values if event doesn't exist
     * @notice Check organizer != address(0) to verify event exists
     */
    function getEvent(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get number of tickets sold for an event
     * @param eventId The ID of the event to query
     * @return Number of tickets sold
     * 
     * @notice Returns 0 if event doesn't exist
     */
    function getTicketsSold(uint256 eventId) external view returns (uint256) {
        return events[eventId].ticketsSold;
    }

    /**
     * @dev Check if a user has purchased a ticket for an event
     * @param eventId The ID of the event to check
     * @param user The address of the user to check
     * @return bool True if user has purchased, false otherwise
     * 
     * @notice Used to enforce one ticket per wallet per event rule
     */
    function hasUserPurchasedTicket(uint256 eventId, address user) external view returns (bool) {
        return hasPurchasedTicket[eventId][user];
    }

    /**
     * @dev Calculate total revenue for an event (organizer's share)
     * @param eventId The ID of the event to calculate revenue for
     * @return Total revenue in PYUSD (6 decimals) after platform fee deduction
     * 
     * @notice This is the amount organizer can withdraw
     * @notice Platform fee (2.5%) is already deducted from this amount
     * @notice Returns 0 if event doesn't exist or has no sales
     * 
     * Example: 
     * - Ticket price: 10.50 PYUSD (10,500,000 in 6 decimals)
     * - Platform fee per ticket: 0.2625 PYUSD (262,500)
     * - Organizer share per ticket: 10.2375 PYUSD (10,237,500)
     * - If 10 tickets sold: 102.375 PYUSD total (102,375,000)
     */
    function getEventRevenue(uint256 eventId) external view returns (uint256) {
        Event memory eventData = events[eventId];
        
        if (eventData.ticketsSold == 0) {
            return 0;
        }

        // Calculate organizer's share (total revenue - platform fees)
        uint256 platformFeePerTicket = (eventData.price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        uint256 organizerSharePerTicket = eventData.price - platformFeePerTicket;
        uint256 totalOrganizerRevenue = organizerSharePerTicket * eventData.ticketsSold;

        return totalOrganizerRevenue;
    }

    /**
     * @dev Get accumulated platform fees available for withdrawal
     * @return Total platform fees in PYUSD (6 decimals)
     * 
     * @notice Only contract owner can withdraw these fees
     * @notice Fees accumulate from all ticket sales across all events
     */
    function getPlatformFees() external view returns (uint256) {
        return platformFeesAccumulated;
    }

    /**
     * @dev Get all tickets for an event
     * @param eventId The ID of the event to query
     * @return Array of Ticket structs for the event
     * 
     * @notice Returns empty array if event doesn't exist or has no tickets
     * @notice Gas cost increases with number of tickets - use with caution
     */
    function getEventTickets(uint256 eventId) external view returns (Ticket[] memory) {
        return eventTickets[eventId];
    }

    /**
     * @dev Get current event counter (total events created)
     * @return Total number of events created
     * 
     * @notice Event IDs start at 0, so total events = eventCounter
     * @notice Next event will have ID = eventCounter
     */
    function getEventCounter() external view returns (uint256) {
        return eventCounter;
    }

    // Future enhancement: Refund functionality
    // function refundTicket(uint256 eventId) external nonReentrant {
    //     // Refund logic to be implemented in future version
    //     // Will require:
    //     // - Check ticket exists for buyer
    //     // - Check event hasn't started
    //     // - Transfer PYUSD back to buyer
    //     // - Remove from Google Calendar (off-chain)
    //     // - Update ticket count
    // }
}

