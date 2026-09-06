const express = require('express');
const router = express.Router();
const {
  getStats, getAllUsers, getUserById,
  toggleUserStatus, deleteUser, getUserTrend
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const { mongoIdValidator } = require('../middleware/validate');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/user-trend', getUserTrend);
router.get('/users', getAllUsers);
router.get('/users/:id', mongoIdValidator, getUserById);
router.patch('/users/:id/toggle-status', mongoIdValidator, toggleUserStatus);
router.delete('/users/:id', mongoIdValidator, deleteUser);

module.exports = router;
