# Ticketify API Specification

**Version**: 1.0  
**Base URL**: `http://localhost:5000` (development) | `https://api.ticketify.xyz` (production)  
**Authentication**: Cookie-based (wallet address)  
**Last Updated**: October 24, 2025

---

## Overview

This document defines all REST API endpoints, request/response formats, authentication, and error handling for the Ticketify platform.

**Key Specifications**:
- **Format**: JSON
- **Authentication**: Cookie-based using wallet address
- **Pagination**: Page-based (default: page=1, limit=20)
- **Timestamps**: All timestamps in UTC, convert to local timezone on client
- **Rate Limiting**: Not implemented in MVP

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Events API](#events-api)
4. [Tickets API](#tickets-api)
5. [Error Responses](#error-responses)
6. [Status Codes](#status-codes)

---

## Authentication

### Overview

Ticketify uses cookie-based authentication with wallet addresses. Users connect their wallet via Privy, and the wallet address is stored in a secure cookie.

**Authentication Specifications**:
- **Type**: Cookie-based (wallet address)
- **Cookie Name**: `walletAddress`
- **Expiration**: Session-based (no expiration, removed on disconnect)
- **Cookie Attributes**: `path=/; SameSite=Lax; Secure (in production)`
- **CORS**: `credentials: true` required on both client and server

### Auth Flow

1. User connects wallet via Privy on frontend
2. Frontend stores wallet address in cookie: `document.cookie = 'walletAddress=0x123...; path=/'`
3. Browser automatically sends cookie with all API requests
4. Backend reads cookie from `req.cookies.walletAddress`
5. Backend finds or auto-creates user based on wallet address
6. Backend attaches user to request object (`req.user`, `req.userId`, `req.walletAddress`)
7. When user disconnects wallet, frontend removes cookie: `document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'`

### Important Notes

- **Session-based**: Cookie persists only while wallet is connected (no expiration time)
- **Auto-registration**: Users are automatically created in the database when they first make an authenticated request
- **No login endpoint needed**: Authentication happens automatically via cookies
- **Simple lifecycle**: Connect wallet → Set cookie | Disconnect wallet → Remove cookie
- **CORS credentials**: Frontend axios must have `withCredentials: true` configured

---

## Users API

### GET /api/users/me

**Description**: Get current authenticated user's profile.

**Authentication**: Required (via cookie)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "652f8a3b2c1d4e5f6a7b8c9d",
      "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "email": "user@example.com",
      "name": "John Doe",
      "isGoogleCalendarAdded": true,
      "createdAt": "2025-10-21T10:00:00.000Z",
      "updatedAt": "2025-10-21T12:00:00.000Z"
    }
  }
}
```

**Errors**:
- `401`: No wallet address cookie provided
- `404`: User not found (auto-creates if cookie is valid)

---

### PUT /api/users/me

**Description**: Update current user's profile.

**Authentication**: Required

**Request**:
```json
{
  "email": "newemail@example.com",
  "name": "Jane Doe"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "652f8a3b2c1d4e5f6a7b8c9d",
      "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "email": "newemail@example.com",
      "name": "Jane Doe",
      "isGoogleCalendarAdded": true,
      "updatedAt": "2025-10-21T13:00:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

**Errors**:
- `400`: Validation error
- `401`: Unauthorized
- `409`: Email already in use

---

### GET /api/users/connect-google

**Description**: Get Google OAuth authorization URL to connect calendar.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=https://www.googleapis.com/auth/calendar&response_type=code"
  }
}
```

---

### GET /api/users/google-callback

**Description**: Handle Google OAuth callback and store tokens.

**Authentication**: Required (via cookie)

**Query Parameters**:
- `code` - Google OAuth authorization code

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "652f8a3b2c1d4e5f6a7b8c9d",
      "isGoogleCalendarAdded": true
    }
  },
  "message": "Google Calendar connected successfully"
}
```

**Errors**:
- `400`: Invalid or expired code
- `401`: Unauthorized

---

### GET /api/users/is-google-calendar-connected

**Description**: Check if user has Google Calendar connected.

