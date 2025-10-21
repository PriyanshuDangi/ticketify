# Ticketify API Specification

**Version**: 1.0  
**Base URL**: `http://localhost:5000` (development) | `https://api.ticketify.xyz` (production)  
**Authentication**: Bearer Token (JWT)  
**Last Updated**: October 21, 2025

---

## Overview

This document defines all REST API endpoints, request/response formats, authentication, and error handling for the Ticketify platform.

**Key Specifications**:
- **Format**: JSON
- **Authentication**: Bearer Token in `Authorization` header
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

Ticketify uses JWT (JSON Web Token) for authentication. Users must connect their wallet and sign a message to receive a token.

**Token Specifications**:
- **Type**: JWT (JSON Web Token)
- **Expiration**: 7 days
- **Refresh**: No refresh token (user must reconnect wallet after expiry)
- **Header Format**: `Authorization: Bearer <token>`

### Auth Flow

1. User connects wallet via Privy
2. Frontend requests signature from wallet
3. Frontend sends signed message to `/api/auth/login`
4. Backend verifies signature and returns JWT
5. Frontend stores JWT and includes in all subsequent requests
6. After 7 days, token expires and user must re-authenticate

### POST /api/auth/login

**Description**: Authenticate user with wallet signature and receive JWT token.

**Request**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign this message to authenticate with Ticketify: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "timestamp": 1729525200000
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "652f8a3b2c1d4e5f6a7b8c9d",
      "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "email": "user@example.com",
      "name": "John Doe",
      "isGoogleCalendarAdded": true
    }
  },
  "message": "Authentication successful"
}
```

**Errors**:
- `400`: Invalid signature or missing fields
- `401`: Signature verification failed
- `404`: User not found (auto-creates on first login)

---

### POST /api/auth/register

**Description**: Register new user (called automatically on first login).

**Request**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "652f8a3b2c1d4e5f6a7b8c9d",
      "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "email": "user@example.com",
      "name": "John Doe",
      "isGoogleCalendarAdded": false,
      "createdAt": "2025-10-21T10:00:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

**Errors**:
- `400`: Validation error or wallet/email already exists
- `409`: User already exists

---

## Users API

### GET /api/users/me

**Description**: Get current authenticated user's profile.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <token>
```

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
- `401`: No token or invalid token
- `404`: User not found

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

### POST /api/users/google-callback

**Description**: Handle Google OAuth callback and store tokens.

**Authentication**: Required

**Request**:
```json
{
  "code": "4/0AZEOvh..."
}
```

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

## Events API

### POST /api/events

**Description**: Create a new event (creates both blockchain event and Google Calendar event).

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
contractEventId: "1" (from smart contract)
```

**Response** (201):
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
      "createdAt": "2025-10-21T14:00:00.000Z",
      "ticketsSold": 0
    }
  },
  "message": "Event created successfully"
}
```

**Errors**:
- `400`: Validation error (missing fields, invalid date, etc.)
- `401`: Unauthorized or Google Calendar not connected
- `413`: Image file too large (>8MB)
- `500`: Failed to create Google Calendar event

---

### GET /api/events

**Description**: Get list of active events with pagination and filtering.

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

**Description**: Initiate ticket purchase (creates ticket with 'created' status).

**Authentication**: Required

**Request**:
```json
{
  "eventId": "652f9b4c3d2e5f6a7b8c9d0e",
  "buyerEmail": "buyer@example.com"
}
```

**Response** (201):
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

**Errors**:
- `400`: Event sold out, event has started, or user already purchased
- `401`: Unauthorized
- `404`: Event not found

---

### POST /api/tickets/confirm

**Description**: Confirm blockchain transaction and add to Google Calendar.

**Authentication**: Required

**Request**:
```json
{
  "ticketId": "652fac5d4e3f6a7b8c9d0e1f",
  "transactionHash": "0x1234567890abcdef..."
}
```

**Processing Steps**:
1. Verify transaction on blockchain
2. Update ticket status to 'blockchain_added'
3. Add buyer to Google Calendar event
4. Update ticket status to 'calendar_added'
5. Send confirmation email

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
- `400`: Invalid transaction, transaction already used, or ticket not found
- `401`: Unauthorized
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
| `UNAUTHORIZED` | No token or invalid token | 401 |
| `TOKEN_EXPIRED` | JWT token has expired | 401 |
| `FORBIDDEN` | User doesn't have permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `DUPLICATE_ERROR` | Resource already exists | 409 |
| `EVENT_SOLD_OUT` | No tickets available | 400 |
| `EVENT_STARTED` | Event has already started | 400 |
| `ALREADY_PURCHASED` | User already bought ticket | 400 |
| `CANNOT_EDIT` | Cannot edit field after tickets sold | 400 |
| `CANNOT_DELETE` | Cannot delete event with tickets | 400 |
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
    "code": "TOKEN_EXPIRED",
    "message": "Token expired, please reconnect wallet"
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
| `401` | Unauthorized | No token, invalid token, or expired token |
| `403` | Forbidden | Valid token but insufficient permissions |
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
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Common Response Headers

```
Content-Type: application/json
X-Request-ID: <unique_request_id>
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

1. **Always include Authorization header** for protected endpoints
2. **Handle token expiry** - Show "Please reconnect wallet" message on 401 with TOKEN_EXPIRED
3. **Convert timestamps** - All timestamps are UTC, use moment.js to convert to user's timezone
4. **PYUSD decimals** - API returns price with 2 decimals, convert to 6 decimals for blockchain
5. **Pagination** - Always use pagination for lists to avoid performance issues
6. **Error handling** - Display error.message to users, log error.code for debugging
7. **Image uploads** - Use FormData for multipart/form-data requests
8. **Retry logic** - Implement retry for network failures and 503 errors

---

**Document Version**: 1.0  
**Status**: Ready for Implementation

