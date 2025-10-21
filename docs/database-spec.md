# Ticketify Database Specification

**Version**: 1.0  
**Database**: MongoDB with Mongoose ODM  
**Last Updated**: October 21, 2025

---

## Overview

This document defines all database schemas, indexes, and relationships for the Ticketify platform. All timestamps are stored in UTC and converted to user's local timezone on the frontend using moment.js.

---

## Collections

### 1. Users Collection

Stores user account information and Google Calendar OAuth tokens.

**Collection Name**: `users`

**Schema Definition**:

```javascript
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      index: true,
      lowercase: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address']
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    isGoogleCalendarAdded: {
      type: Boolean,
      default: false
    },
    googleCalendar: {
      access_token: {
        type: String,
        select: false  // Don't include in queries by default for security
      },
      scope: {
        type: String,
        default: 'https://www.googleapis.com/auth/calendar'
      },
      token_type: {
        type: String,
        default: 'Bearer'
      },
      refresh_token: {
        type: String,
        select: false  // Don't include in queries by default for security
      },
      expiry_date: {
        type: Date
      }
    }
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for events created by user
userSchema.virtual('eventsCreated', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'owner'
});

// Method to check if Google Calendar is connected and token is valid
userSchema.methods.hasValidGoogleToken = function() {
  return this.isGoogleCalendarAdded && 
         this.googleCalendar.access_token && 
         this.googleCalendar.expiry_date > new Date();
};
```

**Field Descriptions**:

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB document ID |
| `email` | String | Yes | Yes | Yes | User's email address (lowercase) |
| `walletAddress` | String | Yes | Yes | Yes | Ethereum wallet address (lowercase, 0x...) |
| `name` | String | Yes | No | No | User's display name |
| `isGoogleCalendarAdded` | Boolean | No | No | No | Whether Google Calendar is connected |
| `googleCalendar.access_token` | String | No | No | No | Google OAuth access token (encrypted) |
| `googleCalendar.scope` | String | No | No | No | Google Calendar API scope |
| `googleCalendar.token_type` | String | No | No | No | Token type (Bearer) |
| `googleCalendar.refresh_token` | String | No | No | No | Google OAuth refresh token (encrypted) |
| `googleCalendar.expiry_date` | Date | No | No | No | Token expiration timestamp |
| `createdAt` | Date | Auto | No | Yes | Account creation timestamp (UTC) |
| `updatedAt` | Date | Auto | No | No | Last update timestamp (UTC) |

**Constraints**:
- One wallet address per account (strict 1:1 mapping)
- Email must be unique and valid format
- Wallet address must be valid Ethereum address format (0x + 40 hex chars)

---

### 2. Events Collection

Stores event information including Google Calendar integration details.

**Collection Name**: `events`

**Schema Definition**:

```javascript
const eventSchema = new mongoose.Schema(
  {
    contractEventId: {
      type: String,
      required: [true, 'Contract event ID is required'],
      unique: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Event owner is required'],
      ref: 'User',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    imageUrl: {
      type: String,  // Base64 encoded image
      required: false
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
      index: true
    },
    duration: {
      type: Number,  // Duration in minutes
      required: [true, 'Event duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
      max: [1440, 'Duration cannot exceed 24 hours']
    },
    price: {
      type: Number,  // Price in PYUSD (with 2 decimal places)
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(value) {
          // Ensure max 2 decimal places
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: 'Price can have maximum 2 decimal places'
      }
    },
    maxAttendees: {
      type: Number,
      required: [true, 'Maximum attendees is required'],
      min: [1, 'Must allow at least 1 attendee'],
      max: [10000, 'Cannot exceed 10,000 attendees']
    },
    googleCalendarId: {
      type: String,  // Google Calendar event ID
      required: false
    },
    googleMeetLink: {
      type: String,  // Google Meet conference link
      required: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
eventSchema.index({ contractEventId: 1 });
eventSchema.index({ owner: 1 });
eventSchema.index({ dateTime: 1 });
eventSchema.index({ isActive: 1, dateTime: 1 });
eventSchema.index({ isActive: 1, isDeleted: 1, dateTime: 1 });

// Compound index for organizer's events
eventSchema.index({ owner: 1, dateTime: -1 });

// Text index for search functionality
eventSchema.index({ title: 'text', description: 'text' });

// Virtual for tickets sold
eventSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'event'
});

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  return this.dateTime > new Date();
};

// Method to check if event has started
eventSchema.methods.hasStarted = function() {
  return this.dateTime <= new Date();
};

// Method to check if tickets can be edited
eventSchema.methods.canEditPrice = async function() {
  const Ticket = mongoose.model('Ticket');
  const ticketCount = await Ticket.countDocuments({ 
    event: this._id,
    status: { $in: ['blockchain_added', 'calendar_added'] }
  });
  return ticketCount === 0;
};
```

