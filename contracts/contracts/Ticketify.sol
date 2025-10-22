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

