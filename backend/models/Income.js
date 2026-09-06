const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Income title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    required: [true, 'Income type is required'],
    enum: [
      'Pocket Money', 'Scholarship', 'Internship', 'Part-time Job',
      'Freelancing', 'Family Transfer', 'Prize / Award', 'Other',
      'Salary',  // legacy
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
  isRecurring: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  }
}, {
  timestamps: true
});

incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Income', incomeSchema);
