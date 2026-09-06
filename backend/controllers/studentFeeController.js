const StudentFee = require('../models/StudentFee');

const getStudentFees = async (req, res) => {
  const { status, feeType } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (feeType) filter.feeType = feeType;

  const fees = await StudentFee.find(filter).sort({ dueDate: 1 });

  const summary = {
    totalFees: fees.reduce((s, f) => s + f.totalAmount, 0),
    totalPaid: fees.reduce((s, f) => s + f.paidAmount, 0),
    totalDue: fees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0),
    overdueFees: fees.filter(f => f.status === 'overdue').length,
    pendingFees: fees.filter(f => f.status === 'pending').length
  };

  res.status(200).json({ success: true, count: fees.length, summary, fees });
};

const getStudentFee = async (req, res) => {
  const fee = await StudentFee.findOne({ _id: req.params.id, user: req.user._id });
  if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
  res.status(200).json({ success: true, fee });
};

const createStudentFee = async (req, res) => {
  const fee = await StudentFee.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, message: '🎓 Fee record added successfully.', fee });
};

const updateStudentFee = async (req, res) => {
  const { paidAmount, status, ...rest } = req.body;

  const fee = await StudentFee.findOne({ _id: req.params.id, user: req.user._id });
  if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

  Object.assign(fee, rest);
  if (paidAmount !== undefined) fee.paidAmount = paidAmount;

  // Auto-compute status
  if (fee.paidAmount >= fee.totalAmount) {
    fee.status = 'paid';
  } else if (fee.paidAmount > 0) {
    fee.status = 'partially_paid';
  } else if (new Date(fee.dueDate) < new Date() && fee.paidAmount === 0) {
    fee.status = 'overdue';
  } else {
    fee.status = status || 'pending';
  }

  await fee.save();
  res.status(200).json({ success: true, message: '✅ Fee record updated.', fee });
};

const deleteStudentFee = async (req, res) => {
  const fee = await StudentFee.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
  res.status(200).json({ success: true, message: '🗑️ Fee record deleted.' });
};

module.exports = { getStudentFees, getStudentFee, createStudentFee, updateStudentFee, deleteStudentFee };
