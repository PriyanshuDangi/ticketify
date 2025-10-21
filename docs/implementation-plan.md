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

---

## Phase 1: Project Setup & Infrastructure (Day 1)

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

**Task**: Initialize Express.js backend with MongoDB connection.

**Steps**:
1. Navigate to `server/` directory
2. Initialize npm project
3. Install Express.js, MongoDB driver, dotenv, cors, and nodemon
4. Create basic folder structure: `routes/`, `controllers/`, `models/`, `middleware/`, `utils/`
5. Create `server.js` as entry point
6. Create `.env.example` with placeholders for MongoDB URI, port, and API keys

**Test**:
- Run `npm start` - server should start without errors
- Visit `http://localhost:PORT/health` - should return 200 OK (create basic health endpoint first)
- All required folders exist

### 1.4 Setup Frontend Application

**Task**: Initialize Next.js 14 project with required dependencies.

**Steps**:
1. Navigate to `client/` directory
2. Create Next.js 14 project with App Router
3. Install Tailwind CSS and configure
4. Install Shadcn/ui CLI and initialize
5. Install Zustand for state management
6. Install Privy SDK for wallet authentication
7. Install ethers.js for blockchain interactions
8. Create `.env.local.example` with placeholder environment variables

**Test**:
- Run `npm run dev` - Next.js dev server starts
- Visit `http://localhost:3000` - default page loads
- Tailwind CSS classes work (add test border to verify)
- All dependencies listed in `package.json`

### 1.5 Setup MongoDB Database

**Task**: Create MongoDB Atlas cluster and configure connection.

**Steps**:
1. Create MongoDB Atlas account (or use existing)
2. Create new cluster (free tier)
3. Whitelist IP addresses (or allow all for development)
4. Create database user with password
5. Get connection string
6. Add connection string to backend `.env` file
7. Create basic connection utility in `server/utils/db.js`

**Test**:
- Run connection test script - should connect successfully
- Check MongoDB Atlas dashboard - shows successful connection
- No connection errors in backend logs

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

**Task**: Create core smart contract for event and ticket management.

**Steps**:
1. Create `contracts/Ticketify.sol`
2. Define contract state variables (events mapping, ticket purchases, platform fee)
3. Define Event struct (id, organizer, price, maxAttendees, eventTime, isActive)
4. Define Ticket struct (eventId, buyer, timestamp)
5. Set platform fee to 250 basis points (2.5%)
6. Store PYUSD token address as immutable variable

**Test**:
- Contract compiles: `npx hardhat compile`
- Check compiled artifacts exist in `artifacts/` directory
- No compilation warnings or errors

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

**Task**: Allow users to buy tickets with PYUSD.

**Steps**:
1. Create `purchaseTicket()` function with parameter: eventId
2. Validate event exists and is active
3. Validate event has available capacity
4. Validate event hasn't started yet
5. Calculate platform fee (2.5% of ticket price)
6. Transfer PYUSD from buyer to contract using transferFrom
7. Store ticket purchase data (buyer address, event ID, timestamp)
8. Increment ticket count for event
9. Emit `TicketPurchased` event with buyer, eventId, price

**Test**:
- User approves PYUSD spending first
- Purchase ticket - transaction succeeds
- Verify ticket count increased
- Check PYUSD transferred to contract
- Verify TicketPurchased event emitted
- Try purchasing when sold out - should revert
- Try purchasing after event started - should revert

### 2.5 Implement Withdrawal Functions

**Task**: Allow organizers to withdraw ticket revenue.

**Steps**:
1. Create `withdrawRevenue()` function with parameter: eventId
2. Validate caller is event organizer
3. Calculate organizer's share (total tickets sold × price - platform fee)
4. Transfer PYUSD from contract to organizer
5. Mark event as withdrawn
6. Prevent double withdrawal
7. Emit `RevenueWithdrawn` event
8. Create `withdrawPlatformFees()` function for contract owner
9. Add Ownable pattern for platform fee withdrawal

**Test**:
- Organizer withdraws after event - succeeds
- Verify correct PYUSD amount transferred
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

**Task**: Create full test suite for smart contract.

**Steps**:
1. Set up test fixtures with mock PYUSD token
2. Test event creation (valid and invalid cases)
3. Test ticket purchasing (valid and invalid cases)
4. Test withdrawal functions
5. Test access control (organizer-only functions)
6. Test edge cases (sold out, past events, zero values)
7. Test event emission for all functions
8. Test reentrancy protection

