# Ticketify

A blockchain-based event ticketing platform with PYUSD payments and Google Calendar integration.

## Requirements

- **Node.js**: v22.21.0
- **npm** or **yarn**
- MongoDB Atlas account
- MetaMask or compatible Web3 wallet

## Quick Start

```bash
# Use the correct Node.js version
nvm use

# Install dependencies for each component
cd contracts && npm install
cd ../server && npm install
cd ../client && npm install
```

## Documentation

For complete setup instructions and documentation, see the [docs](./docs) folder:

- **[Implementation Plan](./docs/implementation-plan.md)** - Step-by-step development guide
- **[Environment Setup](./docs/environment-setup.md)** - Complete setup instructions
- **[Architecture](./docs/architecture.md)** - System architecture overview
- **[API Specification](./docs/api-spec.md)** - REST API documentation
- **[Database Specification](./docs/database-spec.md)** - MongoDB schemas
- **[Design Document](./docs/design-doc.md)** - Product requirements

## Project Structure

```
ticketify/
├── client/          # Next.js frontend application
├── server/          # Express.js backend API
├── contracts/       # Solidity smart contracts
└── docs/            # Complete documentation
```

## Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js 22.21.0, Express.js, MongoDB, Mongoose
- **Smart Contracts**: Solidity, Hardhat 3
- **Blockchain**: Ethereum Sepolia testnet
- **Integrations**: PYUSD, Privy, Google Calendar, SendGrid
