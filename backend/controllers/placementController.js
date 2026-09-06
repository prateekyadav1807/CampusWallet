const PlacementExpense = require('../models/PlacementExpense');

const getPlacementExpenses = async (req, res) => {
  const { category, status, search } = req.query;
  const filter = { user: req.user._id };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const expenses = await PlacementExpense.find(filter).sort({ date: -1 });

  const categoryStats = await PlacementExpense.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  const totalInvested = expenses.reduce((s, e) => s + e.amount, 0);

  res.status(200).json({
    success: true,
    count: expenses.length,
    totalInvested,
    categoryStats,
    expenses
  });
};

const getPlacementExpense = async (req, res) => {
  const expense = await PlacementExpense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: 'Record not found.' });
  res.status(200).json({ success: true, expense });
};

const createPlacementExpense = async (req, res) => {
  const expense = await PlacementExpense.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, message: '🎯 Placement expense added.', expense });
};

const updatePlacementExpense = async (req, res) => {
  const expense = await PlacementExpense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ success: false, message: 'Record not found.' });
  res.status(200).json({ success: true, message: '✅ Record updated.', expense });
};

const deletePlacementExpense = async (req, res) => {
  const expense = await PlacementExpense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: 'Record not found.' });
  res.status(200).json({ success: true, message: '🗑️ Record deleted.' });
};

module.exports = {
  getPlacementExpenses, getPlacementExpense, createPlacementExpense,
  updatePlacementExpense, deletePlacementExpense
};
