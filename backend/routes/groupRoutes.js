const express = require('express');
const router = express.Router();
const {
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addGroupExpense, deleteGroupExpense, getSettlements, settleDebt
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { groupValidator, groupExpenseValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/', getGroups);
router.get('/:id', mongoIdValidator, getGroup);
router.post('/', groupValidator, createGroup);
router.put('/:id', mongoIdValidator, updateGroup);
router.delete('/:id', mongoIdValidator, deleteGroup);
router.post('/:id/expenses', mongoIdValidator, groupExpenseValidator, addGroupExpense);
router.delete('/:groupId/expenses/:expenseId', deleteGroupExpense);
router.get('/:id/settlements', mongoIdValidator, getSettlements);
router.patch('/settlements/:settlementId/settle', settleDebt);

module.exports = router;
