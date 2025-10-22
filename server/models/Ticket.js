const mongoose = require('mongoose');

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

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;

