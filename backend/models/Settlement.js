const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  from: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true }
  },
  to: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true }
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: {
    type: String,
    enum: ['pending', 'settled', 'partial'],
    default: 'pending'
  },
  settledAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'],
    default: 'UPI'
  }
}, {
  timestamps: true
});

settlementSchema.index({ group: 1, status: 1 });

module.exports = mongoose.model('Settlement', settlementSchema);
