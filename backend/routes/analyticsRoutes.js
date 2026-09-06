const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getSavingsGraph,
  getRecentTransactions
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/savings', getSavingsGraph);
router.get('/recent-transactions', getRecentTransactions);

module.exports = router;
