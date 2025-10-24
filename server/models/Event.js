const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    contractEventId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,  // Allows multiple null values while keeping uniqueness
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
// eventSchema.index({ contractEventId: 1 });
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

// Method to check if price can be edited
eventSchema.methods.canEditPrice = async function() {
  const Ticket = mongoose.model('Ticket');
  const ticketCount = await Ticket.countDocuments({ 
    event: this._id,
    status: { $in: ['blockchain_added', 'calendar_added'] }
  });
  return ticketCount === 0;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

