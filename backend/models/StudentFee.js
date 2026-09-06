const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  receiptNumber: { type: String, trim: true }
}, { _id: false });

const studentFeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  feeType: {
    type: String,
    required: [true, 'Fee type is required'],
    enum: ['Semester Fee', 'Hostel Fee', 'Exam Fee', 'Placement Fee', 'Lab Fee', 'Library Fee', 'Activity Fee', 'Other'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 150
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  semester: {
    type: Number,
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    trim: true
  },
  installments: [installmentSchema],
  status: {
    type: String,
    enum: ['paid', 'partially_paid', 'pending', 'overdue'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual: due amount
studentFeeSchema.virtual('dueAmount').get(function () {
  return this.totalAmount - this.paidAmount;
});

// Virtual: payment percentage
studentFeeSchema.virtual('paymentPercentage').get(function () {
  return this.totalAmount > 0 ? Math.round((this.paidAmount / this.totalAmount) * 100) : 0;
});

studentFeeSchema.index({ user: 1, dueDate: 1 });
studentFeeSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('StudentFee', studentFeeSchema);
