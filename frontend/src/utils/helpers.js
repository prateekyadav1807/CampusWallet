import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ── Currency ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount, symbol = '₹') => {
  const num = parseFloat(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyCompact = (amount, symbol = '₹') => {
  const num = parseFloat(amount) || 0;
  if (num >= 1_00_000) return `${symbol}${(num / 1_00_000).toFixed(1)}L`;
  if (num >= 1_000)    return `${symbol}${(num / 1_000).toFixed(1)}K`;
  return formatCurrency(num, symbol);
};

// ── Dates ─────────────────────────────────────────────────────────────────────
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : '—';
  } catch { return '—'; }
};

export const formatRelative = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ''; }
};

export const formatMonth = (month, year) =>
  new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

// ── Numbers ───────────────────────────────────────────────────────────────────
export const formatPercent   = (value, total) => (!total ? '0%' : `${Math.round((value / total) * 100)}%`);
export const calcPercentage  = (value, total) => (!total ? 0 : Math.round((value / total) * 100));
export const percentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / previous) * 100).toFixed(1);
};

// ── Student Expense Categories ────────────────────────────────────────────────
// Tailored to what students actually spend on every day
export const CATEGORY_CONFIG = {
  'Mess / Food':      { emoji: '🍱', color: '#f59e0b', bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  'Hostel / Rent':    { emoji: '🏠', color: '#6366f1', bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  'Transport':        { emoji: '🚌', color: '#0ea5e9', bg: 'bg-sky-500/15',     text: 'text-sky-400',     border: 'border-sky-500/20'   },
  'Stationery':       { emoji: '✏️', color: '#14b8a6', bg: 'bg-teal-500/15',    text: 'text-teal-400',    border: 'border-teal-500/20'  },
  'Books & Notes':    { emoji: '📚', color: '#8b5cf6', bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/20'},
  'Coaching':         { emoji: '🧑‍🏫', color: '#a855f7', bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/20'},
  'Online Courses':   { emoji: '💻', color: '#0891b2', bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/20'  },
  'Outing & Fun':     { emoji: '🎉', color: '#ec4899', bg: 'bg-pink-500/15',    text: 'text-pink-400',    border: 'border-pink-500/20'  },
  'Health & Medical': { emoji: '💊', color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20'},
  'Clothes':          { emoji: '👕', color: '#f43f5e', bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/20'  },
  'Exam Fees':        { emoji: '📝', color: '#d97706', bg: 'bg-amber-600/15',   text: 'text-amber-500',   border: 'border-amber-600/20' },
  'Tech & Gadgets':   { emoji: '📱', color: '#3b82f6', bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20'  },
  'Miscellaneous':    { emoji: '📦', color: '#94a3b8', bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/20' },
};

// ── Student Income Types ──────────────────────────────────────────────────────
export const INCOME_TYPE_CONFIG = {
  'Pocket Money':    { emoji: '👛', color: '#ec4899', bg: 'bg-pink-500/15',    text: 'text-pink-400'    },
  'Scholarship':     { emoji: '🎓', color: '#8b5cf6', bg: 'bg-violet-500/15',  text: 'text-violet-400'  },
  'Internship':      { emoji: '💼', color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  'Part-time Job':   { emoji: '⏱️', color: '#f59e0b', bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  'Freelancing':     { emoji: '🖥️', color: '#0ea5e9', bg: 'bg-sky-500/15',     text: 'text-sky-400'     },
  'Family Transfer': { emoji: '💸', color: '#14b8a6', bg: 'bg-teal-500/15',    text: 'text-teal-400'    },
  'Prize / Award':   { emoji: '🏆', color: '#d97706', bg: 'bg-amber-600/15',   text: 'text-amber-500'   },
  'Other':           { emoji: '➕', color: '#94a3b8', bg: 'bg-slate-500/15',   text: 'text-slate-400'   },
};

export const SUBSCRIPTION_LOGOS = {
  Netflix:           '🎬', Spotify:          '🎵', ChatGPT:      '🤖',
  'Amazon Prime':    '📦', Coursera:         '🎓', Udemy:        '📚',
  'YouTube Premium': '▶️', 'Disney+':        '✨', Hotstar:      '⭐',
  'LinkedIn Premium':'💼', 'GitHub Copilot': '🐙', 'Notion Pro': '📓',
  'Grammarly':       '✍️', 'Canva Pro':      '🎨', Other:        '📱',
};

// ── String helpers ────────────────────────────────────────────────────────────
export const truncate  = (str, len = 30) => str && str.length > len ? str.substring(0, len) + '…' : str || '';
export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ── Date helpers ──────────────────────────────────────────────────────────────
export const getDaysRemainingInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
};

export const getDaysOverdue = (dueDate) => {
  const diff = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// ── Constants ─────────────────────────────────────────────────────────────────
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Student-focused expense categories
export const EXPENSE_CATEGORIES = [
  'Mess / Food', 'Hostel / Rent', 'Transport', 'Stationery',
  'Books & Notes', 'Coaching', 'Online Courses', 'Outing & Fun',
  'Health & Medical', 'Clothes', 'Exam Fees', 'Tech & Gadgets', 'Miscellaneous',
];

// Student-focused income types
export const INCOME_TYPES = [
  'Pocket Money', 'Scholarship', 'Internship', 'Part-time Job',
  'Freelancing', 'Family Transfer', 'Prize / Award', 'Other',
];

export const FEE_TYPES = [
  'Semester Fee', 'Hostel Fee', 'Exam Fee', 'Placement Fee',
  'Lab Fee', 'Library Fee', 'Activity Fee', 'Bus Fee', 'Other',
];

export const PLACEMENT_CATEGORIES = [
  'Courses', 'Certifications', 'Interview Preparation', 'Books',
  'Online Platforms', 'Mock Tests', 'Resume Building', 'Coaching', 'Other',
];

export const SUBSCRIPTION_PLATFORMS = [
  'Netflix', 'Spotify', 'ChatGPT', 'Amazon Prime', 'Coursera', 'Udemy',
  'YouTube Premium', 'Disney+', 'Hotstar', 'LinkedIn Premium',
  'GitHub Copilot', 'Notion Pro', 'Grammarly', 'Canva Pro', 'Other',
];

export const BILLING_CYCLES  = ['monthly', 'quarterly', 'half-yearly', 'yearly'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking', 'Wallet', 'Other'];

// Academic year helpers
export const YEAR_OF_STUDY = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'PG 1st Year', 'PG 2nd Year', 'PhD'];
export const DEGREE_TYPES  = ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Diploma', 'Other'];
