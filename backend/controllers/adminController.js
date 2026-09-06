const User = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  const [
    totalUsers, activeUsers, totalExpenses, totalIncome,
    newUsersThisMonth, totalTransactions
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', isActive: true }),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    User.countDocuments({
      role: 'user',
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    }),
    Expense.countDocuments().then(ec => Income.countDocuments().then(ic => ec + ic))
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersThisMonth,
      totalExpenses: totalExpenses[0]?.total || 0,
      totalExpenseCount: totalExpenses[0]?.count || 0,
      totalIncome: totalIncome[0]?.total || 0,
      totalIncomeCount: totalIncome[0]?.count || 0,
      totalTransactions
    }
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const filter = { role: 'user' };
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    users
  });
};

// @desc    Get user by ID (admin)
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const [expenseStats, incomeStats] = await Promise.all([
    Expense.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Income.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    user,
    stats: {
      totalExpenses: expenseStats[0]?.total || 0,
      expenseCount: expenseStats[0]?.count || 0,
      totalIncome: incomeStats[0]?.total || 0,
      incomeCount: incomeStats[0]?.count || 0
    }
  });
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? '✅ activated' : '🚫 deactivated'} successfully.`,
    isActive: user.isActive
  });
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });

  await Promise.all([
    User.findByIdAndDelete(req.params.id),
    Expense.deleteMany({ user: req.params.id }),
    Income.deleteMany({ user: req.params.id }),
    Budget.deleteMany({ user: req.params.id })
  ]);

  res.status(200).json({ success: true, message: '🗑️ User and all associated data deleted.' });
};

// @desc    Get monthly user registration trend
// @route   GET /api/admin/user-trend
// @access  Admin
const getUserTrend = async (req, res) => {
  const trend = await User.aggregate([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json({ success: true, trend: trend.reverse() });
};

module.exports = { getStats, getAllUsers, getUserById, toggleUserStatus, deleteUser, getUserTrend };
