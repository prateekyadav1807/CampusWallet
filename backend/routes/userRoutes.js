const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

// @desc    Search users by email (for group invites)
// @route   GET /api/users/search?email=
router.get('/search', protect, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Email query required.' });

  const users = await User.find({
    email: { $regex: email, $options: 'i' },
    _id: { $ne: req.user._id },
    isActive: true
  }).select('name email avatar').limit(5);

  res.status(200).json({ success: true, users });
});

module.exports = router;