**Authentication**: Required (via cookie)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "isConnected": true
  }
}
```

**Errors**:
- `401`: Unauthorized

---

## Events API

### POST /api/events

**Description**: Create a new event in draft mode (Google Calendar event created, but not yet on blockchain).

**Flow**: 
1. Backend creates event with `contractEventId: null` (draft state)
2. Frontend creates event on blockchain with user's wallet
3. Frontend calls PATCH /api/events/:id/contract-id to activate event

**Authentication**: Required  
**Content-Type**: `multipart/form-data`

**Request** (Form Data):
```
title: "Web3 Workshop: Building with PYUSD"
description: "Learn how to integrate PYUSD into your dApp..."
dateTime: "2025-10-25T15:00:00.000Z" (UTC)
duration: 120 (minutes)
price: 10.50 (PYUSD, max 2 decimals)
maxAttendees: 50
image: <file> (optional, max 8MB, jpg/png/webp)
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "652f9b4c3d2e5f6a7b8c9d0e",
      "contractEventId": null,
      "owner": {
        "_id": "652f8a3b2c1d4e5f6a7b8c9d",
        "name": "John Doe",
        "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
      },
      "title": "Web3 Workshop: Building with PYUSD",
      "description": "Learn how to integrate PYUSD into your dApp...",
      "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "dateTime": "2025-10-25T15:00:00.000Z",
      "duration": 120,
      "price": 10.50,
      "maxAttendees": 50,
      "googleCalendarId": "abc123def456",
      "googleMeetLink": "https://meet.google.com/abc-defg-hij",
      "isActive": true,
      "createdAt": "2025-10-21T14:00:00.000Z"
    }
  },
  "message": "Event created successfully"
}
```

**Important Notes**:
- Event starts in **draft mode** (contractEventId is null)
- Event will NOT appear in public listings until contractEventId is set
- Frontend must create event on blockchain and call PATCH endpoint to activate
- Google Calendar event and Meet link are created immediately

**Errors**:
- `400`: Validation error (missing fields, invalid date, etc.)
- `401`: Unauthorized or Google Calendar not connected
- `413`: Image file too large (>8MB)
- `500`: Failed to create Google Calendar event

---

### PATCH /api/events/:id/contract-id

**Description**: Update event with blockchain contract ID to activate it (makes it public).

**Authentication**: Required (must be event owner)  
**Content-Type**: `application/json`

**Request**:
```json
{
  "contractEventId": "5"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "652f9b4c3d2e5f6a7b8c9d0e",
      "contractEventId": "5",
      "owner": {
        "_id": "652f8a3b2c1d4e5f6a7b8c9d",
        "name": "John Doe",
        "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
      },
      "title": "Web3 Workshop: Building with PYUSD",
      "updatedAt": "2025-10-21T14:05:00.000Z"
    }
  },
  "message": "Contract ID updated successfully"
}
```

**Business Rules**:
- Only the event owner can update the contractEventId
- contractEventId can only be set once (cannot be changed after setting)
- contractEventId must be unique across all events
- After setting contractEventId, event appears in public listings

**Errors**:
- `400`: Invalid contractEventId format, already set, or duplicate contractEventId
- `401`: Unauthorized
- `403`: Not event owner
- `404`: Event not found

---

### GET /api/events

**Description**: Get list of active events with pagination and filtering. Only returns events that have been confirmed on blockchain (contractEventId is not null).

**Authentication**: Optional (public endpoint)

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page
- `upcoming` (default: true) - Filter upcoming events only
- `search` - Search in title and description
- `minPrice` - Minimum ticket price
- `maxPrice` - Maximum ticket price
- `sortBy` (default: dateTime) - Sort field: dateTime, price, createdAt
- `order` (default: asc) - Sort order: asc, desc

**Example**: `/api/events?page=2&limit=10&upcoming=true&search=workshop&minPrice=5`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "652f9b4c3d2e5f6a7b8c9d0e",
        "contractEventId": "1",
        "owner": {
          "_id": "652f8a3b2c1d4e5f6a7b8c9d",
          "name": "John Doe"
        },
        "title": "Web3 Workshop: Building with PYUSD",
        "description": "Learn how to integrate PYUSD...",
        "imageUrl": "data:image/jpeg;base64,...",
        "dateTime": "2025-10-25T15:00:00.000Z",
        "duration": 120,
        "price": 10.50,
        "maxAttendees": 50,
        "isActive": true,
        "ticketsSold": 15,
        "spotsRemaining": 35
      }
    ],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": true
    }
  }
}
```

---

### GET /api/events/:id

**Description**: Get single event details by MongoDB ID.

