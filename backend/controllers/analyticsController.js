const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [expenseResult, incomeResult, budget, allTimeExpense, allTimeIncome] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Budget.findOne({ user: req.user._id, month, year }),
    Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Income.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalExpenses = expenseResult[0]?.total || 0;
  const totalIncome = incomeResult[0]?.total || 0;
  const totalSavings = totalIncome - totalExpenses;
  const monthlyBudget = budget?.totalBudget || 0;
  const remainingBudget = monthlyBudget - totalExpenses;
  const allTimeBalance = (allTimeIncome[0]?.total || 0) - (allTimeExpense[0]?.total || 0);

  res.status(200).json({
    success: true,
    summary: {
      totalIncome,
      totalExpenses,
      totalSavings,
      monthlyBudget,
      remainingBudget,
      currentBalance: allTimeBalance,
      budgetUsedPercentage: monthlyBudget > 0 ? Math.round((totalExpenses / monthlyBudget) * 100) : 0,
      expenseCount: expenseResult[0]?.count || 0,
      incomeCount: incomeResult[0]?.count || 0,
      month,
      year
    }
  });
};

// @desc    Get monthly trend (last 6 months)
// @route   GET /api/analytics/monthly-trend
// @access  Private
const getMonthlyTrend = async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const [expenseTrend, incomeTrend] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  // Build full months array
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trend = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const expData = expenseTrend.find(e => e._id.month === m && e._id.year === y);
    const incData = incomeTrend.find(e => e._id.month === m && e._id.year === y);
    trend.push({
      month: monthNames[m - 1],
      year: y,
      expenses: expData?.total || 0,
      income: incData?.total || 0,
      savings: (incData?.total || 0) - (expData?.total || 0)
    });
  }

  res.status(200).json({ success: true, trend });
};

// @desc    Get category wise breakdown
// @route   GET /api/analytics/category-breakdown
// @access  Private
const getCategoryBreakdown = async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const breakdown = await Expense.aggregate([
    { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  const totalExpenses = breakdown.reduce((s, b) => s + b.total, 0);
  const result = breakdown.map(b => ({
    category: b._id,
    total: b.total,
    count: b.count,
    percentage: totalExpenses > 0 ? parseFloat(((b.total / totalExpenses) * 100).toFixed(1)) : 0
  }));

  res.status(200).json({ success: true, breakdown: result, totalExpenses });
};

// @desc    Get savings graph (last N months)
// @route   GET /api/analytics/savings
// @access  Private
const getSavingsGraph = async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const [expenseData, incomeData] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate } } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } }
    ]),
    Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate } } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } }
    ])
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const savings = [];
  let cumulativeSavings = 0;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const exp = expenseData.find(e => e._id.month === m && e._id.year === y)?.total || 0;
    const inc = incomeData.find(e => e._id.month === m && e._id.year === y)?.total || 0;
    cumulativeSavings += inc - exp;
    savings.push({
      month: monthNames[m - 1],
      savings: inc - exp,
      cumulative: parseFloat(cumulativeSavings.toFixed(2))
    });
  }

  res.status(200).json({ success: true, savings });
};

// @desc    Get recent transactions (combined)
// @route   GET /api/analytics/recent-transactions
// @access  Private
const getRecentTransactions = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const [expenses, incomes] = await Promise.all([
    Expense.find({ user: req.user._id }).sort({ date: -1 }).limit(limit).lean(),
    Income.find({ user: req.user._id }).sort({ date: -1 }).limit(limit).lean()
  ]);

  const transactions = [
    ...expenses.map(e => ({ ...e, transactionType: 'expense' })),
    ...incomes.map(i => ({ ...i, transactionType: 'income' }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  res.status(200).json({ success: true, transactions });
};

module.exports = {
  getDashboardSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getSavingsGraph,
  getRecentTransactions
};
