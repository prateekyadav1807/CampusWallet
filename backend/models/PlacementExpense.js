const mongoose = require('mongoose');

const placementExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 150
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Courses', 'Certifications', 'Interview Preparation', 'Books', 'Online Platforms', 'Mock Tests', 'Resume Building', 'Coaching', 'Other']
  },
  platform: {
    type: String,
    trim: true,
    maxlength: 100
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'completed'
  },
  outcome: {
    type: String,
    trim: true,
    maxlength: 300
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

placementExpenseSchema.index({ user: 1, date: -1 });
placementExpenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('PlacementExpense', placementExpenseSchema);
