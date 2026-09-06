const express = require('express');
const router = express.Router();
const {
  getExpenses, getExpense, createExpense,
  updateExpense, deleteExpense, getExpenseStats
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { expenseValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/stats', getExpenseStats);
router.get('/', getExpenses);
router.get('/:id', mongoIdValidator, getExpense);
router.post('/', expenseValidator, createExpense);
router.put('/:id', mongoIdValidator, expenseValidator, updateExpense);
router.delete('/:id', mongoIdValidator, deleteExpense);

module.exports = router;
