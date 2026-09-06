const express = require('express');
const router = express.Router();
const {
  getSubscriptions, getSubscription, createSubscription,
  updateSubscription, deleteSubscription, getUpcomingRenewals
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { subscriptionValidator, mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/upcoming', getUpcomingRenewals);
router.get('/', getSubscriptions);
router.get('/:id', mongoIdValidator, getSubscription);
router.post('/', subscriptionValidator, createSubscription);
router.put('/:id', mongoIdValidator, updateSubscription);
router.delete('/:id', mongoIdValidator, deleteSubscription);

module.exports = router;
