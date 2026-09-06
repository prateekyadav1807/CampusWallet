const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  isRegistered: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const groupExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidByName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Rent', 'Food', 'Bills', 'Travel', 'Shopping', 'Entertainment', 'Other'],
    default: 'Other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  splits: [{
    memberId: mongoose.Schema.Types.ObjectId,
    memberName: String,
    amount: Number,
    isPaid: { type: Boolean, default: false }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, { _id: true, timestamps: true });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  expenses: [groupExpenseSchema],
  type: {
    type: String,
    enum: ['Flatmates', 'Trip', 'Project', 'Friends', 'Other'],
    default: 'Flatmates'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual: total expenses
groupSchema.virtual('totalExpenses').get(function () {
  return this.expenses.reduce((sum, e) => sum + e.amount, 0);
});

groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Group', groupSchema);
