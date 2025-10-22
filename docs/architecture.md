# Ticketify Architecture

**Version**: 1.0  
**Last Updated**: October 21, 2025

---

## Project Structure

Ticketify uses a **monorepo architecture** with three main components:

```
ticketify/
├── client/          # Frontend application
├── server/          # Backend API
├── contracts/       # Smart contracts
└── docs/            # Documentation
```

---

## Component Overview

### `/client` - Frontend Application

**Technology**: Next.js 14 with React and App Router

**Purpose**: User-facing web application for event browsing, ticket purchasing, and dashboard management.

**Key Features**:
- Event discovery and browsing
- Wallet authentication (Privy)
- Ticket purchase flow with PYUSD
- Organizer dashboard
- My Tickets page

**State Management**: Zustand  
**Styling**: Tailwind CSS + Shadcn/ui  
**Blockchain**: Ethers.js v6

**Directory Structure**:
```
client/
├── app/                # Next.js 14 App Router
│   ├── layout.jsx     # Root layout with Inter font, metadata
│   ├── page.jsx       # Homepage
│   └── globals.css    # Tailwind CSS + design tokens
├── components/         # React components (ready for Shadcn/ui)
├── lib/               # Utility libraries
│   ├── api.js         # Axios HTTP client
│   ├── contracts.js   # Ethers.js blockchain helpers
│   └── utils.js       # Tailwind class merger (cn)
├── store/             # Zustand state stores (to be populated)
├── hooks/             # Custom React hooks (to be populated)
├── public/            # Static assets (images, fonts)
├── tailwind.config.js # Tailwind + Shadcn/ui configuration
├── next.config.js     # Next.js configuration
├── postcss.config.js  # PostCSS for Tailwind processing
├── jsconfig.json      # Path aliases (@/*)
├── package.json       # Dependencies
└── README.md          # Frontend documentation
```

**Key Files Explained**:

**`app/layout.jsx`** - Root layout component
- Wraps entire application
- Loads Inter font from Google Fonts
- Sets metadata (title, description)
- Entry point for global providers (Privy, etc.)

**`app/page.jsx`** - Homepage component
- Landing page with hero section
- "Browse Events" and "Create Event" CTAs
- Uses Tailwind for styling

**`app/globals.css`** - Global styles
- Tailwind directives (@tailwind base, components, utilities)
- CSS variables for Shadcn/ui theming (light/dark mode)
- Custom color scheme using HSL values

**`lib/api.js`** - HTTP client for backend API
- Axios instance with base URL
- Request interceptor: Auto-inject Bearer token from localStorage
- Response interceptor: Handle 401 (token expiry), clear auth
- All API endpoints pre-defined: events, tickets, users, auth
- Error handling and token management

**`lib/contracts.js`** - Blockchain interaction utilities
- Contract addresses (Ticketify, PYUSD) from env
- Provider and signer helpers
- Contract instance getters
- PYUSD helpers: formatPYUSD/parsePYUSD (6 decimals)
- Chain ID: 11155111 (Sepolia)
- ABI placeholders (to be populated after deployment)

**`lib/utils.js`** - Utility functions
- `cn()` function for merging Tailwind classes
- Uses clsx and tailwind-merge

**`tailwind.config.js`** - Tailwind configuration
- Shadcn/ui design tokens
- CSS variable-based theming
- Dark mode support (class-based)
- Custom colors, border radius, animations
- Responsive breakpoints
- Content paths for all component files

**`next.config.js`** - Next.js configuration
- React strict mode enabled
- Image optimization domains
- Environment variable exposure
- Remote image patterns

**`jsconfig.json`** - JavaScript configuration
- Path alias: `@/*` maps to project root
- Enables cleaner imports: `@/components/Button`

**Environment Variables** (see `env.local.template`):
- API: NEXT_PUBLIC_API_URL
- Contracts: NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_PYUSD_ADDRESS
- Network: NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_NETWORK_NAME
- Auth: NEXT_PUBLIC_PRIVY_APP_ID
- Explorer: NEXT_PUBLIC_ETHERSCAN_URL

---

### `/server` - Backend API

**Technology**: Node.js 22.21.0 with Express.js

**Purpose**: RESTful API server handling business logic, database operations, and external service integrations.

**Key Responsibilities**:
- User authentication (JWT)
- Event CRUD operations
- Ticket management
- Google Calendar integration
- Email notifications (SendGrid)
- Blockchain event listening

**Database**: MongoDB with Mongoose ODM  
**Authentication**: Bearer tokens (JWT, 7-day expiry)

**Directory Structure**:
```
server/
├── routes/          # API route definitions (ready for routes)
├── controllers/     # Request handlers (ready for controllers)
├── models/          # Mongoose schemas (ready for models)
├── middleware/      # Auth, validation, error handling (ready)
├── utils/           # Helper functions
│   ├── db.js               # MongoDB connection utility
│   └── multerConfig.js     # Image upload configuration
├── uploads/         # Image storage directory
├── logs/            # Application logs directory
├── server.js        # Main entry point
├── package.json     # Dependencies and scripts
├── env.template     # Environment variables template
└── README.md        # Backend documentation
```

**Key Files Explained**:

**`server.js`** - Main application entry point
- Express app initialization
- CORS configuration for frontend
- JSON and URL-encoded body parsing
- Health check endpoint at `/health`
- Error handling middleware
- Database connection and server startup

**`utils/db.js`** - MongoDB connection manager
- Mongoose connection with retry logic
- Connection event listeners (error, disconnect)
- Graceful shutdown on SIGINT
- Connection pooling configuration
- Timeout settings (5s server selection, 45s socket)

**`utils/multerConfig.js`** - File upload configuration
- Memory storage for base64 conversion
- 8MB file size limit
- File type filtering (JPEG, PNG, WebP only)
- Error handling for invalid files
- Used for event banner image uploads

**Environment Variables** (see `env.template`):
- Server: PORT, NODE_ENV
- Database: MONGODB_URI
- Auth: JWT_SECRET, JWT_EXPIRATION
- Google: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
- Email: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
- Blockchain: SEPOLIA_RPC_URL, CONTRACT_ADDRESS, PYUSD_ADDRESS
- CORS: FRONTEND_URL
- Upload: MAX_FILE_SIZE

---

### `/contracts` - Smart Contracts

**Technology**: Solidity 0.8.x with Hardhat 2.26.3

**Purpose**: Immutable blockchain contracts for ticket sales and revenue distribution.

**Directory Structure**:
```
contracts/
├── contracts/           # Solidity smart contracts
│   └── Lock.sol        # Sample contract (will be replaced)
├── scripts/            # Deployment scripts
├── test/               # Contract test suites (TypeScript)
│   └── Lock.ts
├── ignition/           # Hardhat Ignition deployment modules
│   └── modules/
├── hardhat.config.ts   # Hardhat configuration
├── package.json        # Dependencies
├── .env.example        # Environment variables template
└── tsconfig.json       # TypeScript configuration
```

**Key Contracts**:
- `Ticketify.sol` - Main contract (createEvent ✅, purchaseTicket ✅, withdrawals ✅, view functions in progress)
- `IPYUSD.sol` - ERC-20 interface for PYUSD token ✅

**Dependencies**:
- `hardhat` v2.26.3 - Development environment
- `@openzeppelin/contracts` v5.4.0 - Secure, audited contract library
- `@nomicfoundation/hardhat-toolbox-viem` v4.1.0 - Toolbox with Viem integration

