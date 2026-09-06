const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Food', 'Rent', 'Travel', 'Shopping', 'Gym', 'Bills', 'Education', 'Entertainment', 'Health', 'Miscellaneous'],
    required: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [1, 'Budget must be greater than 0']
  },
  categoryBudgets: [categoryBudgetSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 10,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Unique budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
