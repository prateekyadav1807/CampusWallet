const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const Budget = require('../models/Budget');

// Helper: check and create budget alert notification
const checkBudgetAlert = async (userId, month, year) => {
  try {
    const budget = await Budget.findOne({ user: userId, month, year });
    if (!budget) return;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = result[0]?.total || 0;
    const percentage = (totalSpent / budget.totalBudget) * 100;
    const threshold = budget.alertThreshold || 80;

    if (percentage >= 100) {
      await Notification.create({
        user: userId,
        title: '🚨 Budget Exceeded!',
        message: `You have exceeded your monthly budget of ₹${budget.totalBudget}. Total spent: ₹${totalSpent.toFixed(0)}`,
        type: 'budget_exceeded',
        priority: 'critical',
        actionUrl: '/budget'
      });
    } else if (percentage >= threshold) {
      await Notification.create({
        user: userId,
        title: '⚠️ Budget Alert',
        message: `You've used ${percentage.toFixed(0)}% of your ₹${budget.totalBudget} monthly budget.`,
        type: 'budget_alert',
        priority: 'high',
        actionUrl: '/budget'
      });
    }
  } catch (_) { /* non-blocking */ }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  const {
    page = 1, limit = 20, category, search,
    startDate, endDate, minAmount, maxAmount, sortBy = 'date', sortOrder = 'desc'
  } = req.query;

  const filter = { user: req.user._id };
  if (category && category !== 'All') filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = parseFloat(minAmount);
    if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).lean(),
    Expense.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: expenses.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    expenses
  });
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
  res.status(200).json({ success: true, expense });
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const expense = await Expense.create({ ...req.body, user: req.user._id });

  // Async budget check
  const date = new Date(expense.date);
  checkBudgetAlert(req.user._id, date.getMonth() + 1, date.getFullYear());

  res.status(201).json({ success: true, message: '💸 Expense added successfully.', expense });
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
  res.status(200).json({ success: true, message: '✅ Expense updated successfully.', expense });
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
  res.status(200).json({ success: true, message: '🗑️ Expense deleted successfully.' });
};

// @desc    Get expense summary stats
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const [categoryStats, totalResult] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total: totalResult[0]?.total || 0,
      count: totalResult[0]?.count || 0,
      byCategory: categoryStats
    }
  });
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseStats };
