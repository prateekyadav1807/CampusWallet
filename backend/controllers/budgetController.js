const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get budget for a specific month/year
// @route   GET /api/budgets?month=&year=
// @access  Private
const getBudget = async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  const budget = await Budget.findOne({ user: req.user._id, month, year });

  if (!budget) {
    return res.status(200).json({ success: true, budget: null, message: 'No budget set for this period.' });
  }

  // Calculate total spent
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [spentResult, categorySpent] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ])
  ]);

  const totalSpent = spentResult[0]?.total || 0;
  const remaining = budget.totalBudget - totalSpent;
  const usedPercentage = Math.round((totalSpent / budget.totalBudget) * 100);

  // Calculate daily spending limit
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const remainingDays = (month === now.getMonth() + 1 && year === now.getFullYear())
    ? daysInMonth - today.getDate() + 1
    : daysInMonth;
  const dailyLimit = remaining > 0 ? remaining / remainingDays : 0;

  // Category breakdown
  const categoryBreakdown = budget.categoryBudgets.map(cb => {
    const spent = categorySpent.find(c => c._id === cb.category)?.total || 0;
    return {
      category: cb.category,
      limit: cb.limit,
      spent,
      remaining: cb.limit - spent,
      percentage: Math.round((spent / cb.limit) * 100)
    };
  });

  res.status(200).json({
    success: true,
    budget: {
      ...budget.toObject(),
      totalSpent,
      remaining,
      usedPercentage,
      dailyLimit: parseFloat(dailyLimit.toFixed(2)),
      remainingDays,
      categoryBreakdown,
      isOverBudget: totalSpent > budget.totalBudget
    }
  });
};

// @desc    Get all budgets
// @route   GET /api/budgets/all
// @access  Private
const getAllBudgets = async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id }).sort({ year: -1, month: -1 });
  res.status(200).json({ success: true, count: budgets.length, budgets });
};

// @desc    Create or update budget
// @route   POST /api/budgets
// @access  Private
const createOrUpdateBudget = async (req, res) => {
  const { month, year, totalBudget, categoryBudgets, notes, alertThreshold } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, month, year },
    { totalBudget, categoryBudgets, notes, alertThreshold },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, message: '💼 Budget saved successfully.', budget });
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found.' });
  res.status(200).json({ success: true, message: '🗑️ Budget deleted successfully.' });
};

module.exports = { getBudget, getAllBudgets, createOrUpdateBudget, deleteBudget };