**Field Descriptions**:

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB document ID |
| `contractEventId` | String | Yes | Yes | Yes | Event ID from smart contract |
| `owner` | ObjectId | Yes | No | Yes | Reference to User document |
| `title` | String | Yes | No | Text | Event title (3-200 chars) |
| `description` | String | Yes | No | Text | Event description (10-5000 chars) |
| `imageUrl` | String | No | No | No | Base64 encoded banner image (max 8MB) |
| `dateTime` | Date | Yes | No | Yes | Event start date/time (UTC) |
| `duration` | Number | Yes | No | No | Duration in minutes (15-1440) |
| `price` | Number | Yes | No | No | Ticket price in PYUSD (max 2 decimals) |
| `maxAttendees` | Number | Yes | No | No | Maximum ticket capacity (1-10000) |
| `googleCalendarId` | String | No | No | No | Google Calendar event ID |
| `googleMeetLink` | String | No | No | No | Google Meet conference URL |
| `isActive` | Boolean | No | No | Yes | Whether event is active |
| `isDeleted` | Boolean | No | No | No | Soft delete flag |
| `createdAt` | Date | Auto | No | No | Creation timestamp (UTC) |
| `updatedAt` | Date | Auto | No | No | Last update timestamp (UTC) |

**Constraints**:
- After tickets sold: Only title, description, imageUrl can be updated
- Cannot delete event if tickets sold (set isActive = false instead)
- DateTime must be in the future when creating
- Duration: 15 minutes to 24 hours
- Price: Max 2 decimal places

---

### 3. Tickets Collection

Stores ticket purchase information with three-state flow.

**Collection Name**: `tickets`

**Schema Definition**:

```javascript
const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Event reference is required'],
      ref: 'Event',
      index: true
    },
    buyerWalletAddress: {
      type: String,
      required: [true, 'Buyer wallet address is required'],
      lowercase: true,
      index: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address']
    },
    buyerEmail: {
      type: String,
      required: [true, 'Buyer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    transactionHash: {
      type: String,
      unique: true,
      sparse: true,  // Allow multiple null values, but unique when set
      lowercase: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash']
    },
    status: {
      type: String,
      enum: {
        values: ['created', 'blockchain_added', 'calendar_added'],
        message: 'Status must be: created, blockchain_added, or calendar_added'
      },
      default: 'created',
      index: true
    },
    priceAtPurchase: {
      type: Number,  // Store price at time of purchase
      required: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ticketSchema.index({ event: 1, buyerWalletAddress: 1 }, { unique: true });  // One ticket per wallet per event
ticketSchema.index({ buyerWalletAddress: 1, createdAt: -1 });
ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ transactionHash: 1 });
ticketSchema.index({ status: 1, createdAt: 1 });

// Method to check if ticket is confirmed
ticketSchema.methods.isConfirmed = function() {
  return this.status === 'calendar_added';
};
```

**Field Descriptions**:

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB document ID |
| `event` | ObjectId | Yes | No | Yes | Reference to Event document |
| `buyerWalletAddress` | String | Yes | No | Yes | Buyer's Ethereum wallet address |
| `buyerEmail` | String | Yes | No | No | Buyer's email for calendar invite |
| `transactionHash` | String | No | Yes | Yes | Blockchain transaction hash |
| `status` | String | Yes | No | Yes | Ticket state: created/blockchain_added/calendar_added |
| `priceAtPurchase` | Number | No | No | No | Price paid at purchase time |
| `createdAt` | Date | Auto | No | Yes | Purchase initiation timestamp (UTC) |
| `updatedAt` | Date | Auto | No | No | Last update timestamp (UTC) |

