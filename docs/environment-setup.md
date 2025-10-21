# Ticketify Environment Setup Guide

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Node.js Version**: 22.21.0

---

## Overview

This guide provides step-by-step instructions for setting up the complete Ticketify development environment including smart contracts, backend server, and frontend application.

**Prerequisites**:
- Node.js 22.21.0
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet
- MongoDB Atlas account (free tier)
- Google Cloud account (for Calendar API)
- SendGrid account (for emails)
- Alchemy or Infura account (for blockchain RPC)

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Smart Contracts Setup](#smart-contracts-setup)
3. [Backend Server Setup](#backend-server-setup)
4. [Frontend Application Setup](#frontend-application-setup)
5. [External Services Setup](#external-services-setup)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ticketify.git
cd ticketify
```

### 2. Verify Node.js Version

```bash
node -v
# Should output: v22.21.0

# If not installed, use nvm:
nvm install 22.21.0
nvm use 22.21.0
```

### 3. Project Structure

```
ticketify/
├── client/          # Next.js frontend
├── server/          # Express.js backend
├── contracts/       # Hardhat smart contracts
├── docs/            # Documentation
└── README.md
```

---

## Smart Contracts Setup

### 1. Navigate to Contracts Directory

```bash
cd contracts
```

### 2. Install Dependencies

```bash
npm install
```

**Required packages**:
```json
{
  "hardhat": "^2.19.0",
  "@nomicfoundation/hardhat-toolbox": "^4.0.0",
  "@openzeppelin/contracts": "^5.0.0",
  "dotenv": "^16.3.1"
}
```

### 3. Create Environment File

```bash
cp .env.example .env
```

**Edit `.env`**:
```env
# Sepolia Testnet Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_private_key_without_0x_prefix

# Etherscan (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# PYUSD Token Address on Sepolia
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

### 4. Create Hardhat Config

**`hardhat.config.js`**:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

### 5. Test Compilation

```bash
npx hardhat compile
```

**Expected output**:
```
Compiled 3 Solidity files successfully
```

### 6. Run Tests

```bash
npx hardhat test
```

### 7. Deploy to Sepolia (when ready)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Save the deployed contract address!**

---

## Backend Server Setup

### 1. Navigate to Server Directory

```bash
cd ../server
```

### 2. Install Dependencies

```bash
npm install
```

**Required packages**:
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "multer": "^1.4.5-lts.1",
  "ethers": "^6.8.0",
  "googleapis": "^128.0.0",
  "@sendgrid/mail": "^7.7.0",
  "ics": "^3.5.0",
  "winston": "^3.11.0",
  "nodemon": "^3.0.1"
}
```

### 3. Create Environment File

```bash
cp .env.example .env
```

**Edit `.env`**:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ticketify?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=7d

# Google OAuth for Calendar API
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# SendGrid Email Service
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@ticketify.xyz
SENDGRID_FROM_NAME=Ticketify

# Blockchain Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0xYourDeployedContractAddress
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=8388608  # 8MB in bytes
```

### 4. Create Directory Structure

```bash
mkdir -p routes controllers models middleware utils uploads logs
```

### 5. Test Database Connection

Create `test-db.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });
```

Run test:
```bash
node test-db.js
```

### 6. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
Server running on port 5000
MongoDB connected
Blockchain listener started
```

### 7. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T10:00:00.000Z",
  "database": "connected"
}
```

---

## Frontend Application Setup

### 1. Navigate to Client Directory

```bash
cd ../client
```

### 2. Install Dependencies

```bash
npm install
```

**Required packages**:
```json
{
  "next": "14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-*": "latest",
  "zustand": "^4.4.0",
  "@privy-io/react-auth": "^1.0.0",
  "ethers": "^6.8.0",
  "axios": "^1.5.0",
  "moment": "^2.29.4",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "lucide-react": "^0.294.0"
}
```

### 3. Create Environment File

```bash
cp .env.local.example .env.local
```

**Edit `.env.local`**:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
NEXT_PUBLIC_CHAIN_ID=11155111

# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Network Configuration
NEXT_PUBLIC_NETWORK_NAME=Sepolia
NEXT_PUBLIC_ETHERSCAN_URL=https://sepolia.etherscan.io
```

### 4. Initialize Tailwind CSS

**Already configured if using create-next-app, but verify `tailwind.config.js`**:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 5. Initialize Shadcn/ui

```bash
npx shadcn-ui@latest init
```

Follow prompts:
- Would you like to use TypeScript? **No**
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Where is your global CSS file? **app/globals.css**
- Would you like to use CSS variables for colors? **Yes**

### 6. Install Shadcn Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
```

### 7. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### 8. Test Application

Open browser to `http://localhost:3000`

---

## External Services Setup

### MongoDB Atlas

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**: 
   - Choose Free Tier (M0)
   - Select nearest region
   - Name: `ticketify-dev`
3. **Create Database User**:
   - Username: `ticketify`
   - Password: (generate strong password)
4. **Network Access**:
   - Add IP: `0.0.0.0/0` (for development)
   - Production: Add specific IPs only
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Add to backend `.env` as `MONGODB_URI`

### Google Cloud Platform (Calendar API)

1. **Create Project**: https://console.cloud.google.com/
2. **Enable Calendar API**:
   - Navigate to "APIs & Services" → "Library"
   - Search "Google Calendar API"
   - Click "Enable"
3. **Create OAuth Credentials**:
   - "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Ticketify"
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - `https://api.ticketify.xyz/api/auth/google/callback` (production)
   - Save `Client ID` and `Client Secret`
4. **Configure OAuth Consent Screen**:
   - User Type: External
   - App name: Ticketify
   - Add scope: `https://www.googleapis.com/auth/calendar`
5. **Add Test Users** (for development):
   - Add your test Gmail accounts

### Privy (Wallet Authentication)

1. **Create Account**: https://privy.io/
2. **Create Project**:
   - Name: Ticketify
   - Type: Web3
3. **Get App ID**:
   - Dashboard → Settings → App ID
   - Copy to frontend `.env.local` as `NEXT_PUBLIC_PRIVY_APP_ID`
4. **Configure Settings**:
   - Allowed origins: `http://localhost:3000`
   - Supported wallets: MetaMask, WalletConnect, Coinbase Wallet
   - Default chain: Ethereum Sepolia (11155111)

### SendGrid (Email Service)

1. **Create Account**: https://signup.sendgrid.com/
2. **Verify Sender Identity**:
   - Settings → Sender Authentication
   - Verify Single Sender: `noreply@yourdomain.com`
3. **Create API Key**:
   - Settings → API Keys → "Create API Key"
   - Name: "Ticketify Production"
   - Permissions: Full Access
   - Copy key to backend `.env` as `SENDGRID_API_KEY`
4. **Test Email**:
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "test@example.com"}]
    }],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Hello from Ticketify!"}]
  }'
