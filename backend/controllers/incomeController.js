const Income = require('../models/Income');

// @desc    Get all income
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res) => {
  const {
    page = 1, limit = 20, type, search,
    startDate, endDate, sortBy = 'date', sortOrder = 'desc'
  } = req.query;

  const filter = { user: req.user._id };
  if (type && type !== 'All') filter.type = type;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [incomes, total] = await Promise.all([
    Income.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).lean(),
    Income.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: incomes.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    incomes
  });
};

// @desc    Get income by ID
// @route   GET /api/income/:id
// @access  Private
const getIncome = async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
  if (!income) return res.status(404).json({ success: false, message: 'Income record not found.' });
  res.status(200).json({ success: true, income });
};

// @desc    Create income
// @route   POST /api/income
// @access  Private
const createIncome = async (req, res) => {
  const income = await Income.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, message: '💰 Income added successfully.', income });
};

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res) => {
  const income = await Income.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!income) return res.status(404).json({ success: false, message: 'Income record not found.' });
  res.status(200).json({ success: true, message: '✅ Income updated successfully.', income });
};

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!income) return res.status(404).json({ success: false, message: 'Income record not found.' });
  res.status(200).json({ success: true, message: '🗑️ Income deleted successfully.' });
};

// @desc    Get income stats
// @route   GET /api/income/stats
// @access  Private
const getIncomeStats = async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const [typeStats, totalResult] = await Promise.all([
    Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]),
    Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total: totalResult[0]?.total || 0,
      count: totalResult[0]?.count || 0,
      byType: typeStats
    }
  });
};

module.exports = { getIncomes, getIncome, createIncome, updateIncome, deleteIncome, getIncomeStats };
