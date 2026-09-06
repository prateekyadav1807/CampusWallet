const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  // ── Core auth ──────────────────────────────────────────────────────────────
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, minlength: [2, 'Min 2 characters'], maxlength: [50, 'Max 50 characters'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'], select: false,
  },
  avatar:   { type: String, default: null },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },

  // ── Student profile ────────────────────────────────────────────────────────
  college: {
    type: String, required: [true, 'College / University name is required'],
    trim: true, maxlength: [150, 'College name too long'],
  },
  course: {
    type: String, required: [true, 'Course / Degree is required'],
    trim: true, maxlength: [100, 'Course name too long'],
  },
  branch: {
    // e.g. "Computer Science", "Mechanical Engineering"
    type: String, trim: true, maxlength: [100, 'Branch name too long'],
  },
  yearOfStudy: {
    // e.g. "1st Year", "3rd Year", "PG 1st Year"
    type: String,
    enum: ['1st Year','2nd Year','3rd Year','4th Year','5th Year','PG 1st Year','PG 2nd Year','PhD',''],
    default: '',
  },
  semester: { type: Number, min: 1, max: 12 },
  studentId: {
    // College roll number / registration number
    type: String, trim: true, maxlength: [30, 'Student ID too long'],
  },
  graduationYear: {
    // Expected graduation year e.g. 2026
    type: Number, min: 2020, max: 2040,
  },

  // ── Preferences ───────────────────────────────────────────────────────────
  phone: {
    type: String, trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  currency: { type: String, default: '₹', enum: ['₹', '$', '€', '£', '¥'] },
  theme:    { type: String, default: 'dark', enum: ['dark', 'light'] },

  // Monthly budget auto-reminder (₹)
  monthlyAllowance: { type: Number, min: 0, default: 0 },

  // ── Account status ────────────────────────────────────────────────────────
  isEmailVerified:         { type: Boolean, default: false },
  isActive:                { type: Boolean, default: true  },
  resetPasswordToken:      String,
  resetPasswordExpire:     Date,
  emailVerificationToken:  String,
  emailVerificationExpire: Date,
  lastLogin: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

// ── Hash password ──────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ── Token helpers ──────────────────────────────────────────────────────────
userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  return token;
};

userSchema.methods.getEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

// ── Virtuals ───────────────────────────────────────────────────────────────
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${this.avatar}`;
  return null;
});

// Full academic label e.g. "3rd Year · B.Tech CSE · IIT Bombay"
userSchema.virtual('academicLabel').get(function () {
  const parts = [this.yearOfStudy, this.course, this.college].filter(Boolean);
  return parts.join(' · ') || 'Student';
});

module.exports = mongoose.model('User', userSchema);
