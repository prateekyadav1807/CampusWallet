const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  res.status(200).json({ success: true, count: notifications.length, total, unreadCount, notifications });
};

const markAsRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }
  );
  res.status(200).json({ success: true, message: '✅ Notification marked as read.' });
};

const markAllAsRead = async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  res.status(200).json({ success: true, message: `✅ ${result.modifiedCount} notifications marked as read.` });
};

const deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(200).json({ success: true, message: '🗑️ Notification deleted.' });
};

const clearAllNotifications = async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.status(200).json({ success: true, message: '🗑️ All notifications cleared.' });
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications };
