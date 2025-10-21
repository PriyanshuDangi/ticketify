# Ticketify Implementation Plan

**Version**: 1.0  
**Target**: ETHOnline 2025 MVP  
**Timeline**: 2 weeks  
**Focus**: Base product functionality

---

## Overview

This implementation plan breaks down the Ticketify MVP into small, testable steps. Each step includes validation criteria to ensure correct implementation before moving forward.

**Core MVP Features:**
- Event creation with Google Calendar integration
- PYUSD ticket purchasing via smart contract
- Automatic attendee addition to Google Meet
- Basic organizer dashboard
- Email notifications

**📚 Reference Documents**:
- **[Database Schema](./database-spec.md)** - Complete Mongoose models, indexes, and relationships
- **[API Specification](./api-spec.md)** - All REST endpoints, request/response formats, and error codes
- **[Environment Setup](./environment-setup.md)** - Step-by-step setup guide for all services
- **[Design Document](./design-doc.md)** - Product requirements and architecture
- **[Architecture](./architecture.md)** - System architecture and data flow (to be populated)

**Technology Specifications:**
- **Node.js**: 20.12.2
- **Database**: MongoDB with Mongoose ODM
- **Image Upload**: Multer (8MB limit, base64 storage)
- **Email Service**: SendGrid
- **Testing**: Jest for unit tests, Hardhat for smart contracts
- **Timezone**: Store UTC in database, display in user timezone using Moment.js
- **PYUSD**: 6 decimals (display max 2 decimals in UI)
- **Authentication**: Bearer token with wallet signature verification
- **Network**: Ethereum Sepolia (auto-switch if user on wrong network)

**Key Business Rules & Constraints:**
- ✅ **One Ticket Per Event**: One wallet can only purchase one ticket per event
- ✅ **One Wallet Per Account**: Strict 1:1 wallet-to-account mapping (no transfers in MVP)
- ✅ **Withdrawal Anytime**: Organizers can withdraw revenue at any time (no restrictions)
- ✅ **Event Editing Rules**:
  - Before tickets sold: Can edit all fields
  - After tickets sold: Can only edit title, description, and image
  - Cannot edit: price, dateTime, maxAttendees after tickets sold
- ✅ **Event Deletion**: Not allowed once any tickets have been sold
- ✅ **No Refunds in MVP**: Placeholder added in contract for future implementation
- ✅ **Immutable Contract**: No upgrade mechanism (no proxy pattern for MVP)
- ✅ **JWT Expiration**: 7-day expiry, no refresh token (user must reconnect)
- ✅ **Gas Estimation**: Show estimated gas fees before all transactions
- ✅ **Demo Strategy**: Manual event creation, no seed data (keep it real)

---

## Phase 1: Project Setup & Infrastructure (Day 1)

**📖 Setup Guide**: Follow detailed instructions in [environment-setup.md](./environment-setup.md)

### 1.1 Initialize Project Structure

**Task**: Create the monorepo structure with three main directories.

**Steps**:
1. Create `client/` directory for Next.js frontend
2. Create `server/` directory for Node.js backend
3. Create `contracts/` directory for Solidity smart contracts
4. Create `.gitignore` files in each directory

**Test**: 
- All three directories exist
- Run `ls -la` and verify directory structure matches design

### 1.2 Setup Smart Contract Environment

**Task**: Initialize Hardhat 3 project for smart contract development.

**📖 Reference**: [environment-setup.md - Smart Contracts Setup](./environment-setup.md#smart-contracts-setup)

**Steps**:
1. Navigate to `contracts/` directory
2. Initialize npm project
3. Install Hardhat 3 as dev dependency
4. Install OpenZeppelin contracts for ERC-20 interfaces
5. Create `hardhat.config.js` with Sepolia testnet configuration
6. Create `contracts/`, `scripts/`, and `test/` subdirectories
7. Create `.env.example` with placeholder for private key and RPC URL

**Test**:
- Run `npx hardhat` - should show available tasks
- Verify `hardhat.config.js` exists with networks configured
- Confirm OpenZeppelin is listed in `package.json`

### 1.3 Setup Backend Server

**Task**: Initialize Express.js backend with MongoDB connection using Mongoose.

**📖 Reference**: [environment-setup.md - Backend Server Setup](./environment-setup.md#backend-server-setup)

**Steps**:
1. Navigate to `server/` directory
2. Initialize npm project with Node.js 20.12.2
3. Install dependencies: Express.js, Mongoose, dotenv, cors, nodemon, multer, bcrypt, jsonwebtoken
4. Create basic folder structure: `routes/`, `controllers/`, `models/`, `middleware/`, `utils/`, `uploads/`
5. Create `server.js` as entry point
6. Create `.env.example` with placeholders for MongoDB URI, port, JWT secret, and API keys
7. Configure Multer for image uploads with 8MB size limit

**Test**:
- Run `npm start` - server should start without errors
- Visit `http://localhost:PORT/health` - should return 200 OK (create basic health endpoint first)
- All required folders exist
- Node version check: `node -v` should show 20.12.2

### 1.4 Setup Frontend Application

**Task**: Initialize Next.js 14 project with required dependencies.

**📖 Reference**: [environment-setup.md - Frontend Application Setup](./environment-setup.md#frontend-application-setup)

**Steps**:
1. Navigate to `client/` directory
2. Create Next.js 14 project with App Router
3. Install Tailwind CSS and configure
4. Install Shadcn/ui CLI and initialize
5. Install Zustand for state management
6. Install Privy SDK for wallet authentication
7. Install ethers.js v6 for blockchain interactions
8. Install moment.js for timezone handling
9. Install axios for API calls
10. Create `.env.local.example` with placeholder environment variables

**Test**:
- Run `npm run dev` - Next.js dev server starts
- Visit `http://localhost:3000` - default page loads
- Tailwind CSS classes work (add test border to verify)
- All dependencies listed in `package.json`
- Moment.js imports correctly

### 1.5 Setup MongoDB Database

**Task**: Create MongoDB Atlas cluster and configure Mongoose connection.

**📖 Reference**: [environment-setup.md - MongoDB Atlas](./environment-setup.md#mongodb-atlas)

**Steps**:
1. Create MongoDB Atlas account (or use existing)
2. Create new cluster (free tier)
3. Whitelist IP addresses (or allow all for development)
4. Create database user with password
5. Get connection string
6. Add connection string to backend `.env` file
7. Create Mongoose connection utility in `server/utils/db.js`
8. Configure Mongoose options (strict mode, timestamps)

**Test**:
- Run connection test script - should connect successfully
- Check MongoDB Atlas dashboard - shows successful connection
- No connection errors in backend logs
- Mongoose connected event fires

---

## Phase 2: Smart Contract Development (Days 2-3)

### 2.1 Create PYUSD Interface

**Task**: Create interface for PYUSD token interactions.

**Steps**:
1. Create `contracts/interfaces/IPYUSD.sol`
2. Define standard ERC-20 interface methods (transfer, transferFrom, approve, balanceOf, allowance)
3. Add interface for PYUSD token at Sepolia address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

**Test**:
- Contract compiles without errors: `npx hardhat compile`
- No syntax errors in interface definition
- All standard ERC-20 methods included

### 2.2 Implement Ticketify Main Contract

**Task**: Create core immutable smart contract for event and ticket management.

**Steps**:
1. Create `contracts/Ticketify.sol`
2. Import OpenZeppelin's Ownable and ReentrancyGuard
3. Define contract state variables (events mapping, ticket purchases, platform fee)
4. Define Event struct (id, organizer, price, maxAttendees, eventTime, isActive, ticketsSold, hasWithdrawn)
5. Define Ticket struct (eventId, buyer, timestamp)
6. Add mapping to track if wallet has purchased ticket for event (buyer => eventId => bool)
7. Set platform fee to 250 basis points (2.5%)
8. Store PYUSD token address as immutable variable
9. **Contract is immutable** (no upgrade mechanism for MVP)

**Test**:
- Contract compiles: `npx hardhat compile`
- Check compiled artifacts exist in `artifacts/` directory
- No compilation warnings or errors
- Verify ReentrancyGuard imported for withdrawal protection

### 2.3 Implement createEvent Function

**Task**: Allow organizers to create events on-chain.

**Steps**:
1. Create `createEvent()` function with parameters: price, maxAttendees, eventTime
2. Validate eventTime is in future
3. Generate unique event ID (use counter)
4. Store event data in events mapping
5. Set caller as organizer
6. Emit `EventCreated` event with all details
7. Add access control - only event organizer can modify their event

**Test**:
- Write test in `test/Ticketify.test.js`
- Create event with valid parameters - transaction succeeds
- Verify event data stored correctly
- Check EventCreated event emitted with correct parameters
- Try creating event with past timestamp - should revert

### 2.4 Implement purchaseTicket Function

**Task**: Allow users to buy tickets with PYUSD (one ticket per wallet per event).

**Steps**:
1. Create `purchaseTicket()` function with parameter: eventId
2. Validate event exists and is active
3. Validate event has available capacity
4. Validate event hasn't started yet
5. **Validate buyer hasn't already purchased ticket for this event** (one per wallet)
6. Calculate platform fee (2.5% of ticket price)
7. Transfer PYUSD from buyer to contract using transferFrom
8. Store ticket purchase data (buyer address, event ID, timestamp)
9. Increment ticket count for event
10. Emit `TicketPurchased` event with buyer, eventId, price

**Test**:
- User approves PYUSD spending first
- Purchase ticket - transaction succeeds
- Verify ticket count increased
- Check PYUSD transferred to contract
- Verify TicketPurchased event emitted
- Try purchasing when sold out - should revert
- Try purchasing after event started - should revert
- **Try purchasing second ticket for same event with same wallet - should revert**

### 2.5 Implement Withdrawal Functions

**Task**: Allow organizers to withdraw ticket revenue anytime and add refund placeholder.

**Steps**:
1. Create `withdrawRevenue()` function with parameter: eventId
2. Validate caller is event organizer
3. **Allow withdrawal anytime** (no time restriction)
4. Calculate organizer's share (total tickets sold × price - platform fee per ticket)
5. Transfer PYUSD from contract to organizer
6. Mark event as withdrawn
7. Prevent double withdrawal
8. Emit `RevenueWithdrawn` event
9. Create `withdrawPlatformFees()` function for contract owner
10. Add Ownable pattern for platform fee withdrawal
11. **Add refund function placeholder** (commented out for future implementation)
    ```solidity
    // Future enhancement: refund functionality
    // function refundTicket(uint256 eventId) external { ... }
    ```

**Test**:
- Organizer withdraws immediately after first ticket sale - succeeds
- Organizer withdraws anytime - succeeds
- Verify correct PYUSD amount transferred (price - 2.5% fee) × tickets sold
- Try withdrawing twice - second attempt reverts
- Non-organizer tries to withdraw - reverts
- Platform owner withdraws accumulated fees - succeeds

### 2.6 Add View Functions

**Task**: Create read-only functions for querying contract data.

**Steps**:
1. Create `getEvent()` - returns event details by ID
2. Create `getTicketsSold()` - returns ticket count for event
3. Create `hasUserPurchasedTicket()` - returns boolean for user + event
4. Create `getEventRevenue()` - calculates total revenue for event
5. Create `getPlatformFees()` - returns accumulated platform fees

**Test**:
- Call each view function - returns expected data
- Query non-existent event - handles gracefully
- Check gas costs are minimal (view functions don't use gas)

### 2.7 Write Comprehensive Tests

**Task**: Create full test suite for smart contract using Hardhat.

**Steps**:
1. Set up test fixtures with mock PYUSD token (or use actual Sepolia PYUSD in tests)
2. Test event creation (valid and invalid cases)
3. Test ticket purchasing (valid and invalid cases)
4. Test withdrawal functions
5. Test access control (organizer-only functions)
6. Test edge cases (sold out, past events, zero values)
7. Test event emission for all functions
8. Test reentrancy protection using ReentrancyGuard pattern
9. Use Hardhat's time manipulation for testing event timing
10. Test PYUSD decimal handling (6 decimals)

**Test**:
- Run `npx hardhat test` - all tests pass
- Achieve >90% code coverage
- No failing tests
- All edge cases covered
- Gas usage is reasonable for all functions

### 2.8 Deploy to Sepolia Testnet

**Task**: Deploy smart contract to Sepolia for testing.

**Steps**:
1. Get Sepolia ETH from faucet for gas
2. Create deployment script in `scripts/deploy.js`
3. Add Sepolia RPC URL to `.env`
4. Add deployer private key to `.env`
5. Run deployment script
6. Save deployed contract address
7. Verify contract on Etherscan

**Test**:
- Deployment succeeds and returns contract address
- Contract visible on Sepolia Etherscan
- Can call view functions from Etherscan
- Contract source code verified and readable

---

## Phase 3: Backend API Development (Days 4-5)

### 3.1 Create Database Models

**Task**: Define Mongoose schemas for all data entities.

**📖 Reference**: See complete schemas in [database-spec.md](./database-spec.md)

**Steps**:
1. Create `models/User.js` with schema:
   ```javascript
   {
     email: { type: String, required: true, unique: true, trim: true, lowercase: true },
     walletAddress: { type: String, required: true, unique: true, index: true },
     name: { type: String, required: true, trim: true },
     isGoogleCalendarAdded: { type: Boolean, default: false },
     googleCalendar: {
       access_token: String,
       scope: { type: String, default: 'https://www.googleapis.com/auth/calendar' },
       token_type: { type: String, default: 'Bearer' },
       refresh_token: String,
       expiry_date: Date
     }
   }
   // with timestamps: true
   ```

2. Create `models/Event.js` with fields:
   - contractEventId: String (unique, indexed)
   - owner: ObjectId (ref: 'User', required)
   - title, description: String
   - imageUrl: String (base64 encoded)
   - dateTime: Date (stored as UTC)
   - duration: Number (in minutes)
   - price: Number
   - maxAttendees: Number
   - googleCalendarId: String
   - googleMeetLink: String
   - isActive: Boolean
   - Add timestamps

3. Create `models/Ticket.js` with fields:
   - event: ObjectId (ref: 'Event', required)
   - buyerWalletAddress: String (required, indexed)
   - buyerEmail: String (required)
   - transactionHash: String (unique)
   - status: String enum ['created', 'blockchain_added', 'calendar_added']
   - Add timestamps

4. Add compound indexes: (event + buyerWalletAddress) on Ticket model
5. Add validation rules for all required fields

**Test**:
- Import models in test file
- Create sample document for each model - succeeds
- Try creating document with missing required field - fails validation
- Query documents using indexed fields - fast response
- Check MongoDB Atlas - collections created with correct schemas
- Verify walletAddress is indexed and unique on User model

### 3.2 Setup Authentication Middleware

**Task**: Implement wallet-based authentication with Bearer token (no refresh token).

**Steps**:
1. Create `middleware/auth.js`
2. Implement JWT token generation after wallet signature verification
3. Verify `Authorization: Bearer <token>` header format
4. Decode JWT and extract wallet address
5. Verify user exists in database
6. Attach user object to request (req.user)
7. Handle authentication errors with proper status codes (401, 403)
8. Set token expiration to 7 days
9. **No refresh token mechanism** - user must reconnect wallet after expiry

**Token Flow**:
1. User connects wallet and signs message
2. Backend verifies signature and creates JWT (7-day expiry)
3. Frontend stores JWT and uses for all API calls
4. After 7 days, JWT expires and user must reconnect wallet

**Test**:
- Protected route without auth header - returns 401
- Protected route with invalid token - returns 403
- Protected route with valid token - proceeds to route handler
- Wallet address and user object correctly attached to request
- Expired token returns 401 with clear message "Token expired, please reconnect wallet"

### 3.3 Implement Google OAuth Integration

**Task**: Setup Google OAuth for calendar access with automatic token refresh.

**Steps**:
1. Create Google Cloud project and enable Calendar API
2. Create OAuth 2.0 credentials (client ID and secret)
3. Configure authorized redirect URIs
4. Install Google Auth library (`googleapis`)
5. Create `utils/googleAuth.js` with OAuth flow functions
6. Use scope: `https://www.googleapis.com/auth/calendar`
7. Implement token storage in User model (googleCalendar field)
8. Implement automatic token refresh when expired
9. Handle token refresh in middleware before calendar operations

**Test**:
- Visit OAuth authorization URL - redirects to Google consent screen
- Grant permissions - receives authorization code
- Exchange code for tokens - succeeds
- Tokens stored in database (googleCalendar field)
- Refresh expired token - gets new access token automatically
- Token refresh triggered when expiry_date is past

### 3.4 Implement Google Calendar Functions

**Task**: Create utility functions for Calendar API interactions.

**Steps**:
1. Create `utils/googleCalendar.js`
2. Implement `createEvent()` - creates calendar event with Meet link
3. Implement `addAttendee()` - adds email to existing calendar event
4. Implement `removeAttendee()` - removes email from calendar event
5. Implement `getEvent()` - retrieves calendar event details
6. Configure calendar event privacy settings (guests cannot see other guests)
7. Add error handling for API rate limits
8. Add retry logic with exponential backoff

**Test**:
- Create calendar event - succeeds, returns event ID and Meet link
- Add attendee to event - succeeds, attendee receives email
- Check Google Calendar - event exists with Meet link
- Verify privacy settings - guests cannot see other guests
- Remove attendee - succeeds, removed from calendar
- Handle rate limit - retries successfully

### 3.5 Create Events API Routes

**Task**: Implement RESTful endpoints for event management with pagination.

**📖 Reference**: See complete API specs in [api-spec.md](./api-spec.md#events-api)

**Steps**:
1. Create `routes/events.js`
2. POST `/api/events` - Create new event
   - Require Bearer token authentication
   - Validate request body (title, description, dateTime, duration, price, maxAttendees)
   - Accept image upload via Multer (max 8MB, convert to base64)
   - Store dateTime as UTC in database
   - Create Google Calendar event with Meet link
   - Store event data in MongoDB
   - Return 201 with event details including Meet link
3. GET `/api/events` - List all active events
   - Support pagination (page, limit params)
   - Default: page=1, limit=20
   - Support filtering (upcoming only, price range, search by title)
   - Return sorted by dateTime ascending
   - Return format: `{ events: [], total: N, page: N, totalPages: N }`
4. GET `/api/events/:id` - Get single event details
   - Include tickets sold count
   - Include Meet link only for organizer or ticket holders
   - Populate owner information
5. PUT `/api/events/:id` - Update event
   - Require Bearer token
   - Only organizer can update
   - **If tickets sold**: Allow updating only title, description, image
   - **If no tickets sold**: Allow updating all fields including price, dateTime, maxAttendees
   - Sync changes with Google Calendar (if dateTime changed)
6. DELETE `/api/events/:id` - Cancel event
   - Require Bearer token
   - Only organizer can cancel
   - **Not allowed if any tickets have been sold**
   - If no tickets sold: Remove from Google Calendar and mark as deleted

**Test**:
- Create event with valid data - returns 201 with event details
- Create event without Bearer token - returns 401
- Create event with missing fields - returns 400
- Upload image >8MB - returns 413 (payload too large)
- Get events list with pagination - returns correct page
- Get events with page=2&limit=10 - returns correct results
- Get single event - returns correct details with owner populated
- Update event as non-organizer - returns 403
- Update event as organizer with no tickets sold - can update all fields
- Update event as organizer with tickets sold - can only update title/description/image
- Try updating price after tickets sold - returns 400
- Delete event with no tickets sold - succeeds
- Try deleting event with tickets sold - returns 400

### 3.6 Create Tickets API Routes

**Task**: Implement endpoints for ticket purchasing with three-state flow.

**📖 Reference**: See complete API specs in [api-spec.md](./api-spec.md#tickets-api)

**Steps**:
1. Create `routes/tickets.js`
2. POST `/api/tickets/purchase` - Initiate ticket purchase
   - Require Bearer token
   - Validate event exists and has capacity
   - Create ticket with status: 'created'
   - Return ticket ID and proceed to blockchain transaction
3. POST `/api/tickets/confirm` - Confirm blockchain transaction
   - Require Bearer token
   - Accept transaction hash
   - Verify transaction on blockchain (correct amount, event, buyer)
   - Update ticket status to 'blockchain_added'
   - Add buyer email to Google Calendar event
   - Update ticket status to 'calendar_added'
   - Send confirmation email
   - Return success with ticket details
4. GET `/api/tickets/my-tickets` - Get user's tickets
   - Require Bearer token
   - Return all tickets for authenticated wallet
   - Populate event details with owner information
   - Include Meet links for calendar_added tickets
   - Support pagination
5. GET `/api/tickets/event/:eventId` - Get tickets for event
   - Require Bearer token
   - Only event organizer can access
   - Return attendee list with emails and purchase status

**Ticket State Flow**:
- `created` → Created in DB, awaiting blockchain confirmation
- `blockchain_added` → Blockchain payment confirmed
- `calendar_added` → Successfully added to Google Calendar (final state)

**Test**:
- Purchase ticket - creates with 'created' status
- Confirm with valid transaction - updates to 'blockchain_added' then 'calendar_added'
- Verify blockchain transaction - confirms correct payment and event
- Check buyer added to Google Calendar - appears in attendee list
- Purchase with invalid transaction hash - fails at confirm step
- Get my tickets - returns only authenticated user's tickets
- Non-organizer tries to get event attendees - returns 403

### 3.7 Create Users API Routes

**Task**: Implement user profile and settings endpoints.

**Steps**:
1. Create `routes/users.js`
2. GET `/api/users/me` - Get current user profile
   - Require authentication
   - Return user data (wallet, email, connected services)
3. PUT `/api/users/me` - Update user profile
   - Update email
   - Return updated user data
4. POST `/api/users/connect-google` - Initiate Google OAuth
   - Return authorization URL
5. POST `/api/users/google-callback` - Handle OAuth callback
   - Exchange code for tokens
   - Store encrypted tokens
   - Return success status

**Test**:
- Get profile - returns user data
- Update email - persists change
- Connect Google - returns valid OAuth URL
- Complete OAuth flow - tokens stored successfully

### 3.8 Implement Email Notifications

**Task**: Setup SendGrid for ticket confirmations and updates.

**Steps**:
1. Create SendGrid account and get API key
2. Verify sender email address in SendGrid
3. Install SendGrid SDK (`@sendgrid/mail`)
4. Create `utils/email.js` with email templates
5. Implement `sendTicketConfirmation()` - sends ticket purchase email with calendar invite
6. Implement `sendEventUpdate()` - sends updates to all attendees
7. Create `.ics` file generator for calendar invites using `ics` library
8. Add email to ticket purchase flow (after calendar_added status)
9. Use HTML email templates with responsive design

**Test**:
- Purchase ticket - confirmation email received within 30 seconds
- Email contains correct event details with proper timezone display
- Calendar invite (.ics) attachment works
- Meet link in email is clickable
- Email deliverability >95%
- Email renders correctly in Gmail, Outlook, Apple Mail

### 3.9 Add Blockchain Event Listening

**Task**: Listen for smart contract events and sync with database.

**Steps**:
1. Create `utils/blockchainListener.js`
2. Setup ethers.js provider for Sepolia
3. Listen for `TicketPurchased` events
4. Listen for `EventCreated` events
5. Listen for `RevenueWithdrawn` events
6. Update database when events detected
7. Add error handling and reconnection logic
8. Run listener as background process

**Test**:
- Purchase ticket on blockchain - backend detects event within 30 seconds
- Database updated with transaction details
- Multiple simultaneous purchases - all detected
- Restart listener - catches up on missed events

---

## Phase 4: Frontend Development (Days 6-9)

### 4.1 Setup Layout and Navigation

**Task**: Create base layout with header and navigation.

**Steps**:
1. Create `app/layout.js` with global layout
2. Create `components/Header.jsx` with logo and navigation links
3. Add "Create Event" button (visible when wallet connected)
4. Add wallet connection button using Privy
5. Create `components/Footer.jsx` with basic links
6. Setup Tailwind CSS theme (colors, fonts, spacing)
7. Make layout responsive for mobile/tablet/desktop

**Test**:
- Visit homepage - header and footer render
- Click wallet button - Privy modal opens
- Connect wallet - button shows shortened address
- Disconnect wallet - button resets
- Resize browser - layout responds correctly
- Navigation links work

### 4.2 Configure Privy Authentication

**Task**: Setup Privy for wallet authentication with network switching.

**Steps**:
1. Create Privy account and get API key
2. Wrap app with Privy provider in `app/layout.js`
3. Configure supported wallets (MetaMask, WalletConnect, Coinbase Wallet)
4. Setup login methods (wallet only for MVP)
5. Configure default network: Ethereum Sepolia (chainId: 11155111)
6. Implement automatic network switching if user on wrong network
7. Create `hooks/useAuth.js` custom hook for auth state
8. Create `hooks/useNetworkSwitch.js` for network detection and switching

**Test**:
- Click "Connect Wallet" - modal opens
- Select MetaMask - connects successfully
- Check `useAuth()` hook - returns wallet address
- Connect on mainnet - automatically prompts to switch to Sepolia
- Disconnect - state updates correctly
- Refresh page - remains connected (session persists)
- Network switch succeeds and updates UI

### 4.3 Setup Zustand State Management

**Task**: Create global state stores for app data.

**Steps**:
1. Create `store/authStore.js` - wallet address, user profile
2. Create `store/eventsStore.js` - events list, selected event
3. Create `store/ticketsStore.js` - user's purchased tickets
4. Define actions for each store (set, update, clear)
5. Add persistence for auth state (localStorage)

**Test**:
- Connect wallet - authStore updates with address
- Fetch events - eventsStore populates
- Purchase ticket - ticketsStore updates
- Refresh page - auth state persists
- Clear state - all stores reset

### 4.4 Create API Client Utilities

**Task**: Setup axios/fetch wrappers for backend API calls.

**Steps**:
1. Create `lib/api.js` with base configuration
2. Set API base URL from environment variable
3. Create functions for each endpoint (getEvents, createEvent, purchaseTicket, etc.)
4. Add authentication headers automatically
5. Add request/response interceptors for error handling
6. Add loading state management
7. Create `lib/contracts.js` for smart contract interactions

**Test**:
- Call `getEvents()` - returns data from backend
- Authenticated request - includes auth header
- API error - shows user-friendly error message
- Network failure - shows retry option

### 4.5 Build Homepage

**Task**: Create landing page with event discovery.

**Steps**:
1. Create `app/page.jsx`
2. Add hero section with headline and "Create Event" CTA
3. Add featured events grid (fetch from API)
4. Create `components/EventCard.jsx` - displays event image, title, date, price, tickets remaining
5. Add search bar (functional for MVP)
6. Add basic filtering (upcoming events only)
7. Make responsive for all screen sizes
8. Add loading states and empty states

**Test**:
- Visit homepage - loads without errors
- Events display in grid
- Click event card - navigates to event details
- Search for event - filters results
- No events - shows "No events found" message
- Loading state shows while fetching

### 4.6 Build Event Details Page

**Task**: Create page showing full event information with timezone conversion.

**Steps**:
1. Create `app/events/[id]/page.jsx`
2. Fetch event details from API using dynamic route
3. Display full-width banner image (decode base64)
4. Show event title, description
5. Convert dateTime from UTC to user's local timezone using moment.js
6. Display formatted date/time (e.g., "Oct 25, 2025 at 3:00 PM EST")
7. Show duration in hours/minutes
8. Show price in PYUSD (max 2 decimal places) with USD equivalent
9. Show tickets remaining (X of Y sold)
10. Create "Buy Ticket" button (prominent, sticky on mobile)
11. Add organizer information section (name, wallet address)
12. Show Google Meet badge
13. Create `components/PurchaseModal.jsx` for ticket purchase flow

**Test**:
- Visit event page - details display correctly
- Date/time shows in user's local timezone
- Duration displays correctly (e.g., "2 hours")
- Price shows max 2 decimals (e.g., "10.50 PYUSD")
- Ticket count updates in real-time
- Click "Buy Ticket" - modal opens
- Event is sold out - button disabled
- Event has passed - shows "Event Ended"
- Mobile view - sticky button works

### 4.7 Build Ticket Purchase Flow

**Task**: Implement modal for PYUSD ticket purchase with proper decimal handling.

**Steps**:
1. Create `components/PurchaseModal.jsx`
2. Show event summary (name, date in user timezone, price)
3. Add email input field for Google Calendar invite (required)
4. Check PYUSD balance (convert from 6 decimals to display value)
5. Show approval step if allowance insufficient
   - Calculate exact amount or allow more for future purchases
   - Handle 6 decimal places internally
6. Show purchase confirmation step with gas estimate
7. **Show estimated gas fees** before transaction confirmation
8. Add three-state loading during transaction:
   - "Initiating purchase..." (creating ticket in DB)
   - "Confirming blockchain transaction..." (waiting for confirmation)
   - "Adding to calendar..." (calendar integration)
9. After blockchain confirmation, call `/api/tickets/confirm` with tx hash
10. Show success message with Meet link when status = 'calendar_added'
11. Add error handling with retry option and clear error messages
12. Update UI after successful purchase

**PYUSD Handling**:
- Display: Max 2 decimals (e.g., 10.50 PYUSD)
- Contract: Convert to 6 decimals (10.50 → 10500000)
- Balance check: Convert from 6 decimals for display

**Test**:
- Open purchase modal - shows event details with correct timezone
- Enter email - validates format (basic email regex)
- User has insufficient PYUSD - shows clear error message
- First purchase - shows approval step, then purchase step
- Approve exact amount or more - transaction succeeds
- Purchase ticket - creates with 'created' status
- Blockchain confirms - updates to 'blockchain_added'
- Calendar added - updates to 'calendar_added'
- Success - shows confirmation with Meet link
- Close modal - event page updates ticket count
- Handle errors at each state transition

### 4.8 Build Create Event Page

**Task**: Implement event creation wizard with image upload and timezone handling.

**Steps**:
1. Create `app/events/create/page.jsx`
2. Require wallet connection and Bearer token (redirect if not authenticated)
3. Check Google Calendar connection (prompt to connect if needed)
4. Create multi-step form with validation:
   - Step 1: Title (required), description (required), image upload
   - Step 2: Date, time (user's local timezone), duration (hours/minutes)
   - Step 3: Price in PYUSD (max 2 decimals input), max attendees
   - Step 4: Review and confirm
5. Create `components/ImageUpload.jsx` for banner upload:
   - Accept jpg, png, webp (max 8MB)
   - Show preview before upload
   - Convert to base64 for API submission
   - Show file size warning if >8MB
6. Convert selected date/time from user's local timezone to UTC before API call
7. Add live preview panel showing how event will appear
8. Validate all inputs before submission:
   - Date/time must be in future
   - Price must be positive with max 2 decimals
   - Max attendees must be positive integer
   - Image must be <8MB
9. Call smart contract to create event on-chain (convert price to 6 decimals)
10. Call backend API POST `/api/events` with all data including base64 image
11. Show success message with link to new event page
12. Clear form after successful creation

**Test**:
- Visit create page without wallet - redirects to home
- Visit with wallet but no Google - shows "Connect Google" prompt
- Fill form with invalid data - shows specific validation errors
- Upload image >8MB - shows error, prevents submission
- Upload valid image - preview appears correctly
- Select date in past - shows error
- Enter price with >2 decimals - rounds or shows error
- Complete form - preview updates in real-time
- Submit form - smart contract transaction initiated
- Transaction succeeds - backend API called with UTC datetime
- Google Calendar event created with correct timezone
- Redirects to new event page
- Event displays with correct date/time in viewer's timezone

### 4.9 Build Organizer Dashboard

**Task**: Create dashboard for event organizers to manage their events.

**Steps**:
1. Create `app/dashboard/page.jsx`
2. Require authentication (redirect if not connected)
3. Fetch user's created events from API
4. Create three tabs: Upcoming, Past, Drafts
5. Display events as cards with:
   - Banner image
   - Title and date
   - Tickets sold (25/50)
   - Revenue in PYUSD
   - Action buttons: View, Manage, Withdraw
6. Create `components/EventManagement.jsx` for event actions
7. Implement withdraw function (calls smart contract)
8. Show empty state if no events
9. Add "Create Event" button

**Test**:
- Visit dashboard without wallet - redirects
- Visit with wallet - shows user's events
- No events - shows "Create your first event"
- Events grouped correctly in tabs
- Click "Withdraw" - transaction initiated
- Withdrawal succeeds - balance updates
- Revenue displays correctly

### 4.10 Build My Tickets Page

**Task**: Create page for users to view their purchased tickets.

**Steps**:
1. Create `app/tickets/page.jsx`
2. Require authentication
3. Fetch user's tickets from API
4. Create two tabs: Upcoming, Past
5. Display tickets as cards with:
   - Event banner
   - Event title and date
   - Google Meet link (prominent button)
   - "Add to Calendar" button
6. Create `components/TicketCard.jsx`
7. Add calendar download functionality
8. Show countdown timer for upcoming events

**Test**:
- Visit tickets page without wallet - redirects
- Visit with wallet - shows purchased tickets
- No tickets - shows "No tickets yet"
- Click "Join Meeting" - opens Google Meet in new tab
- Click "Add to Calendar" - downloads .ics file
- Countdown shows correct time remaining

### 4.11 Add Error Handling and Loading States

**Task**: Implement consistent error and loading UX across app.

**Steps**:
1. Create `components/LoadingSpinner.jsx`
2. Create `components/ErrorMessage.jsx`
3. Create `components/EmptyState.jsx`
4. Add loading spinners to all async operations
5. Add error boundaries for page-level errors
6. Show user-friendly error messages
7. Add retry buttons for failed requests
8. Add toast notifications for success/error messages

**Test**:
- Fetch data - loading spinner appears
- API error - error message displays with retry button
- Retry - calls API again
- Success action - toast notification appears
- No data - empty state shows
- JavaScript error - error boundary catches it

### 4.12 Implement Smart Contract Integration

**Task**: Connect frontend to deployed smart contract.

**Steps**:
1. Add contract ABI to `lib/contracts/Ticketify.json`
2. Add contract address to environment variables
3. Create contract instance using ethers.js
4. Implement `createEvent()` contract call
5. Implement `purchaseTicket()` contract call
6. Implement `withdrawRevenue()` contract call
7. Add PYUSD token approval flow
8. Handle transaction states (pending, confirmed, failed)
9. **Show gas estimation before all transactions** (createEvent, purchaseTicket, withdrawRevenue)
10. Display estimated gas in user-friendly format (e.g., "Est. gas: 0.002 ETH")
11. Add transaction receipts display with Etherscan link

**Test**:
- Create event - shows gas estimate, calls contract, transaction succeeds
- Purchase ticket - shows gas estimate, approves PYUSD first, then purchases
- **Try purchasing same event twice with same wallet - transaction reverts**
- Withdraw revenue - shows gas estimate, calls contract, funds transferred
- Transaction pending - shows loading state with spinner
- Transaction failed - shows error with details
- Gas estimation fails - shows warning but allows proceed
- View transaction - links to Sepolia Etherscan

---

## Phase 5: Integration & Testing (Day 10)

### 5.1 End-to-End Event Creation Test

**Task**: Verify complete event creation flow works.

**Steps**:
1. Connect wallet on frontend
2. Connect Google account
3. Fill out event creation form
4. Submit and wait for transaction
5. Verify event created on blockchain (check Etherscan)
6. Verify event stored in MongoDB
7. Verify Google Calendar event created with Meet link
8. Verify event appears on homepage
9. Verify event page is accessible

**Test**:
- Complete flow executes without errors
- Event ID matches between smart contract and backend
- Google Calendar event has correct details
- Meet link is valid and accessible
- Event displays correctly on frontend
- All data synced across systems

### 5.2 End-to-End Ticket Purchase Test

**Task**: Verify complete ticket purchasing flow works.

**Steps**:
1. Connect different wallet (buyer account)
2. Get test PYUSD from faucet or swap
3. Navigate to event details page
4. Click "Buy Ticket"
5. Enter email address
6. Approve PYUSD spending (if first time)
7. Confirm purchase transaction
8. Wait for transaction confirmation
9. Verify ticket stored in database
10. Verify buyer added to Google Calendar event
11. Verify confirmation email sent
12. Check "My Tickets" page shows new ticket

**Test**:
- Purchase completes successfully
- PYUSD transferred from buyer to contract
- Platform fee calculated correctly
- Buyer appears in Google Calendar attendee list
- Email received with correct details
- Ticket appears in "My Tickets"
- Meet link is accessible to buyer

### 5.3 Test Google Meet Access Control

**Task**: Verify only ticket holders can join meeting.

**Steps**:
1. From buyer account, click Meet link in calendar
2. Verify automatic admission (no waiting room)
3. Try accessing Meet link from non-buyer account
4. Verify access denied or requires approval
5. Test organizer can always join
6. Test privacy settings (attendees can't see others)

**Test**:
- Ticket holder joins without waiting
- Non-ticket holder cannot join or must request
- Organizer has host controls
- Attendees list shows only yourself (privacy working)

### 5.4 Test Withdrawal Flow

**Task**: Verify organizers can withdraw funds.

**Steps**:
1. From organizer account, navigate to dashboard
2. Select event with ticket sales
3. Click "Withdraw"
4. Confirm transaction
5. Wait for confirmation
6. Verify PYUSD received in organizer wallet
7. Verify amount matches (ticket price × sold - 2.5% fee) × tickets
8. Verify cannot withdraw again

**Test**:
- Withdrawal transaction succeeds
- Correct PYUSD amount received
- Second withdrawal attempt fails
- Dashboard updates showing withdrawn status

### 5.5 Test Error Scenarios

**Task**: Verify error handling works correctly.

**Steps**:
1. Try purchasing sold-out event - should fail gracefully
2. Try purchasing after event started - should fail
3. Try purchasing with insufficient PYUSD - should show clear error
4. Try creating event with past date - should fail validation
5. Try withdrawing as non-organizer - should fail
6. Test with disconnected wallet - should prompt reconnection
7. Test with network errors - should show retry option

**Test**:
- Each error shows user-friendly message
- No console errors or crashes
- Retry options work correctly
- Form validations prevent bad submissions

### 5.6 Test Mobile Responsiveness

**Task**: Verify app works on mobile devices.

**Steps**:
1. Open app on mobile device or browser DevTools mobile view
2. Test all pages at various screen sizes (320px to 768px)
3. Verify touch targets are large enough (>44px)
4. Test wallet connection on mobile
5. Test event creation on mobile
6. Test ticket purchase on mobile
7. Test navigation and modals

**Test**:
- All pages render correctly on mobile
- No horizontal scrolling
- Buttons are easily tappable
- Forms are usable
- Modals display properly
- Wallet connection works on mobile wallet apps

### 5.7 Performance Testing

**Task**: Verify app performance meets standards.

**Steps**:
1. Test page load times (should be <3 seconds)
2. Test API response times (should be <500ms)
3. Test with slow network (throttle to 3G)
4. Test with multiple simultaneous ticket purchases
5. Test event list with 100+ events
6. Check bundle sizes (should be <500KB initial load)
7. Run Lighthouse audit

**Test**:
- Homepage loads in <3 seconds
- API responses under 500ms
- Works on 3G network (slower but functional)
- Multiple purchases process correctly
- Large lists paginate efficiently
- Lighthouse score >80 for performance

### 5.8 Security Testing

**Task**: Verify security measures are in place.

**Steps**:
1. Test Bearer token authentication on protected routes
2. Try accessing other user's dashboard - should fail
3. Try modifying other user's events - should fail
4. Test MongoDB injection attempts in API queries
5. Test XSS attempts in event descriptions
6. Verify environment variables not exposed in frontend
7. Verify Google OAuth tokens stored securely in database
8. Test JWT token expiration and refresh
9. Verify image upload size limits enforced
10. Test wallet signature verification

**Test**:
- Unauthorized access attempts fail (401)
- Protected routes require valid Bearer token
- Input validation prevents injection attacks
- Sensitive data (Google tokens) stored securely
- JWT expiration works correctly
- Image size limit enforced at API level
- Invalid signatures rejected

---

## Phase 6: Email & Notifications (Day 11)

### 6.1 Setup Email Templates

**Task**: Create HTML email templates for all notifications.

**Steps**:
1. Create template for ticket confirmation email
2. Create template for event reminder (24 hours before)
3. Create template for event update notifications
4. Create template for organizer notifications
5. Include event details, Meet link, calendar button
6. Make templates mobile-responsive
7. Test templates in multiple email clients

**Test**:
- Send test emails - render correctly
- Links are clickable
- Buttons work on mobile
- Templates display in Gmail, Outlook, Apple Mail
- Images load correctly

### 6.2 Implement Calendar Invite Generation

**Task**: Generate .ics files for calendar imports.

**Steps**:
1. Create `utils/icsGenerator.js`
2. Implement iCalendar format generator
3. Include event details, date/time, Meet link
4. Add reminder settings (24 hours, 1 hour before)
5. Attach to confirmation emails
6. Test with multiple calendar apps

**Test**:
- Download .ics file
- Import to Google Calendar - event appears correctly
- Import to Apple Calendar - event appears correctly
- Import to Outlook - event appears correctly
- Meet link clickable in all calendar apps

### 6.3 Add Ticket Confirmation Flow

**Task**: Send confirmation email after ticket purchase.

**Steps**:
1. Trigger email send after ticket stored in database
2. Include ticket details, event info, Meet link
3. Attach .ics calendar file
4. Add "Add to Calendar" button
5. Include transaction hash for verification
6. Add event organizer contact info (if available)
7. Send within 30 seconds of purchase

**Test**:
- Purchase ticket - email arrives within 30 seconds
- Email contains all required information
- Calendar file works
- Links are correct
- Email deliverability >98%

### 6.4 Add Event Reminder Notifications

**Task**: Send automated reminders before events.

**Steps**:
1. Create background job to check upcoming events
2. Send reminder 24 hours before event
3. Send reminder 1 hour before event
4. Include quick links to join Meet
5. Run job every 15 minutes
6. Prevent duplicate reminders
7. Only send to confirmed attendees

**Test**:
- Create test event 24 hours in future
- Wait for job to run - reminder email sent
- Check only once per event per attendee
- Email received at correct time

---

## Phase 7: Polish & Documentation (Day 12)

### 7.1 UI/UX Polish

**Task**: Improve visual design and user experience.

**Steps**:
1. Add smooth transitions and animations
2. Improve loading states (skeleton screens)
3. Add micro-interactions (button hover states, etc.)
4. Improve color contrast for accessibility
5. Add focus states for keyboard navigation
6. Improve error message clarity
7. Add success animations for completed actions
8. Polish mobile experience

**Test**:
- Interactions feel smooth
- Animations don't cause lag
- Keyboard navigation works
- WCAG AA color contrast compliance
- Mobile experience feels native

### 7.2 Add Metadata and SEO

**Task**: Optimize for search engines and social sharing.

**Steps**:
1. Add proper page titles for all pages
2. Add meta descriptions
3. Add Open Graph tags for social sharing
4. Add Twitter Card metadata
5. Create favicon and app icons
6. Add structured data for events
7. Create robots.txt and sitemap

**Test**:
- Share event link on Twitter - card displays correctly
- Share on Facebook - preview looks good
- Google search preview looks correct
- Favicon appears in browser tab

### 7.3 Write User Documentation

**Task**: Create help documentation for users.

**Steps**:
1. Write "How to Create an Event" guide
2. Write "How to Buy Tickets" guide
3. Write "How to Connect Google Calendar" guide
4. Write "How to Get PYUSD" guide
5. Create FAQ section
6. Add tooltips for complex features
7. Create video tutorial (optional)

**Test**:
- New user can follow guides successfully
- FAQ answers common questions
- Guides are clear and concise
- Screenshots are up to date

### 7.4 Create README and Setup Docs

**Task**: Document project setup for developers.

**Steps**:
1. Write comprehensive README.md
2. Document environment variables needed
3. Create setup instructions for each component
4. Document API endpoints
5. Document smart contract functions
6. Add troubleshooting section
7. Include deployment instructions

**Test**:
- New developer can set up project following README
- All environment variables documented
- API documentation is accurate
- Deployment steps work

### 7.5 Add Error Logging and Monitoring

**Task**: Implement logging for debugging and monitoring.

**Steps**:
1. Add error logging to backend (use Winston or similar)
2. Log all API requests with timestamps
3. Log smart contract interactions
4. Log email send attempts
5. Add basic monitoring dashboard (optional)
6. Set up error alerting for critical failures

**Test**:
- Trigger error - appears in logs
- Check log format is readable
- Logs include relevant context
- Can trace request flow through logs

---

## Phase 8: Deployment & Testing (Day 13)

### 8.1 Deploy Smart Contract to Sepolia

**Task**: Final deployment of audited contract to testnet.

**Steps**:
1. Review all smart contract tests pass
2. Run final security checks
3. Deploy to Sepolia using deployment script
4. Verify contract on Etherscan
5. Test all functions on deployed contract
6. Update frontend with new contract address
7. Document contract address and ABI

**Test**:
- Contract deployed successfully
- All functions work on live contract
- Contract verified on Etherscan
- Frontend connects to deployed contract

### 8.2 Deploy Backend to Production

**Task**: Deploy Node.js backend to hosting service.

**Steps**:
1. Choose hosting (Render, Railway, or Heroku)
2. Configure production environment variables
3. Set up MongoDB Atlas production database
4. Deploy backend service
5. Configure domain/subdomain (api.ticketify.xyz)
6. Test all API endpoints on production
7. Enable HTTPS and set up SSL certificate
8. Configure CORS for frontend domain

**Test**:
- API accessible at production URL
- All endpoints respond correctly
- HTTPS enabled
- CORS configured properly
- Database connections work
- Environment variables loaded

### 8.3 Deploy Frontend to Vercel

**Task**: Deploy Next.js frontend to production.

**Steps**:
1. Connect GitHub repository to Vercel
2. Configure build settings
3. Add environment variables (API URL, contract address, Privy key)
4. Configure custom domain (ticketify.xyz)
5. Deploy to production
6. Test all pages work correctly
7. Verify wallet connections work
8. Configure caching and CDN

**Test**:
- Site accessible at production domain
- All pages load correctly
- Wallet connection works
- Smart contract interactions work
- Images and assets load
- Performance is good (Lighthouse >80)

### 8.4 Configure Production Monitoring

**Task**: Set up monitoring and alerting for production.

**Steps**:
1. Set up uptime monitoring (UptimeRobot or similar)
2. Configure error tracking (Sentry or similar)
3. Set up log aggregation
4. Configure alerts for downtime
5. Set up performance monitoring
6. Create status page (optional)

**Test**:
- Monitor detects when site goes down
- Errors logged and reported correctly
- Alerts sent when issues occur
- Can view logs from all services

### 8.5 Production Testing

**Task**: Comprehensive testing on production environment.

**Steps**:
1. Test complete event creation flow on production
2. Test ticket purchase with real Sepolia PYUSD
3. Test Google Calendar integration
4. Test email delivery
5. Test on multiple devices and browsers
6. Test with multiple users simultaneously
7. Verify gas estimation is accurate
8. Check all links and navigation

**Test**:
- All flows work on production
- Emails delivered successfully
- Google Calendar events created
- No console errors
- Performance is acceptable
- Mobile experience is smooth

---

## Phase 9: Demo Preparation (Day 14)

### 9.1 Create Demo Accounts

**Task**: Set up accounts for demo presentation (manual event creation, no seed data).

**Steps**:
1. Create organizer wallet with Sepolia ETH (for gas)
2. Create buyer wallet(s) with PYUSD and Sepolia ETH
3. Connect Google account to organizer wallet
4. **Manually create 2-3 events during demo setup** (no automated seed data)
5. Have buyer wallet ready to purchase ticket during live demo
6. Prepare screenshots of key features
7. Test complete demo flow multiple times
8. Prepare backup demo in case of network issues

**Demo Strategy**:
- Keep it real with actual transactions
- Pre-create 1-2 events so homepage shows content
- Do live ticket purchase during demo
- Show actual Google Calendar integration
- Display real blockchain transactions on Etherscan

**Test**:
- Demo wallets have sufficient funds (at least 0.1 ETH + 50 PYUSD)
- Google account connected and calendar accessible
- Sample events display correctly on homepage
- Can complete full flow in <3 minutes
- All features accessible quickly
- Backup plan ready if primary demo fails

### 9.2 Record Demo Video

**Task**: Create 2-3 minute demo video for ETHGlobal submission.

**Steps**:
1. Write demo script (follow design doc demo scenario)
2. Practice demo flow multiple times
3. Record screen with audio narration
4. Show: Homepage → Create Event → Purchase Ticket → Dashboard
5. Highlight key features (automatic calendar, PYUSD payment, instant access)
6. Keep under 3 minutes
7. Edit video for clarity
8. Add captions (optional but recommended)
9. Export in high quality (1080p)

**Test**:
- Video is <3 minutes
- Audio is clear
- All key features demonstrated
- Flow is easy to follow
- Video quality is good

### 9.3 Create Presentation Materials

**Task**: Prepare supporting materials for ETHGlobal submission.

**Steps**:
1. Create project logo and branding
2. Design banner image for submission
3. Write clear project description
4. List technologies used
5. Highlight PYUSD integration
6. Prepare architecture diagram
7. Create screenshots of key features
8. Write "Challenges faced" section
9. Write "What we learned" section

**Test**:
- All materials look professional
- Description is clear and compelling
- Images are high quality
- Technical details are accurate

### 9.4 Prepare GitHub Repository

**Task**: Clean up and document code repository.

**Steps**:
1. Review all code for comments and clarity
2. Remove any test/debug code
3. Update README with complete instructions
4. Add LICENSE file (MIT)
5. Add CONTRIBUTING guidelines
6. Create .env.example files for all components
7. Ensure .gitignore excludes sensitive files
8. Add badges (build status, license, etc.)
9. Create GitHub release/tag for v1.0

**Test**:
- Repository is public and accessible
- README is comprehensive
- No sensitive data committed
- Code is well-organized
- Installation instructions work

### 9.5 Final Testing Checklist

**Task**: Complete final testing before submission.

**Steps**:
- [ ] Smart contract deployed and verified on Sepolia
- [ ] Backend API deployed and accessible
- [ ] Frontend deployed with custom domain
- [ ] Google Calendar integration working
- [ ] Email notifications sending
- [ ] Wallet connection working (MetaMask, WalletConnect)
- [ ] Event creation flow complete (on-chain + calendar)
- [ ] Ticket purchase flow complete (PYUSD payment)
- [ ] Automatic attendee addition working
- [ ] Organizer dashboard functional
- [ ] Withdrawal function working
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable (<3s page loads)
- [ ] Demo video ready
- [ ] GitHub repository ready
- [ ] Documentation complete

**Test**:
- Run through entire checklist
- Fix any issues found
- Verify all items checked

---

## Post-Submission (Optional Enhancements)

### 10.1 Add Event Discovery Features

**Task**: Improve event browsing experience.

**Steps**:
1. Add categories/tags for events
2. Implement search functionality
3. Add date range filtering
4. Add price range filtering
5. Implement sorting (date, price, popularity)
6. Add "Featured Events" section

### 10.2 Add Social Features

**Task**: Enable social sharing and engagement.

**Steps**:
1. Add "Share Event" button with social media links
2. Generate shareable event cards (OpenGraph images)
3. Add attendee count display
4. Add organizer profiles with ratings
5. Add event comments/questions section

### 10.3 Enhance Analytics

**Task**: Provide better insights for organizers.

**Steps**:
1. Add revenue charts (daily, weekly, monthly)
2. Add ticket sales graph over time
3. Add geographic data for attendees
4. Add conversion rate tracking
5. Export attendee data as CSV

### 10.4 Add Refund Functionality

**Task**: Allow ticket refunds before events.

**Steps**:
1. Add refund function to smart contract
2. Implement refund policy (e.g., before 24 hours)
3. Remove attendee from Google Calendar on refund
4. Send refund confirmation email
5. Update dashboard to show refunded tickets

---

## Success Criteria

The MVP is complete when:

✅ **Core Functionality**
- Organizers can create events with one click
- Events automatically create Google Calendar with Meet link
- Users can purchase tickets with PYUSD
- Buyers automatically added to Google Calendar
- Organizers can withdraw funds instantly

✅ **Technical Requirements**
- Smart contract deployed and verified on Sepolia
- Backend API running in production
- Frontend deployed with custom domain
- All integrations working (Google, PYUSD, Privy)
- No critical bugs

✅ **User Experience**
- Complete event creation in <2 minutes
- Purchase ticket in <1 minute (after wallet connected)
- Mobile responsive
- Clear error messages
- Smooth, intuitive flow

✅ **Documentation**
- Comprehensive README
- API documentation
- User guides
- Demo video (<3 minutes)

✅ **ETHGlobal Submission**
- Project submitted on ETHGlobal platform
- Demo video uploaded
- GitHub repository public
- All required fields completed

---

## Notes for Developers

### General Principles
- Test each step before moving to the next
- Commit code frequently with clear messages
- Use feature branches for development
- Write clean, commented code
- Follow security best practices
- Handle errors gracefully
- Validate all user inputs
- Use environment variables for configuration
- Keep it simple - avoid over-engineering

### Common Pitfalls to Avoid
- Don't store sensitive data in code or git
- Don't skip smart contract testing
- Don't expose API keys in frontend
- Don't skip input validation
- Don't assume transactions will succeed
- Don't forget mobile responsiveness
- Don't skip error handling
- Don't forget timezone conversions (UTC in DB, local for display)
- Don't forget PYUSD has 6 decimals (display max 2)
- Don't forget image size limit (8MB)

### Important Specifications to Remember
- **Node.js**: 20.12.2
- **Database**: Mongoose ODM
- **Authentication**: Bearer tokens (JWT, 7-day expiry, no refresh token)
- **PYUSD Decimals**: 6 (display max 2)
- **Image Storage**: Base64 in MongoDB (8MB limit)
- **Timezone**: UTC in database, convert to user's local using moment.js
- **Email**: SendGrid
- **Testing**: Jest for backend, Hardhat for contracts
- **Network**: Sepolia (auto-switch if wrong network)
- **Ticket States**: created → blockchain_added → calendar_added
- **One Wallet = One Account**: Strict 1:1 mapping, no wallet transfers in MVP
- **One Ticket Per Event**: One wallet can only buy one ticket per event
- **Withdrawal**: Organizers can withdraw anytime (no time restrictions)
- **Event Editing**: After tickets sold, only title/description/image can be updated
- **Event Deletion**: Not allowed once any tickets sold
- **Refunds**: Not in MVP (placeholder in contract for future)
- **Smart Contract**: Immutable (no proxy pattern for MVP)
- **Gas Estimation**: Show before all transactions

### When Stuck
1. Check documentation for the specific technology
2. Review error messages carefully
3. Test components in isolation
4. Ask for help with specific error details
5. Check similar examples in codebase

### Resources

**Project Documentation**:
- [Database Specification](./database-spec.md) - All MongoDB schemas and indexes
- [API Specification](./api-spec.md) - Complete REST API documentation
- [Environment Setup Guide](./environment-setup.md) - Setup instructions for all services
- [Design Document](./design-doc.md) - Product requirements and features

**External Documentation**:
- Google Calendar API: https://developers.google.com/calendar
- Privy Documentation: https://docs.privy.io
- Hardhat Documentation: https://hardhat.org
- Shadcn/ui Components: https://ui.shadcn.com
- PYUSD Information: https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd
- Mongoose Documentation: https://mongoosejs.com
- Moment.js Documentation: https://momentjs.com
- SendGrid Documentation: https://docs.sendgrid.com

---

## Environment Variables

**📖 Complete Reference**: See [environment-setup.md - Environment Variables Reference](./environment-setup.md#environment-variables-reference)

### Contracts (.env)
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

### Server (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ticketify
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@ticketify.xyz

# Blockchain
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=deployed_contract_address
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

**Document Version**: 1.1  
**Last Updated**: October 21, 2025  
**Status**: Ready for Implementation