```

### Alchemy (Blockchain RPC)

1. **Create Account**: https://www.alchemy.com/
2. **Create App**:
   - Name: Ticketify
   - Chain: Ethereum
   - Network: Sepolia testnet
3. **Get API Key**:
   - Dashboard → View Key
   - Copy HTTPS URL
   - Add to `.env` files as `SEPOLIA_RPC_URL`

### Get Sepolia Test ETH

**Faucets**:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**Minimum needed**:
- Deployer wallet: 0.5 ETH (for contract deployment)
- Test wallets: 0.1 ETH each (for gas fees)

### Get Sepolia Test PYUSD

**Note**: PYUSD testnet tokens availability depends on PayPal's test environment. Check:
- PayPal Developer Portal
- PYUSD documentation
- Or create mock PYUSD for testing

---

## Environment Variables Reference

### Contracts `.env`

```env
# Required
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Addresses
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

### Server `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ticketify

# Authentication
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Email
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@ticketify.xyz
SENDGRID_FROM_NAME=Ticketify

# Blockchain
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0xYourDeployedContractAddress
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=8388608
```

### Client `.env.local`

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Contracts
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
NEXT_PUBLIC_CHAIN_ID=11155111

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Network
NEXT_PUBLIC_NETWORK_NAME=Sepolia
NEXT_PUBLIC_ETHERSCAN_URL=https://sepolia.etherscan.io
```

