const express = require('express');
const router = express.Router();
const {
  register, login, getMe, forgotPassword, resetPassword,
  changePassword, updateProfile, uploadAvatar, logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  registerValidator, loginValidator,
  forgotPasswordValidator, resetPasswordValidator
} = require('../middleware/validate');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidator, resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
