const { validationResult, body, param, query } = require('express-validator');

// Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages
    });
  }
  next();
};

// ─── Auth Validators ────────────────────────────────────────────────────────
const registerValidator = [
  body('name')
    .trim().notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  // Student-required fields
  body('college')
    .trim().notEmpty().withMessage('College / University name is required')
    .isLength({ max: 150 }).withMessage('College name too long'),
  body('course')
    .trim().notEmpty().withMessage('Course / Degree is required')
    .isLength({ max: 100 }).withMessage('Course name too long'),
  // Optional student fields — only validate format if provided
  body('branch').optional().trim().isLength({ max: 100 }).withMessage('Branch name too long'),
  body('yearOfStudy').optional().isIn(['','1st Year','2nd Year','3rd Year','4th Year','5th Year','PG 1st Year','PG 2nd Year','PhD']).withMessage('Invalid year of study'),
  body('semester').optional().isInt({ min: 1, max: 12 }).withMessage('Semester must be 1–12'),
  body('studentId').optional().trim().isLength({ max: 30 }).withMessage('Student ID too long'),
  body('graduationYear').optional().isInt({ min: 2020, max: 2040 }).withMessage('Invalid graduation year'),
  validate
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  validate
];

const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  validate
];

// ─── Expense Validators ─────────────────────────────────────────────────────
const expenseValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title max 100 chars'),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Mess / Food', 'Hostel / Rent', 'Transport', 'Stationery',
      'Books & Notes', 'Coaching', 'Online Courses', 'Outing & Fun',
      'Health & Medical', 'Clothes', 'Exam Fees', 'Tech & Gadgets', 'Miscellaneous',
      'Food', 'Rent', 'Travel', 'Shopping', 'Gym', 'Bills', 'Education', 'Entertainment', 'Health'
    ])
    .withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validate
];

// ─── Income Validators ──────────────────────────────────────────────────────
const incomeValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title max 100 chars'),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('type')
    .notEmpty().withMessage('Income type is required')
    .isIn([
      // New student-focused types
      'Pocket Money', 'Scholarship', 'Internship', 'Part-time Job',
      'Freelancing', 'Family Transfer', 'Prize / Award', 'Other',
      // Legacy types kept for backward compatibility
      'Salary',
    ])
    .withMessage('Invalid income type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validate
];

// ─── Budget Validators ──────────────────────────────────────────────────────
const budgetValidator = [
  body('month').notEmpty().withMessage('Month is required').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').notEmpty().withMessage('Year is required').isInt({ min: 2020 }).withMessage('Year must be >= 2020'),
  body('totalBudget').notEmpty().withMessage('Total budget is required').isFloat({ min: 1 }).withMessage('Budget must be > 0'),
  validate
];

// ─── Subscription Validators ────────────────────────────────────────────────
const subscriptionValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('billingCycle')
    .notEmpty().withMessage('Billing cycle is required')
    .isIn(['monthly', 'quarterly', 'half-yearly', 'yearly']).withMessage('Invalid billing cycle'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid date'),
  body('nextRenewalDate').notEmpty().withMessage('Next renewal date is required').isISO8601().withMessage('Invalid date'),
  validate
];

// ─── Student Fee Validators ─────────────────────────────────────────────────
const studentFeeValidator = [
  body('feeType')
    .notEmpty().withMessage('Fee type is required')
    .isIn(['Semester Fee', 'Hostel Fee', 'Exam Fee', 'Placement Fee', 'Lab Fee', 'Library Fee', 'Activity Fee', 'Other'])
    .withMessage('Invalid fee type'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('totalAmount').notEmpty().withMessage('Total amount is required').isFloat({ min: 0 }).withMessage('Amount must be >= 0'),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid date'),
  validate
];

// ─── Placement Validators ───────────────────────────────────────────────────
const placementValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Courses', 'Certifications', 'Interview Preparation', 'Books', 'Online Platforms', 'Mock Tests', 'Resume Building', 'Coaching', 'Other'])
    .withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date'),
  validate
];

// ─── Group Validators ───────────────────────────────────────────────────────
const groupValidator = [
  body('name').trim().notEmpty().withMessage('Group name is required').isLength({ max: 100 }),
  body('members').isArray({ min: 1 }).withMessage('At least one member is required'),
  body('members.*.name').notEmpty().withMessage('Member name is required'),
  validate
];

const groupExpenseValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('paidByName').notEmpty().withMessage('Payer name is required'),
  validate
];

// ─── MongoDB ObjectId Validator ─────────────────────────────────────────────
const mongoIdValidator = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  expenseValidator,
  incomeValidator,
  budgetValidator,
  subscriptionValidator,
  studentFeeValidator,
  placementValidator,
  groupValidator,
  groupExpenseValidator,
  mongoIdValidator
};