**Test**:
- Run `npx hardhat test` - all tests pass
- Achieve >90% code coverage
- No failing tests
- All edge cases covered

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

**Task**: Define MongoDB schemas for all data entities.

**Steps**:
1. Create `models/User.js` with fields: walletAddress, email, googleTokens (encrypted), createdAt
2. Create `models/Event.js` with fields: contractEventId, organizerWalletAddress, title, description, imageUrl, dateTime, timezone, price, maxAttendees, googleCalendarId, googleMeetLink, isActive, createdAt
3. Create `models/Ticket.js` with fields: eventId, buyerWalletAddress, buyerEmail, transactionHash, purchasedAt, googleCalendarEventStatus
4. Add indexes for efficient queries (walletAddress, contractEventId, eventId)
5. Add validation rules for required fields

**Test**:
- Import models in test file
- Create sample document for each model - succeeds
- Try creating document with missing required field - fails validation
- Query documents using indexed fields - fast response
- Check MongoDB Atlas - collections created with correct schemas

### 3.2 Setup Authentication Middleware

**Task**: Implement wallet-based authentication.

**Steps**:
1. Create `middleware/auth.js`
2. Implement signature verification using ethers.js
3. Verify signed message contains user's wallet address
4. Extract wallet address from verified signature
5. Attach wallet address to request object
6. Handle authentication errors with proper status codes

**Test**:
- Protected route without auth header - returns 401
- Protected route with invalid signature - returns 403
- Protected route with valid signature - proceeds to route handler
- Wallet address correctly attached to request

### 3.3 Implement Google OAuth Integration

**Task**: Setup Google OAuth for calendar access.

**Steps**:
1. Create Google Cloud project and enable Calendar API
2. Create OAuth 2.0 credentials (client ID and secret)
3. Configure authorized redirect URIs
4. Install Google Auth library
5. Create `utils/googleAuth.js` with OAuth flow functions
6. Implement token storage (encrypt tokens before saving to DB)
7. Implement token refresh logic

**Test**:
- Visit OAuth authorization URL - redirects to Google consent screen
- Grant permissions - receives authorization code
- Exchange code for tokens - succeeds
- Tokens stored in database encrypted
- Refresh expired token - gets new access token

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

**Task**: Implement RESTful endpoints for event management.

**Steps**:
1. Create `routes/events.js`
2. POST `/api/events` - Create new event
   - Validate request body (title, description, dateTime, price, maxAttendees)
   - Require authentication
   - Create Google Calendar event
   - Store event data in MongoDB with calendar IDs
   - Return event details including Meet link
3. GET `/api/events` - List all active events
   - Support pagination (skip, limit)
   - Support filtering (upcoming only, price range)
   - Return sorted by date
4. GET `/api/events/:id` - Get single event details
   - Include tickets sold count
   - Include Meet link only for organizer or ticket holders
5. PUT `/api/events/:id` - Update event
   - Only organizer can update
   - Sync changes with Google Calendar
6. DELETE `/api/events/:id` - Cancel event
   - Only organizer can cancel
   - Remove from Google Calendar
   - Refund logic (future enhancement placeholder)

**Test**:
- Create event with valid data - returns 201 with event details
- Create event without auth - returns 401
- Create event with missing fields - returns 400
- Get events list - returns paginated array
- Get single event - returns correct details
- Update event as non-organizer - returns 403
- Update event as organizer - succeeds

### 3.6 Create Tickets API Routes

**Task**: Implement endpoints for ticket purchasing and management.

**Steps**:
1. Create `routes/tickets.js`
2. POST `/api/tickets/purchase` - Record ticket purchase
   - Validate transaction hash on blockchain
   - Verify payment amount matches ticket price
   - Store ticket in database
   - Add buyer email to Google Calendar event
   - Return success with ticket details
3. GET `/api/tickets/my-tickets` - Get user's tickets
   - Require authentication
   - Return all tickets for authenticated wallet
   - Include event details and Meet links
4. GET `/api/tickets/event/:eventId` - Get tickets for event
   - Only organizer can access
   - Return attendee list with emails

**Test**:
- Purchase ticket with valid transaction - succeeds
- Verify blockchain transaction - confirms payment
- Check buyer added to Google Calendar - appears in attendee list
- Purchase with invalid transaction hash - fails
- Get my tickets - returns correct tickets only
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