**Network**: Ethereum Sepolia (Chain ID: 11155111)  
**Token**: PYUSD at `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

**Configuration Notes**:
- Uses TypeScript for tests and scripts (allowed per project rules)
- Viem library used instead of Ethers.js (Hardhat toolbox default)
- Solidity compiler optimization enabled for gas efficiency

**Smart Contract Files Explained**:

**`contracts/interfaces/IPYUSD.sol`** - PYUSD Token Interface
- ERC-20 interface for interacting with PYUSD stablecoin
- **Critical: PYUSD uses 6 decimals** (not the standard 18)
- Defines standard ERC-20 functions: transfer, transferFrom, approve, balanceOf, allowance
- Used by Ticketify contract to handle PYUSD payments
- Includes comprehensive NatSpec documentation for 6-decimal handling
- Example conversion: 10.50 PYUSD (display) = 10,500,000 (contract value)
- Follows EIP-20 standard exactly
- Events: Transfer and Approval for tracking token movements
- View functions: totalSupply, decimals, name, symbol
- Sepolia testnet address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

**`contracts/Ticketify.sol`** - Main Ticketing Contract
- Core immutable smart contract for event and ticket management
- **Immutable design**: No proxy pattern, no upgrade mechanism (MVP requirement)
- Inherits OpenZeppelin Ownable for platform owner access control
- Inherits ReentrancyGuard for protection against reentrancy attacks on withdrawals
- Imports IPYUSD interface for PYUSD token operations

**Contract Architecture**:
- **Platform Fee**: 2.5% (250 basis points) on all ticket sales
- **Fee Collection**: Accumulated fees stored in contract, withdrawn by platform owner
- **Event ID**: Auto-incrementing counter starting at 0
- **One Ticket Rule**: Enforced via `hasPurchasedTicket` mapping (one per wallet per event)

**Data Structures**:
- **Event Struct**: 8 fields tracking event details (id, organizer, price, capacity, time, status, sales, withdrawal status)
- **Ticket Struct**: 3 fields tracking purchase (eventId, buyer, timestamp)
- **Mappings**:
  - `events`: eventId → Event (main event storage)
  - `eventTickets`: eventId → Ticket[] (all tickets for an event)
  - `hasPurchasedTicket`: eventId → buyer → bool (prevents duplicate purchases)

**Security Features**:
- Immutable PYUSD token address (set once in constructor)
- ReentrancyGuard on all withdrawal functions (prevents reentrancy attacks)
- Ownable pattern for platform fee withdrawal (only owner can access)
- Input validation on constructor (non-zero PYUSD address)
- Comprehensive event logging for all state changes

**Event Emissions** (for backend listening):
- `EventCreated`: Logged when organizer creates new event
- `TicketPurchased`: Logged when buyer purchases ticket
- `RevenueWithdrawn`: Logged when organizer withdraws funds
- `PlatformFeesWithdrawn`: Logged when platform owner withdraws fees

**Business Logic**:
- Organizers can withdraw revenue anytime (no time restrictions)
- One wallet can only buy one ticket per event (strictly enforced)
- Platform automatically collects 2.5% fee on each ticket sale
- Refund functionality placeholder included for future implementation

**Functions Implemented**:

**`createEvent(price, maxAttendees, eventTime)`** - Event Creation ✅
- Anyone can create events (no restriction)
- Validates: price > 0, maxAttendees > 0, eventTime in future
- Auto-generates unique event ID (sequential counter)
- Sets caller (msg.sender) as organizer
- Initializes event: active=true, sold=0, withdrawn=false
- Emits `EventCreated` for backend sync
- Returns eventId for immediate frontend use
- Gas optimized: external visibility, no redundant storage

**`purchaseTicket(eventId)`** - Ticket Purchase with PYUSD ✅
- Single parameter: eventId to purchase for
- Validates 6 requirements: exists, active, not started, has capacity, not already purchased, transfer succeeds
- **Enforces one ticket per wallet per event** (core business rule)
- Calculates platform fee: 2.5% (250 basis points)
- Transfers PYUSD from buyer to contract via `transferFrom`
- Accumulates platform fee in `platformFeesAccumulated`
- Creates Ticket struct and stores in `eventTickets[eventId]` array
- Increments `ticketsSold` counter
- Marks purchase in `hasPurchasedTicket[eventId][buyer]` mapping
- Emits `TicketPurchased` for backend sync
- Protected by `nonReentrant` modifier against reentrancy attacks
- Uses `Event storage` reference for gas efficiency

**`withdrawRevenue(eventId)`** - Organizer Revenue Withdrawal ✅
- Single parameter: eventId to withdraw from
- Validates: caller is organizer, event exists, has sales, not already withdrawn
- **No time restrictions** - organizers can withdraw anytime (core business rule)
- Calculates organizer share: (price - 2.5% fee) × tickets sold
- Marks hasWithdrawn = true to prevent double withdrawal
- Transfers PYUSD from contract to organizer
- Emits `RevenueWithdrawn` for backend sync
- Protected by `nonReentrant` modifier
- Uses `Event storage` reference for gas efficiency
- Example: 10 tickets at 10.50 PYUSD → organizer gets 102.375 PYUSD

**`withdrawPlatformFees()`** - Platform Fee Collection ✅
- No parameters - withdraws all accumulated fees
- Validates: caller is owner (onlyOwner), fees available
- Resets `platformFeesAccumulated` to 0 after withdrawal
- Transfers PYUSD from contract to platform owner
- Emits `PlatformFeesWithdrawn` for tracking
- Protected by `nonReentrant` and `onlyOwner` modifiers
- Platform owner should periodically call this function

**Platform Fee Flow**:
- 2.5% of each ticket sale goes to platform
- Accumulated in contract as `platformFeesAccumulated`
- Example: 10.50 PYUSD ticket → 0.2625 PYUSD platform fee
- Organizer receives: ticket price - platform fee (via withdrawRevenue)
- Platform owner withdraws all fees at once (via withdrawPlatformFees)

**View Functions Implemented** (Step 2.6) ✅:

**`getEvent(eventId)`** - Query Event Details
- Returns complete Event struct with all 8 fields
- No gas cost when called externally (view function)
- Returns default values if event doesn't exist
- Frontend should check `organizer != address(0)` to verify existence
- Used to display event information on event detail pages
- Return type: Event struct (id, organizer, price, maxAttendees, eventTime, isActive, ticketsSold, hasWithdrawn)

**`getTicketsSold(eventId)`** - Get Ticket Count
- Returns number of tickets sold for an event
- Returns 0 if event doesn't exist
- O(1) constant time operation
- Used to calculate spots remaining: `maxAttendees - ticketsSold`
- More efficient than calling `getEventTickets().length`

**`hasUserPurchasedTicket(eventId, user)`** - Check Purchase Status
- Returns boolean: true if user purchased, false otherwise
- Used by frontend to prevent duplicate purchases
- Enforces one ticket per wallet per event rule
- Check before showing "Buy Ticket" button
- Example: `bool canBuy = !hasUserPurchasedTicket(eventId, walletAddress)`

**`getEventRevenue(eventId)`** - Calculate Organizer Revenue
- Returns total withdrawable amount for organizer (after 2.5% platform fee)
- Returns 0 if no tickets sold
- Calculation: (price - platform fee) × tickets sold
- Example: 10 tickets × 10.50 PYUSD → 102.375 PYUSD organizer revenue
- Used in dashboard to show expected withdrawal amount
- Matches withdrawRevenue() calculation exactly

**`getPlatformFees()`** - Get Accumulated Platform Fees
- Returns total platform fees available for withdrawal
- Accumulates 2.5% from all ticket sales
- Only contract owner can withdraw (via withdrawPlatformFees())
- Used by platform admin to track revenue

**`getEventTickets(eventId)`** - Get All Tickets for Event
- Returns array of Ticket structs (eventId, buyer, purchaseTime)
- Returns empty array if no tickets
- Gas cost scales with ticket count (O(n))
- Use sparingly for events with many tickets
- Used by organizers to view attendee list
- Consider pagination for large events

**`getEventCounter()`** - Get Total Events Created
- Returns current event counter
- Next event will have ID = eventCounter
- Total events = eventCounter (IDs start at 0)
- Used for analytics and event enumeration

**View Function Characteristics**:
- All functions use `external view` modifier
- No gas cost when called externally (read-only)
- Safe to call with invalid IDs (returns defaults, doesn't revert)
- Comprehensive NatSpec documentation
- Optimized for frontend integration

**Integration Points**:
- Backend listens to `EventCreated` → creates MongoDB + Google Calendar event
- Backend listens to `TicketPurchased` → updates ticket status + adds to calendar
- Backend listens to `RevenueWithdrawn` → updates organizer balance display
- Backend listens to `PlatformFeesWithdrawn` → tracks platform revenue
- Frontend: User approves PYUSD → calls `purchaseTicket()` → confirmation
- Frontend: Organizer dashboard shows "Withdraw" button → calls `withdrawRevenue()`
- Frontend must call PYUSD `approve()` before `purchaseTicket()`
- Frontend uses view functions to display real-time event data
- All PYUSD amounts use 6 decimals (UI converts 2 decimals → 6 decimals)
- Constructor requires PYUSD Sepolia address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

---

## Data Flow

```
User → Frontend (client/) → Backend API (server/) → MongoDB
                          ↓                        ↓
                    Smart Contract ← Blockchain Events
                    (contracts/)
