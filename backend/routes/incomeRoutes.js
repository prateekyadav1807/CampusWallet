const express = require('express');
const router = express.Router();
const {
  getIncomes, getIncome, createIncome,
  updateIncome, deleteIncome, getIncomeStats
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { incomeValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/stats', getIncomeStats);
router.get('/', getIncomes);
router.get('/:id', mongoIdValidator, getIncome);
router.post('/', incomeValidator, createIncome);
router.put('/:id', mongoIdValidator, incomeValidator, updateIncome);
router.delete('/:id', mongoIdValidator, deleteIncome);

module.exports = router;
