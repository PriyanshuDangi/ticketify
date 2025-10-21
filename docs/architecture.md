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

**Technology**: Node.js 20.12.2 with Express.js

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

**Directory Structure** (to be created):
```
server/
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── models/          # Mongoose schemas
├── middleware/      # Auth, validation, error handling
├── utils/           # Helper functions
├── uploads/         # Image storage (base64)
└── logs/            # Application logs
```

---

### `/contracts` - Smart Contracts

**Technology**: Solidity with Hardhat 3

**Purpose**: Immutable blockchain contracts for ticket sales and revenue distribution.

**Directory Structure**:
```
contracts/
├── contracts/       # Solidity smart contracts
├── scripts/         # Deployment and interaction scripts
└── test/            # Contract test suites
```

**Key Contracts**:
- `Ticketify.sol` - Main contract (event creation, ticket purchases, withdrawals)
- `IPYUSD.sol` - ERC-20 interface for PYUSD token

**Network**: Ethereum Sepolia (Chain ID: 11155111)  
**Token**: PYUSD at `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

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
- `contracts/` - Solidity source files (to be added)
- `scripts/` - Deployment scripts (to be added)
- `test/` - Contract tests (to be added)

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
| Backend | Node.js + Express | 20.12.2 |
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

**Status**: Initial structure complete (Step 1.1)  
**Next**: Initialize each component (Steps 1.2-1.5)

