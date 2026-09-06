const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Mess / Food', 'Hostel / Rent', 'Transport', 'Stationery',
      'Books & Notes', 'Coaching', 'Online Courses', 'Outing & Fun',
      'Health & Medical', 'Clothes', 'Exam Fees', 'Tech & Gadgets', 'Miscellaneous',
      /* legacy values kept so old data isn't broken */
      'Food', 'Rent', 'Travel', 'Shopping', 'Gym',
      'Bills', 'Education', 'Entertainment', 'Health'
    ]
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Wallet', 'Other'],
    default: 'UPI'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Compound index for efficient queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, date: -1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
