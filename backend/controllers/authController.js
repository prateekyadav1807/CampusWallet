const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id, user.role);
  // Build avatarUrl explicitly so it's always correct
  const avatarUrl = user.avatar
    ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${user.avatar}`
    : null;
  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    avatarUrl,
    college: user.college,
    course: user.course,
    semester: user.semester,
    phone: user.phone,
    currency: user.currency,
    theme: user.theme,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt
  };
  res.status(statusCode).json({ success: true, message, token, user: userObj });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const {
    name, email, password, college, course,
    branch, yearOfStudy, semester, studentId, graduationYear,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: '📧 Email already registered. Please login.' });
  }

  // Strip empty-string optional fields so Mongoose enum/min validators don't fire
  const userData = {
    name, email, password, college, course,
    ...(branch         && { branch }),
    ...(yearOfStudy    && { yearOfStudy }),
    ...(semester       && { semester: parseInt(semester) }),
    ...(studentId      && { studentId }),
    ...(graduationYear && { graduationYear: parseInt(graduationYear) }),
  };

  const user = await User.create(userData);

  // Send welcome email (non-blocking)
  try { await sendWelcomeEmail(user); } catch (e) { /* ignore email errors */ }

  sendTokenResponse(user, 201, res, '🎉 Account created successfully! Welcome to TrackWise.');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: '❌ Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: '🚫 Account deactivated. Contact support.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: '❌ Invalid email or password.' });
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, `👋 Welcome back, ${user.name}!`);
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  const avatarUrl = user.avatar
    ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${user.avatar}`
    : null;
  res.status(200).json({ success: true, user: { ...user.toObject(), avatarUrl } });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message: '📬 If that email exists, a reset link has been sent.'
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  try {
    await sendPasswordResetEmail(user, resetUrl);
    res.status(200).json({ success: true, message: '📬 Password reset email sent successfully.' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ success: false, message: '📧 Failed to send email. Please try again.' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ success: false, message: '⏰ Password reset link is invalid or has expired.' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, '🔐 Password reset successful! You are now logged in.');
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: '❌ Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: '🔐 Password changed successfully.' });
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  const allowedFields = ['name', 'college', 'course', 'semester', 'phone', 'currency', 'theme'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true
  });

  res.status(200).json({ success: true, message: '✅ Profile updated successfully.', user });
};

// @desc    Upload avatar
// @route   PUT /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '📁 Please upload an image file.' });
  }

  // Delete old avatar
  const currentUser = await User.findById(req.user._id);
  if (currentUser.avatar) {
    const oldPath = path.join(__dirname, '../uploads/avatars', currentUser.avatar);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.filename },
    { new: true }
  );

  const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${user.avatar}`;

  res.status(200).json({
    success: true,
    message: 'Profile picture updated successfully.',
    avatar: user.avatar,
    avatarUrl,
  });
};

// @desc    Logout (client-side token removal; optionally blacklist)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({ success: true, message: '👋 Logged out successfully.' });
};

module.exports = {
  register, login, getMe, forgotPassword, resetPassword,
  changePassword, updateProfile, uploadAvatar, logout
};
