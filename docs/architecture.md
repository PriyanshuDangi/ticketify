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

**Technology**: Next.js 14 with React

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

**Key Contracts** (to be implemented):
- `Ticketify.sol` - Main contract (event creation, ticket purchases, withdrawals)
- `IPYUSD.sol` - ERC-20 interface for PYUSD token

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
- `.gitignore` - Root-level git ignore rules

**Client Directory**:
- `.gitignore` - Next.js specific ignores (node_modules, .next/, .env files)

**Server Directory**:
- `.gitignore` - Backend ignores (node_modules, .env, logs/, uploads/)

**Contracts Directory**:
- `.gitignore` - Hardhat ignores (artifacts, cache, .env)
- `hardhat.config.ts` - TypeScript configuration for Hardhat with Sepolia network setup
- `package.json` - Dependencies including OpenZeppelin contracts v5.4.0
- `.env.example` - Template for environment variables (RPC URLs, private keys, PYUSD address)
- `contracts/` - Solidity source files
  - `Lock.sol` - Sample contract from Hardhat init (to be replaced with Ticketify.sol)
- `scripts/` - Deployment scripts
- `test/` - Contract test suites (TypeScript with Viem)
  - `Lock.ts` - Sample test file
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

**Status**: Backend server infrastructure ready (Steps 1.1-1.3 complete)  
**Next**: Frontend application setup (Step 1.4)