**Task**: Setup email service for ticket confirmations and updates.

**Steps**:
1. Choose email provider (SendGrid or Resend)
2. Create account and get API key
3. Install email service SDK
4. Create `utils/email.js` with email templates
5. Implement `sendTicketConfirmation()` - sends ticket purchase email with calendar invite
6. Implement `sendEventUpdate()` - sends updates to all attendees
7. Create `.ics` file generator for calendar invites
8. Add email to ticket purchase flow

**Test**:
- Purchase ticket - confirmation email received
- Email contains correct event details
- Calendar invite (.ics) attachment works
- Meet link in email is clickable
- Email deliverability >95%

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

**Task**: Setup Privy for wallet authentication.

**Steps**:
1. Create Privy account and get API key
2. Wrap app with Privy provider in `app/layout.js`
3. Configure supported wallets (MetaMask, WalletConnect, Coinbase)
4. Setup login methods (wallet only for MVP)
5. Configure network settings (Ethereum Sepolia)
6. Create `hooks/useAuth.js` custom hook for auth state

**Test**:
- Click "Connect Wallet" - modal opens
- Select MetaMask - connects successfully
- Check `useAuth()` hook - returns wallet address
- Disconnect - state updates correctly
- Refresh page - remains connected (session persists)

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

**Task**: Create page showing full event information.

**Steps**:
1. Create `app/events/[id]/page.jsx`
2. Fetch event details from API using dynamic route
3. Display full-width banner image
4. Show event title, description, date/time with timezone
5. Show price in PYUSD with USD equivalent
6. Show tickets remaining (X of Y sold)
7. Create "Buy Ticket" button (prominent, sticky on mobile)
8. Add organizer information section
9. Show Google Meet badge
10. Create `components/PurchaseModal.jsx` for ticket purchase flow

**Test**:
- Visit event page - details display correctly
- Ticket count updates in real-time
- Click "Buy Ticket" - modal opens
- Event is sold out - button disabled
- Event has passed - shows "Event Ended"
- Mobile view - sticky button works

### 4.7 Build Ticket Purchase Flow

**Task**: Implement modal for PYUSD ticket purchase.

**Steps**:
1. Create `components/PurchaseModal.jsx`
2. Show event summary (name, date, price)
3. Add email input field for Google Calendar invite
4. Show PYUSD balance check
5. Show approval step if needed ("Approve PYUSD spending")
6. Show purchase confirmation step
7. Add loading states during transaction
8. Show success message with Meet link
9. Add error handling with retry option
10. Update UI after successful purchase

**Test**:
- Open purchase modal - shows event details
- Enter email - validates format
- User has no PYUSD - shows "Insufficient balance" message
- First purchase - shows two steps (approve + purchase)
- Subsequent purchase - shows one step (purchase only)
- Approve PYUSD - transaction succeeds
- Purchase ticket - transaction succeeds
- Success - shows confirmation with Meet link
- Close modal - event page updates ticket count

### 4.8 Build Create Event Page

**Task**: Implement event creation wizard for organizers.

**Steps**:
1. Create `app/events/create/page.jsx`
2. Require wallet connection (redirect if not connected)
3. Check Google Calendar connection (prompt to connect if needed)
4. Create multi-step form with validation:
   - Step 1: Title, description, image upload
   - Step 2: Date, time, timezone picker
   - Step 3: Price (PYUSD), max attendees
   - Step 4: Review and confirm
5. Create `components/ImageUpload.jsx` for banner upload
6. Add live preview panel showing event card
7. Validate all inputs before submission
8. Call smart contract to create event on-chain
9. Call backend API to create event with calendar
10. Show success message with event link

**Test**:
- Visit create page without wallet - redirects to home
- Visit with wallet but no Google - shows "Connect Google" prompt
- Fill form with invalid data - shows validation errors
- Upload image - preview appears
- Select date in past - shows error
- Complete form - preview updates
- Submit form - smart contract transaction initiated
- Transaction succeeds - backend API called
- Google Calendar event created
- Redirects to new event page

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
9. Show gas estimation before transactions
10. Add transaction receipts display

**Test**:
- Create event - calls contract, transaction succeeds
- Purchase ticket - approves PYUSD first, then purchases
- Withdraw revenue - calls contract, funds transferred
- Transaction pending - shows loading state
- Transaction failed - shows error with details
- View transaction - links to Sepolia Etherscan

---