**Authentication**: Optional (Meet link only shown to organizer or ticket holders)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "652f9b4c3d2e5f6a7b8c9d0e",
      "contractEventId": "1",
      "owner": {
        "_id": "652f8a3b2c1d4e5f6a7b8c9d",
        "name": "John Doe",
        "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
        "email": "john@example.com"
      },
      "title": "Web3 Workshop: Building with PYUSD",
      "description": "Learn how to integrate PYUSD into your dApp...",
      "imageUrl": "data:image/jpeg;base64,...",
      "dateTime": "2025-10-25T15:00:00.000Z",
      "duration": 120,
      "price": 10.50,
      "maxAttendees": 50,
      "googleMeetLink": "https://meet.google.com/abc-defg-hij",
      "isActive": true,
      "createdAt": "2025-10-21T14:00:00.000Z",
      "ticketsSold": 15,
      "spotsRemaining": 35,
      "userHasPurchased": false
    }
  }
}
```

**Errors**:
- `404`: Event not found

---

### PUT /api/events/:id

**Description**: Update event details (restrictions apply after tickets sold).

**Authentication**: Required (must be event owner)  
**Content-Type**: `multipart/form-data`

**Rules**:
- **Before tickets sold**: Can update all fields
- **After tickets sold**: Can only update title, description, imageUrl
- Cannot update: price, dateTime, duration, maxAttendees

**Request** (Form Data):
```
title: "Updated Workshop Title"
description: "Updated description..."
image: <file> (optional)
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "652f9b4c3d2e5f6a7b8c9d0e",
      "title": "Updated Workshop Title",
      "description": "Updated description...",
      "updatedAt": "2025-10-21T15:00:00.000Z"
    }
  },
  "message": "Event updated successfully"
}
```

**Errors**:
- `400`: Cannot update field after tickets sold
- `401`: Unauthorized
- `403`: Not event owner
- `404`: Event not found

---

### DELETE /api/events/:id

**Description**: Delete event (only allowed if no tickets sold).

**Authentication**: Required (must be event owner)

**Response** (200):
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Errors**:
- `400`: Cannot delete event with tickets sold
- `401`: Unauthorized
- `403`: Not event owner
- `404`: Event not found

---

### GET /api/events/my-events

**Description**: Get authenticated user's created events.

**Authentication**: Required

**Query Parameters**:
- `status` - Filter by status: upcoming, past, all (default: all)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "652f9b4c3d2e5f6a7b8c9d0e",
        "title": "Web3 Workshop",
        "dateTime": "2025-10-25T15:00:00.000Z",
        "price": 10.50,
        "maxAttendees": 50,
        "ticketsSold": 15,
        "revenue": 157.50,
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## Tickets API

### POST /api/tickets/purchase

**Description**: Initiate ticket purchase (creates ticket with 'created' status). If the user already has a ticket in 'created' status for this event, returns the existing ticket.

**Authentication**: Required

**Request**:
```json
{
  "eventId": "652f9b4c3d2e5f6a7b8c9d0e",
  "buyerEmail": "buyer@example.com"
}
```

**Response** (201 - New Ticket):
```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "652fac5d4e3f6a7b8c9d0e1f",
      "event": "652f9b4c3d2e5f6a7b8c9d0e",
      "buyerWalletAddress": "0x123...",
      "buyerEmail": "buyer@example.com",
      "status": "created",
      "createdAt": "2025-10-21T16:00:00.000Z"
    }
  },
  "message": "Ticket purchase initiated. Please confirm blockchain transaction."
}
```

**Response** (200 - Existing Ticket):
```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "652fac5d4e3f6a7b8c9d0e1f",
      "event": "652f9b4c3d2e5f6a7b8c9d0e",
      "buyerWalletAddress": "0x123...",
      "buyerEmail": "buyer@example.com",
      "status": "created",
      "createdAt": "2025-10-21T16:00:00.000Z"
    }
  }
}
```

**Business Rules**:
- If user already has a ticket with status 'created', returns existing ticket (allows retry)
- If user already has a ticket with status 'blockchain_added' or 'calendar_added', returns error
- Checks if event is active, not started, and not sold out
- Only one ticket per wallet address per event

**Errors**:
- `400`: Event sold out, event has started, event not active, or user already purchased (with confirmed status)
- `401`: Unauthorized
- `404`: Event not found

---

### POST /api/tickets/confirm

**Description**: Confirm blockchain transaction and add to Google Calendar. This endpoint verifies the ticket belongs to the requesting user, stores the transaction hash, and adds the buyer to the Google Calendar event.

**Authentication**: Required

**Request**:
```json
{
  "ticketId": "652fac5d4e3f6a7b8c9d0e1f",
  "transactionHash": "0x1234567890abcdef..."
}
```

**Processing Steps**:
1. Verify ticket belongs to requesting user
2. Check transaction hash is not already used
3. Update ticket status to 'blockchain_added' and save transaction hash
4. Add buyer to Google Calendar event
5. Update ticket status to 'calendar_added'
6. Send confirmation email (currently not implemented)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "652fac5d4e3f6a7b8c9d0e1f",
      "event": {
        "_id": "652f9b4c3d2e5f6a7b8c9d0e",
        "title": "Web3 Workshop",
        "dateTime": "2025-10-25T15:00:00.000Z",
        "googleMeetLink": "https://meet.google.com/abc-defg-hij"
      },
      "buyerWalletAddress": "0x123...",
      "buyerEmail": "buyer@example.com",
      "transactionHash": "0x1234567890abcdef...",
      "status": "calendar_added",
      "priceAtPurchase": 10.50,
      "createdAt": "2025-10-21T16:00:00.000Z",
      "updatedAt": "2025-10-21T16:02:00.000Z"
    }
  },
  "message": "Ticket confirmed! You've been added to the Google Calendar event."
}
```

