/**
 * TrackWise Utility Helpers
 */

// Format currency in Indian format
const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

// Get date range for a month
const getMonthDateRange = (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

// Calculate percentage change
const percentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / previous) * 100).toFixed(1);
};

// Paginate results
const paginate = (total, page, limit) => ({
  total,
  currentPage: parseInt(page),
  totalPages: Math.ceil(total / parseInt(limit)),
  hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
  hasPrevPage: parseInt(page) > 1
});

// Generate a random 6-char OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Sanitize filename
const sanitizeFilename = (name) =>
  name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50);

// Get days remaining in current month
const getRemainingDaysInMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
};

// Calculate daily spending limit
const calcDailyLimit = (remainingBudget, remainingDays) => {
  if (remainingDays <= 0 || remainingBudget <= 0) return 0;
  return parseFloat((remainingBudget / remainingDays).toFixed(2));
};

// API response helpers
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const errorResponse = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = {
  formatCurrency,
  getMonthDateRange,
  percentageChange,
  paginate,
  generateOTP,
  sanitizeFilename,
  getRemainingDaysInMonth,
  calcDailyLimit,
  successResponse,
  errorResponse
};
