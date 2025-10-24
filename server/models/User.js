const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [false, 'Email is required'],
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
      required: [false, 'Name is required'],
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
// userSchema.index({ email: 1 });
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

const User = mongoose.model('User', userSchema);

module.exports = User;