---

## Troubleshooting

### Common Issues

#### 1. Node Version Mismatch

**Problem**: `error: The engine "node" is incompatible`

**Solution**:
```bash
nvm use 22.21.0
```

#### 2. MongoDB Connection Failed

**Problem**: `MongoServerError: bad auth`

**Solution**:
- Verify username/password in connection string
- Check Network Access in MongoDB Atlas
- Ensure IP whitelist includes your IP or `0.0.0.0/0`

#### 3. Google Calendar API 403 Error

**Problem**: `Error 403: access_denied`

**Solution**:
- Verify OAuth consent screen is configured
- Add test users in Google Cloud Console
- Check redirect URI matches exactly
- Ensure Calendar API is enabled

#### 4. SendGrid Email Not Sending

**Problem**: Emails not arriving

**Solution**:
- Verify sender email in SendGrid
- Check API key permissions (should be Full Access)
- Test with SendGrid's mail tester
- Check spam folder

#### 5. Privy Connection Failed

**Problem**: Wallet won't connect

**Solution**:
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct
- Check allowed origins in Privy dashboard
- Ensure correct chain ID (11155111 for Sepolia)
- Try different wallet (MetaMask, Coinbase, etc.)

#### 6. Contract Interaction Failed

**Problem**: `execution reverted`

**Solution**:
- Verify contract address is correct
- Check wallet has Sepolia ETH for gas
- Ensure on correct network (Sepolia, chain ID 11155111)
- Verify PYUSD approval if needed

#### 7. Image Upload Failed

**Problem**: `413 Payload Too Large`

**Solution**:
- Check image size (max 8MB)
- Verify file type (jpg, png, webp only)
- Check Multer configuration in backend

#### 8. CORS Error

**Problem**: `Access-Control-Allow-Origin error`

**Solution**:
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS configuration in `server.js`
- Ensure ports match (frontend: 3000, backend: 5000)

---

## Development Workflow

### Starting All Services

```bash
# Terminal 1: Smart Contracts (if testing)
cd contracts
npx hardhat node  # Local blockchain

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: Frontend
cd client
npm run dev
```

### Stopping All Services

- Press `Ctrl+C` in each terminal
- Or use `pkill -f node` (stops all Node processes)

---

## Production Deployment

### Environment Changes

**Backend**:
- Set `NODE_ENV=production`
- Use production MongoDB cluster
- Add specific IP whitelisting
- Enable SSL/TLS
- Set secure CORS origins

**Frontend**:
- Update API URL to production backend
- Update contract addresses if redeployed
- Configure production domain in Privy
- Enable production optimizations

**Contracts**:
- Deploy to mainnet (or keep Sepolia for demo)
- Get contract audited before mainnet
- Use Gnosis Safe for contract ownership

---

## Security Checklist

- [ ] Never commit `.env` files to git
- [ ] Use strong, unique passwords
- [ ] Enable 2FA on all services
- [ ] Rotate API keys regularly
- [ ] Use environment-specific keys (dev/prod)
- [ ] Whitelist specific IPs in production
- [ ] Enable rate limiting
- [ ] Use HTTPS in production
- [ ] Encrypt sensitive data at rest
- [ ] Regular security audits

---

## Next Steps

After setup is complete:
1. Deploy smart contract to Sepolia
2. Create test events
3. Test ticket purchase flow
4. Verify Google Calendar integration
5. Test email notifications
6. Prepare for demo/production

---

**Document Version**: 1.0  
**Status**: Ready for Use

