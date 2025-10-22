# Ticketify Frontend

Next.js 14 frontend application for the Ticketify platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file from template:
```bash
cp .env.local.example .env.local
```

3. Configure environment variables in `.env.local`

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Wallet Auth**: Privy
- **Blockchain**: Ethers.js v6
- **HTTP Client**: Axios
- **Timezone**: Moment.js

## Directory Structure

```
client/
├── app/                # Next.js 14 App Router pages
│   ├── layout.jsx     # Root layout
│   ├── page.jsx       # Homepage
│   └── globals.css    # Global styles with Tailwind
├── components/         # React components (to be populated)
├── lib/               # Utility libraries
│   ├── api.js         # Axios API client
│   ├── contracts.js   # Ethers.js contract helpers
│   └── utils.js       # Helper functions (cn, etc.)
├── store/             # Zustand state stores (to be populated)
├── hooks/             # Custom React hooks (to be populated)
├── public/            # Static assets
├── tailwind.config.js # Tailwind CSS configuration
├── next.config.js     # Next.js configuration
└── package.json       # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production app
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.local.example` for required environment variables.

## API Documentation

See [docs/api-spec.md](../docs/api-spec.md) for backend API documentation.

