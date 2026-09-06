const express = require('express');
const router = express.Router();
const {
  getPlacementExpenses, getPlacementExpense, createPlacementExpense,
  updatePlacementExpense, deletePlacementExpense
} = require('../controllers/placementController');
const { protect } = require('../middleware/auth');
const { placementValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/', getPlacementExpenses);
router.get('/:id', mongoIdValidator, getPlacementExpense);
router.post('/', placementValidator, createPlacementExpense);
router.put('/:id', mongoIdValidator, updatePlacementExpense);
router.delete('/:id', mongoIdValidator, deletePlacementExpense);

module.exports = router;