**Ticket State Flow**:
1. `created` → Initial state when purchase initiated
2. `blockchain_added` → Blockchain transaction confirmed
3. `calendar_added` → Successfully added to Google Calendar (final state)

**Constraints**:
- Compound unique index: (event + buyerWalletAddress) - one ticket per wallet per event
- Transaction hash must be unique when set
- Email must be valid format

---

## Relationships

```
User (1) ----< (N) Event
  |
  |
  └─ googleCalendar (embedded)

Event (1) ----< (N) Ticket
  |
  └─ owner → User

Ticket (N) ----< (1) Event
  |
  └─ buyerWalletAddress (no direct ref to User)
```

---

## Data Validation Rules

### User Model
- Email: Must be unique, valid format, lowercase
- Wallet Address: Must be unique, valid Ethereum format (0x + 40 hex), lowercase
- Name: 2-100 characters
- Google tokens: Stored with `select: false` for security

### Event Model
- Title: 3-200 characters
- Description: 10-5000 characters
- DateTime: Must be future date when creating
- Duration: 15-1440 minutes (15 min to 24 hours)
- Price: Non-negative, max 2 decimal places
- MaxAttendees: 1-10,000

### Ticket Model
- One ticket per (event + walletAddress) combination
- Transaction hash: Valid Ethereum tx hash format (0x + 64 hex)
- Status: Must be one of the three states

---

## Common Queries

### Find User by Wallet
```javascript
const user = await User.findOne({ walletAddress: address.toLowerCase() });
```

### Find User's Events
```javascript
const events = await Event.find({ 
  owner: userId,
  isDeleted: false 
})
.sort({ dateTime: -1 });
```

### Find Upcoming Active Events
```javascript
const events = await Event.find({
  isActive: true,
  isDeleted: false,
  dateTime: { $gt: new Date() }
})
.populate('owner', 'name walletAddress')
.sort({ dateTime: 1 })
.limit(20);
```

### Find User's Tickets
```javascript
const tickets = await Ticket.find({
  buyerWalletAddress: address.toLowerCase(),
  status: 'calendar_added'
})
.populate({
  path: 'event',
  populate: { path: 'owner', select: 'name' }
})
.sort({ createdAt: -1 });
```

### Get Tickets Sold for Event
```javascript
const ticketCount = await Ticket.countDocuments({
  event: eventId,
  status: { $in: ['blockchain_added', 'calendar_added'] }
});
```

### Check if User Purchased Ticket
```javascript
const hasPurchased = await Ticket.exists({
  event: eventId,
  buyerWalletAddress: address.toLowerCase(),
  status: { $in: ['blockchain_added', 'calendar_added'] }
});
```

---

## Indexes Summary

### User Collection
- `{ walletAddress: 1 }` - Unique
- `{ email: 1 }` - Unique
- `{ createdAt: -1 }` - For sorting

### Event Collection
- `{ contractEventId: 1 }` - Unique
- `{ owner: 1 }` - For organizer's events
- `{ dateTime: 1 }` - For sorting/filtering
- `{ isActive: 1, dateTime: 1 }` - For active events list
- `{ owner: 1, dateTime: -1 }` - Compound for dashboard
- `{ title: 'text', description: 'text' }` - For search

### Ticket Collection
- `{ event: 1, buyerWalletAddress: 1 }` - Compound unique
- `{ buyerWalletAddress: 1, createdAt: -1 }` - For user's tickets
- `{ event: 1, status: 1 }` - For event's tickets
- `{ transactionHash: 1 }` - Unique, sparse
- `{ status: 1, createdAt: 1 }` - For status queries

---

## Migration Notes

**Initial Setup**:
1. Create indexes after schema definition
2. Test with sample data before production
3. Monitor index performance and adjust as needed

**Future Considerations**:
- Add `categories` or `tags` field to Event for filtering
- Add `rating` and `reviews` to Event
- Add `refunded` status to Ticket for future refund functionality
- Consider sharding strategy if scale exceeds 1M documents

---

**Document Version**: 1.0  
**Status**: Ready for Implementation

