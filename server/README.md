# Ticketify Backend Server

Node.js + Express.js backend API for the Ticketify platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. Start development server:
```bash
npm run dev
```

## Tech Stack

- **Runtime**: Node.js 22.21.0
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (7-day expiry)
- **File Upload**: Multer (8MB limit, base64 storage)
- **Email**: SendGrid
- **Calendar**: Google Calendar API
- **Blockchain**: Ethers.js v6

## Directory Structure

```
server/
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── models/          # Mongoose schemas
├── middleware/      # Auth, validation, error handling
├── utils/           # Helper functions
├── uploads/         # Image storage
├── logs/            # Application logs
└── server.js        # Entry point
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## API Documentation

See [docs/api-spec.md](../docs/api-spec.md) for complete API documentation.

## Database Schema

See [docs/database-spec.md](../docs/database-spec.md) for complete database schema.