**Errors**:
- `400`: Invalid transaction or duplicate transaction hash
- `401`: Unauthorized
- `403`: Ticket does not belong to requesting user
- `404`: Ticket not found
- `500`: Failed to add to Google Calendar

---

### GET /api/tickets/my-tickets

**Description**: Get authenticated user's purchased tickets.

**Authentication**: Required

**Query Parameters**:
- `status` - Filter: upcoming, past, all (default: upcoming)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "652fac5d4e3f6a7b8c9d0e1f",
        "event": {
          "_id": "652f9b4c3d2e5f6a7b8c9d0e",
          "title": "Web3 Workshop: Building with PYUSD",
          "description": "Learn how to integrate PYUSD...",
          "imageUrl": "data:image/jpeg;base64,...",
          "dateTime": "2025-10-25T15:00:00.000Z",
          "duration": 120,
          "googleMeetLink": "https://meet.google.com/abc-defg-hij",
          "owner": {
            "name": "John Doe",
            "email": "john@example.com"
          }
        },
        "buyerEmail": "buyer@example.com",
        "transactionHash": "0x1234567890abcdef...",
        "status": "calendar_added",
        "priceAtPurchase": 10.50,
        "createdAt": "2025-10-21T16:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/tickets/event/:eventId

**Description**: Get tickets for specific event (organizer only).

**Authentication**: Required (must be event owner)

**Query Parameters**:
- `status` - Filter by ticket status (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "652f9b4c3d2e5f6a7b8c9d0e",
      "title": "Web3 Workshop",
      "dateTime": "2025-10-25T15:00:00.000Z",
      "maxAttendees": 50
    },
    "tickets": [
      {
        "_id": "652fac5d4e3f6a7b8c9d0e1f",
        "buyerWalletAddress": "0x123...",
        "buyerEmail": "buyer@example.com",
        "transactionHash": "0x1234...",
        "status": "calendar_added",
        "priceAtPurchase": 10.50,
        "createdAt": "2025-10-21T16:00:00.000Z"
      }
    ],
    "stats": {
      "total": 15,
      "created": 1,
      "blockchain_added": 2,
      "calendar_added": 12
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

**Errors**:
- `401`: Unauthorized
- `403`: Not event owner
- `404`: Event not found

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional details
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | No wallet address cookie provided | 401 |
| `FORBIDDEN` | User doesn't have permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `DUPLICATE_ERROR` | Resource already exists | 409 |
| `EVENT_NOT_ACTIVE` | Event is not active or has been deleted | 400 |
| `EVENT_SOLD_OUT` | No tickets available | 400 |
| `EVENT_STARTED` | Event has already started | 400 |
| `ALREADY_PURCHASED` | User already bought ticket (with confirmed status) | 400 |
| `DUPLICATE_TRANSACTION` | Transaction hash already used for another ticket | 400 |
| `CANNOT_EDIT` | Cannot edit field after tickets sold | 400 |
| `CANNOT_DELETE` | Cannot delete event with tickets | 400 |
| `ALREADY_SET` | Contract ID already set for event | 400 |
| `DUPLICATE_CONTRACT_ID` | Contract event ID already exists | 400 |
| `GOOGLE_CALENDAR_ERROR` | Google Calendar API error | 500 |
| `BLOCKCHAIN_ERROR` | Blockchain transaction error | 500 |
| `EMAIL_ERROR` | Failed to send email | 500 |
| `SERVER_ERROR` | Internal server error | 500 |

### Example Error Responses

**401 - Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No wallet address provided"
  }
}
```

**400 - Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "price": "Price must have maximum 2 decimal places"
      }
    }
  }
}
```

