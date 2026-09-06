const express = require('express');
const router = express.Router();
const { getBudget, getAllBudgets, createOrUpdateBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { budgetValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/all', getAllBudgets);
router.get('/', getBudget);
router.post('/', budgetValidator, createOrUpdateBudget);
router.delete('/:id', mongoIdValidator, deleteBudget);

module.exports = router;
