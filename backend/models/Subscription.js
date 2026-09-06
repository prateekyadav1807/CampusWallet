const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  platform: {
    type: String,
    enum: ['Netflix', 'Spotify', 'ChatGPT', 'Amazon Prime', 'Coursera', 'Udemy', 'YouTube Premium', 'Disney+', 'Hotstar', 'LinkedIn Premium', 'GitHub Copilot', 'Other'],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  nextRenewalDate: {
    type: Date,
    required: [true, 'Next renewal date is required']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  reminderDays: {
    type: Number,
    default: 3,
    min: 1,
    max: 30
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  },
  category: {
    type: String,
    enum: ['Entertainment', 'Education', 'Productivity', 'Health', 'Other'],
    default: 'Entertainment'
  },
  logo: {
    type: String
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ user: 1, nextRenewalDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