**403 - Forbidden**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to update this event"
  }
}
```

**404 - Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

## Status Codes

| Status Code | Meaning | Usage |
|-------------|---------|-------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Validation error, business logic error |
| `401` | Unauthorized | No wallet address cookie provided |
| `403` | Forbidden | Valid authentication but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (email, wallet already exists) |
| `413` | Payload Too Large | File upload exceeds 8MB limit |
| `500` | Internal Server Error | Server-side error |
| `503` | Service Unavailable | External service (Google, blockchain) unavailable |

---

## Rate Limiting

**Not Implemented in MVP**

Future implementation will include:
- 100 requests per minute per IP for unauthenticated requests
- 500 requests per minute per user for authenticated requests
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Request/Response Headers

### Common Request Headers

```
Content-Type: application/json
Accept: application/json
Cookie: walletAddress=0x123...
```

**Note**: Cookies are automatically sent by the browser. No manual header setup needed for authentication.

### Common Response Headers

```
Content-Type: application/json
X-Request-ID: <unique_request_id>
Set-Cookie: walletAddress=... (only set by frontend)
```

---

## Testing

### Health Check Endpoint

**GET /health**

Public endpoint to check API status.

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T17:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "blockchain": "connected"
}
```

---

## Notes for Frontend Developers

1. **Set cookie on wallet connect** - Store wallet address: `document.cookie = 'walletAddress=0x123...; path=/'`
2. **Remove cookie on wallet disconnect** - Clear cookie: `document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'`
3. **Enable credentials in axios** - Must set `withCredentials: true` in axios config for cookies to be sent
4. **Handle authentication errors** - Show "Please reconnect wallet" message on 401 errors
5. **Convert timestamps** - All timestamps are UTC, convert to user's timezone on display
6. **PYUSD decimals** - API returns price with 2 decimals, convert to 6 decimals for blockchain
7. **Pagination** - Always use pagination for lists to avoid performance issues
8. **Error handling** - Display error.message to users, log error.code for debugging
9. **Image uploads** - Use FormData for multipart/form-data requests
10. **Retry logic** - Implement retry for network failures and 503 errors
11. **Auto-registration** - Users are auto-created on first authenticated request, no need to call register endpoint
12. **Cookie security** - In production, cookies should include `Secure` flag (HTTPS only)

### Event Creation Flow (Important!)

**Two-Step Process**:

1. **Create in Backend** (POST /api/events):
   - Creates event with `contractEventId: null` (draft state)
   - Creates Google Calendar event and Meet link
   - Returns event with MongoDB `_id`

2. **Create on Blockchain** (Frontend):
   - Use returned event data to call smart contract's `createEvent()` function
   - User signs transaction with their wallet
   - Wait for transaction confirmation
   - Extract `contractEventId` from blockchain event/return value

3. **Update Backend** (PATCH /api/events/:id/contract-id):
   - Send blockchain `contractEventId` to backend
   - Event becomes active and visible in public listings
   - Users can now purchase tickets

**Example Flow**:
```javascript
// Step 1: Create in backend
const response = await api.post('/events', formData);
const { _id, price, maxAttendees, dateTime } = response.data.event;

// Step 2: Create on blockchain
const priceInPYUSD = price * 1_000_000; // Convert to 6 decimals
const eventTimeUnix = Math.floor(new Date(dateTime).getTime() / 1000);
const tx = await ticketifyContract.createEvent(priceInPYUSD, maxAttendees, eventTimeUnix);
const receipt = await tx.wait();
const contractEventId = /* extract from receipt or logs */;

// Step 3: Update backend with blockchain ID
await api.patch(`/events/${_id}/contract-id`, { contractEventId });

// Event is now live!
```

**Why This Flow?**:
- ✅ User gets instant feedback (no waiting for blockchain)
- ✅ If blockchain fails, event data is saved (can retry)
- ✅ Frontend controls wallet interaction
- ✅ Backend never needs private keys
- ✅ Clean separation of concerns

---

**Document Version**: 1.0  
**Status**: Ready for Implementation

