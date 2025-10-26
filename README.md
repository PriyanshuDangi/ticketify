# Ticketify

**Host online events: Automated Ethereum ticketing, instant payments, zero manual work.**

A blockchain-based online event ticketing platform that eliminates friction, high costs, and geographical barriers for hosting virtual events.

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://ticketify-ten.vercel.app/)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia-orange.svg)](https://sepolia.etherscan.io/address/0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e)

## 🎯 The Problem

Event organizers struggle with:
- **Manual attendee management**: Manually sharing meeting links and managing access
- **Unauthorized access**: Meeting links get shared, allowing non-paying attendees to join
- **High platform fees**: Eventbrite/Zoom Webinar charge 10-20% fees
- **Delayed settlements**: Traditional platforms hold funds for 5-7 days
- **Payment friction**: Cross-border payments and currency conversion barriers

## ✨ The Solution

Ticketify automates the entire flow:
1. Organizers create events on the blockchain with PYUSD pricing
2. Users purchase tickets via secure on-chain transactions
3. Buyers are **automatically added** to private Google Calendar events
4. Unique Google Meet access is granted instantly
5. Organizers withdraw revenue immediately after the event

**Zero manual work. Zero waiting. Zero hassle.**

## 🚀 Key Benefits

| Feature | Ticketify | Traditional Platforms |
|---------|-----------|----------------------|
| **Platform Fees** | 2.5% | 10-20% |
| **Settlement** | Instant | 5-7 days |
| **Manual Work** | Zero | High |
| **Global Payments** | ✅ PYUSD works worldwide | ❌ Limited by banks |
| **Access Control** | ✅ Automatic via Google Calendar | ❌ Manual link sharing |
| **Blockchain Verified** | ✅ On-chain proof | ❌ No verification |

### Cost Comparison

On a $20 ticket:
- **Ticketify**: Organizer keeps **$19.50** (2.5% fee)
- **Eventbrite**: Organizer keeps **~$16.30** (3.5% + $0.99 + payment processing)

## 🎓 Use Cases

- **Web3 Workshops & Courses**: Crypto educators monetizing educational content
- **DAO Community Calls**: Token-holder exclusive events with PYUSD tickets
- **Virtual Networking Events**: Professional meetups with payment-gated access
- **Online Conferences**: Multi-session events with automated attendee management
- **International Events**: Cross-border events without bank friction

## 🏗️ How It Works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Organizer  │─────▶│  Smart       │─────▶│  Google         │
│  Creates    │      │  Contract    │      │  Calendar +     │
│  Event      │      │  (PYUSD)     │      │  Meet Link      │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Buyer Pays  │
                     │  with PYUSD  │
                     └──────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │  Envio HyperIndex│
                   │  Listens to Event│
                   └──────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  Backend API    │
                    │  Auto-adds to   │
                    │  Calendar       │
                    └─────────────────┘
```

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 14 (React) with App Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Shadcn/ui
- **Wallet Auth**: Privy
- **Blockchain**: Ethers.js v6

### Backend
- **Runtime**: Node.js 22.21.0
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Calendar**: Google Calendar API v3
- **Email**: SendGrid
- **Indexing**: Envio HyperIndex for real-time blockchain events

### Smart Contracts
- **Language**: Solidity 0.8.28
- **Framework**: Hardhat 3 with Viem toolbox
- **Security**: OpenZeppelin Contracts v5.4.0
- **Network**: Ethereum Sepolia Testnet
- **Token**: PayPal USD (PYUSD) - 6 decimals

### Infrastructure
- **Deployed Contract**: [`0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e`](https://sepolia.etherscan.io/address/0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e)
- **PYUSD on Sepolia**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

## 🛠️ Quick Start

### Prerequisites

- **Node.js**: v22.21.0 (use `nvm use` if `.nvmrc` is present)
- **Package Manager**: npm or yarn
- **MongoDB**: MongoDB Atlas account
- **Wallet**: MetaMask or compatible Web3 wallet
- **PYUSD**: Sepolia testnet PYUSD tokens

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ticketify.git
cd ticketify

# Install dependencies for all components
cd contracts && npm install
cd ../server && npm install
cd ../client && npm install
```


### Running the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev
# Runs on http://localhost:5001

# Terminal 2: Start frontend
cd client
npm run dev
# Runs on http://localhost:3000

# Terminal 3: Start Envio indexer (optional for local dev)
cd envio-indexer
npm run dev
```

### Smart Contract Deployment

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <PYUSD_ADDRESS>
```

## 🗂️ Project Structure

```
ticketify/
├── client/              # Next.js frontend application
│   ├── app/            # Next.js 14 App Router pages
│   ├── components/     # React components
│   ├── lib/           # Utilities (API client, blockchain, utils)
│   ├── store/         # Zustand state management
│   └── hooks/         # Custom React hooks
├── server/             # Express.js backend API
│   ├── routes/        # API route definitions
│   ├── controllers/   # Request handlers
│   ├── models/        # Mongoose schemas
│   ├── middleware/    # Auth, validation, error handling
│   ├── utils/         # Database, Google Calendar, email
│   └── calendar/      # Google Calendar integration
├── contracts/          # Solidity smart contracts
│   ├── contracts/     # Solidity source files
│   │   ├── Ticketify.sol      # Main ticketing contract
│   │   ├── MockPYUSD.sol      # Test token (6 decimals)
│   │   └── interfaces/        # Contract interfaces
│   ├── scripts/       # Deployment scripts
│   └── test/          # Contract test suites
├── envio-indexer/      # Envio HyperIndex configuration
│   ├── config.yaml    # Indexer configuration
│   ├── schema.graphql # GraphQL schema
│   └── src/           # Event handlers
└── docs/               # Complete documentation
```