```

### Event Creation Flow:
1. Organizer creates event via frontend
2. Frontend calls smart contract to create on-chain event
3. Backend stores event metadata in MongoDB
4. Backend creates Google Calendar event with Meet link
5. Event appears on platform

### Ticket Purchase Flow:
1. Buyer purchases via frontend
2. Frontend approves PYUSD spending
3. Smart contract processes payment
4. Backend verifies transaction
5. Backend adds buyer to Google Calendar
6. Backend sends confirmation email

---

## File Purpose Summary

### Current Files

**Root Level**:
- `README.md` - Project overview
- `package.json` - Monorepo workspace configuration
- `.gitignore` - Root-level git ignore rules

**Client Directory** (Frontend Application):
- `app/layout.jsx` - Root layout, Inter font, metadata
- `app/page.jsx` - Homepage with welcome UI
- `app/globals.css` - Tailwind + CSS variables for theming
- `lib/api.js` - Axios client with auth interceptors, all endpoints
- `lib/contracts.js` - Ethers.js helpers, PYUSD 6-decimal handling
- `lib/utils.js` - cn() utility for Tailwind class merging
- `tailwind.config.js` - Shadcn/ui theme configuration
- `next.config.js` - Next.js settings, env vars
- `postcss.config.js` - PostCSS for Tailwind
- `jsconfig.json` - Path aliases (@/*)
- `package.json` - All dependencies (Next 14, React, Tailwind, Zustand, Privy, Ethers, etc.)
- `env.local.template` - Environment variables (copy to .env.local)
- `README.md` - Frontend setup documentation
- `.gitignore` - Next.js ignores (.next/, .env*, node_modules)
- `components/` - React components (to be populated)
- `store/` - Zustand stores (to be populated)
- `hooks/` - Custom hooks (to be populated)
- `public/` - Static assets

**Server Directory**:
- `.gitignore` - Backend ignores (node_modules, .env, logs/, uploads/)

**Contracts Directory**:
- `.gitignore` - Hardhat ignores (artifacts, cache, .env)
- `hardhat.config.ts` - TypeScript configuration for Hardhat with Sepolia network setup
- `package.json` - Dependencies including OpenZeppelin contracts v5.4.0
- `.env.example` - Template for environment variables (RPC URLs, private keys, PYUSD address)
- `contracts/` - Solidity source files
  - `Lock.sol` - Sample contract from Hardhat init (to be removed)
  - `Ticketify.sol` - Main ticketing contract (immutable, with structs and state variables)
  - `interfaces/` - Interface definitions
    - `IPYUSD.sol` - ERC-20 interface for PYUSD token (6 decimals)
- `scripts/` - Deployment scripts (to be created)
- `test/` - Contract test suites (TypeScript with Viem)
  - `Lock.ts` - Sample test file (to be replaced with Ticketify.test.ts)
- `ignition/modules/` - Hardhat Ignition deployment modules

**Server Directory** (Backend API):
- `server.js` - Main entry point, Express app configuration, health endpoint
- `package.json` - Dependencies (express, mongoose, jwt, multer, ethers, googleapis, sendgrid)
- `env.template` - Environment variables template (copy to .env)
- `README.md` - Backend setup and documentation
- `utils/db.js` - MongoDB connection with Mongoose, graceful shutdown
- `utils/multerConfig.js` - Image upload config (8MB limit, JPEG/PNG/WebP)
- `routes/` - API route definitions (to be populated)
- `controllers/` - Request handlers (to be populated)
- `models/` - Mongoose schemas (to be populated)
- `middleware/` - Auth and validation (to be populated)
- `uploads/` - Image storage directory
- `logs/` - Application logs directory

**Docs Directory**:
- `implementation-plan.md` - Step-by-step development guide
- `database-spec.md` - MongoDB schemas
- `api-spec.md` - REST API documentation
- `environment-setup.md` - Setup instructions
- `design-doc.md` - Product requirements
- `progress.md` - Implementation tracking
- `architecture.md` - This file

---

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 14.0.0 |
| UI Library | Shadcn/ui + Tailwind | Latest |
| State Management | Zustand | ^4.4.0 |
| Wallet Auth | Privy | ^1.0.0 |
| Backend | Node.js + Express | 22.21.0 |
| Database | MongoDB + Mongoose | ^8.0.0 |
| Smart Contracts | Solidity + Hardhat | 0.8.20 / ^3.0.0 |
| Blockchain Library | Ethers.js | ^6.8.0 |
| Email Service | SendGrid | ^7.7.0 |
| Calendar API | Google Calendar | v3 |

---

## Design Principles

1. **Monorepo Structure**: All components in one repository for easier development
2. **Clear Separation**: Frontend, backend, and contracts are independent
3. **Shared Documentation**: All specs in `/docs` folder
4. **Environment Isolation**: Each component has own `.env` file
5. **Immutable Contracts**: Smart contracts cannot be upgraded (MVP)

---

## Smart Contract Environment Details

### Hardhat Configuration

**File**: `contracts/hardhat.config.ts`

The Hardhat configuration uses TypeScript and includes:
- Solidity compiler settings with optimization enabled
- Sepolia testnet configuration (requires RPC URL and private key)
- Etherscan integration for contract verification
- Viem toolbox for testing and deployment

### Environment Variables

**File**: `contracts/.env.example`

Required environment variables for smart contract deployment:
```
SEPOLIA_RPC_URL - Alchemy or Infura RPC endpoint for Sepolia testnet
PRIVATE_KEY - Deployer wallet private key (without 0x prefix)
ETHERSCAN_API_KEY - For contract verification on Etherscan
PYUSD_ADDRESS - PYUSD token contract address on Sepolia
```

### Dependencies

**OpenZeppelin Contracts** (v5.4.0):
- Provides secure, audited implementations of ERC-20 interfaces
- Used for PYUSD token interactions
- Includes access control patterns (Ownable, ReentrancyGuard)

---

---

## Database

### MongoDB Atlas

**Connection**: MongoDB with Mongoose ODM  
**Database Name**: ticketify  
**Environment**: Development (free tier M0)

**Configuration**:
- Connection utility: `server/utils/db.js`
- Connection string: Configured via `MONGODB_URI` environment variable
- Retry writes: Enabled
- Write concern: Majority
- Timeouts: 5s server selection, 45s socket

**Connection Features**:
- Automatic reconnection on failure
- Event listeners (error, disconnect)
- Graceful shutdown (SIGINT handling)
- Connection status logging

**Collections** (to be created in Phase 3):
- `users` - User accounts and Google Calendar tokens
- `events` - Event metadata and Google Meet links
- `tickets` - Ticket purchases with three-state flow

**Indexes** (defined in schemas, to be implemented):
- User: walletAddress, email
- Event: contractEventId, owner, dateTime, isActive
- Ticket: (event + buyerWalletAddress) compound unique

See [database-spec.md](./database-spec.md) for complete schema definitions.

---

**Status**: Phase 2 In Progress - Smart Contract Development  
- Phase 1 Complete: All infrastructure ready (Steps 1.1-1.5) ✅  
- Phase 2.1 Complete: IPYUSD interface created and tested ✅  
- Phase 2.2 Complete: Ticketify main contract skeleton implemented ✅  
- Phase 2.3 Complete: createEvent function implemented ✅  
- Phase 2.4 Complete: purchaseTicket function implemented ✅  
- Phase 2.5 Complete: Withdrawal functions implemented ✅  
- Phase 2.6 Complete: View functions implemented (7 functions) ✅  
**Next**: Step 2.7 - Write Comprehensive Tests

