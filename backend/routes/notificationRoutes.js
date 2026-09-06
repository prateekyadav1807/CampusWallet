const express = require('express');
const router = express.Router();
const {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, clearAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { mongoIdValidator } = require('../middleware/validate');

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.patch('/:id/read', mongoIdValidator, markAsRead);
router.delete('/:id', mongoIdValidator, deleteNotification);

module.exports = router;