## 🔑 Key Features

### For Event Organizers

✅ **Create Events in Seconds**: Simple form → Google Calendar event with Meet link generated automatically  
✅ **Automatic Attendee Management**: Ticket buyers are auto-added to your private calendar event  
✅ **Instant Revenue Withdrawal**: Withdraw your PYUSD earnings anytime, no waiting periods  
✅ **Real-Time Dashboard**: Track ticket sales, revenue, and attendee list in real-time  
✅ **Lowest Fees**: Only 2.5% platform fee (vs 10-20% on traditional platforms)  
✅ **Global Reach**: Accept payments from anywhere in the world with PYUSD  

### For Ticket Buyers

✅ **Simple Purchase Flow**: Connect wallet → Enter email → Approve → Purchase → Auto-added to event  
✅ **Instant Confirmation**: Receive Google Calendar invite with Meet link immediately  
✅ **Blockchain Verified**: Your ticket ownership is recorded on-chain  
✅ **One-Click Access**: Join the event directly from your Google Calendar  
✅ **No Manual Links**: No need to save or copy-paste meeting links  

### Security & Privacy

✅ **Smart Contract Security**: Audited OpenZeppelin libraries, comprehensive test coverage  
✅ **Access Control**: Only ticket holders can join Google Meet sessions  
✅ **Privacy Protected**: Attendee emails are never shared with other participants  
✅ **One Ticket Per Wallet**: Smart contract enforces single purchase per event  
✅ **Reentrancy Protection**: All fund transfers are protected against attacks  

## 🎬 Demo

- **Live Demo**: [ETHGlobal Showcase](https://ethglobal.com/showcase/ticketify-hzgvq)
- **Presentation**: [Project Overview (PPT)](./docs/Ticketify.pptx)
- **Smart Contract**: [Verified on Sepolia](https://sepolia.etherscan.io/address/0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e)

## 🌟 Innovation Highlights

### First Platform to Bridge Blockchain + Google Meet

Ticketify is the **first platform** to directly connect blockchain payments with automatic video conferencing access. Traditional platforms require manual steps:

```
Traditional: Payment → Copy email → Add to calendar → Share link
Ticketify:   Payment → ✨ Everything automated ✨
```

### Why PYUSD?

- **Stable Value**: 1 PYUSD = 1 USD (no crypto volatility)
- **Instant Settlement**: Organizers get paid immediately (vs 5-7 days traditional)
- **Lower Fees**: No 3%+ payment processor fees
- **Global**: Works anywhere without bank accounts or currency conversion
- **Transparent**: All transactions verifiable on blockchain

### Real-Time Event-Driven Architecture

```
Smart Contract Event → Envio HyperIndex → Backend Webhook → Google Calendar
```

When a user purchases a ticket:
1. Smart contract emits `TicketPurchased` event
2. Envio HyperIndex catches the event in real-time
3. Webhook triggers backend automation
4. Buyer is added to Google Calendar automatically
5. Confirmation email sent with Meet link

**Total time**: < 5 seconds

## 📊 Smart Contract Details

### Contract Address
- **Sepolia Testnet**: `0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e`
- **View on Etherscan**: [Contract Code](https://sepolia.etherscan.io/address/0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e#code)

### Key Functions

```solidity
// Create a new event
function createEvent(uint256 price, uint256 maxAttendees, uint256 eventTime)

// Purchase a ticket with PYUSD
function purchaseTicket(uint256 eventId)

// Withdraw organizer revenue (after 2.5% platform fee)
function withdrawRevenue(uint256 eventId)

// View event details
function getEvent(uint256 eventId) returns (Event)
```

### Business Logic

- **Platform Fee**: 2.5% (250 basis points) on all ticket sales
- **One Ticket Rule**: Each wallet can only purchase one ticket per event
- **Instant Withdrawals**: Organizers can withdraw anytime (no time restrictions)
- **PYUSD Decimals**: All amounts use 6 decimals (10.50 PYUSD = 10,500,000)


## 🚢 Deployment Status

| Component | Status | Details |
|-----------|--------|---------|
| Smart Contracts | ✅ Deployed | Sepolia: `0x1cc7fa86240f105aa1f1fa9f795f9530c881b12e` |
| Backend API | ✅ Complete | Node.js + Express + MongoDB |
| Frontend | ✅ Complete | Next.js 14 with full blockchain integration |
| Envio Indexer | ✅ Configured | [Real-time event indexing](https://envio.dev/app/PriyanshuDangi/ticketify) |
| Google Integration | ✅ Working | Calendar + Meet automation |

## 🤝 Contributing

This project was built for ETHOnline 2025 hackathon. Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


*Ticketify: Making online events as simple as "Create → Share → Earn"*
