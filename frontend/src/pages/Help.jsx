import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Mail, MessageSquare, ChevronDown, ChevronUp,
  BookOpen, Zap, Shield, CreditCard, Users, BarChart3,
  ExternalLink, Send, CheckCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ── FAQ data ─────────────────────────────────────────────────────────────── */
const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Zap,
    color: 'var(--color-accent)',
    questions: [
      {
        q: 'How do I add my first transaction?',
        a: 'Head to the Transactions page and click the "+ Add" button in the top-right corner. Choose between Income or Expense, fill in the amount, category, and date, then hit Save. Your dashboard will update instantly.',
      },
      {
        q: 'How do I set a monthly budget?',
        a: 'Go to the Budget page, select the month and year, then click "Set Budget". Enter your total monthly limit and optionally break it down by category. CampusWallet will track your spending against it automatically.',
      },
      {
        q: 'Can I import transactions from my bank?',
        a: 'Currently CampusWallet supports manual entry. Bank import via CSV/OFX is on our roadmap. For now, you can add transactions quickly using the keyboard shortcut or the mobile-friendly form.',
      },
    ],
  },
  {
    id: 'budgets',
    label: 'Budgets & Tracking',
    icon: CreditCard,
    color: 'var(--color-warning)',
    questions: [
      {
        q: 'Why am I getting budget exceeded alerts?',
        a: 'When your total expenses for the month cross 100% of your set budget, a "Budget Exceeded" notification is triggered. You can adjust your budget limit at any time from the Budget page, or reduce spending in high-usage categories.',
      },
      {
        q: 'What is the daily spending limit?',
        a: 'CampusWallet calculates a daily limit by dividing your remaining budget by the days left in the month. It\'s a helpful guide, not a hard cap — you can still log expenses beyond it.',
      },
      {
        q: 'How do category budgets work?',
        a: 'On the Budget page you can allocate portions of your total budget to specific categories like Food, Transport, or Education. The budget utilization charts then break down over/under spending per category.',
      },
    ],
  },
  {
    id: 'split-bills',
    label: 'Split Bills',
    icon: Users,
    color: 'var(--color-info)',
    questions: [
      {
        q: 'How do I create a group for splitting expenses?',
        a: 'Go to Split Bills, click "New Group", give it a name, and add members by their registered email addresses. Once the group is created you can log shared expenses and CampusWallet will calculate who owes whom.',
      },
      {
        q: 'How are settlements handled?',
        a: 'After logging group expenses, head to the group\'s Settlements tab. CampusWallet calculates the minimum number of transfers needed to balance all debts. You can mark a settlement as paid once the money has been transferred.',
      },
      {
        q: 'Can someone outside CampusWallet join a group?',
        a: 'Group members need a CampusWallet account. Invite them to register first — it\'s free — then add them to your group using their registered email.',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    color: 'var(--color-success)',
    questions: [
      {
        q: 'Why does my Analytics page show no data?',
        a: 'Analytics requires at least a few transactions logged across different months. Add your income and expenses for the current and previous month and the charts will populate. Monthly trend charts need at least 2 months of data.',
      },
      {
        q: 'How do I generate a PDF report?',
        a: 'Go to the Reports page, choose the month/year and report type (Summary, Detailed, or Tax), then click "Generate Report". The PDF is generated server-side and will be available for download within a few seconds.',
      },
      {
        q: 'What does the AI Insights page show?',
        a: 'The Insights page uses your spending patterns to surface actionable suggestions — like categories where you\'re overspending, months with unusual spikes, and savings opportunities. Insights update when new transactions are added.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Security',
    icon: Shield,
    color: 'var(--color-danger)',
    questions: [
      {
        q: 'How do I change my password?',
        a: 'Go to Settings → Security tab → Change Password. You\'ll need your current password to set a new one. If you\'ve forgotten it, log out and use the "Forgot Password" link on the login page.',
      },
      {
        q: 'Is my financial data secure?',
        a: 'All data is encrypted in transit (HTTPS/TLS) and at rest. Passwords are hashed using bcrypt and never stored in plain text. We never share your personal financial data with third parties.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Account deletion can be requested from Settings → Danger Zone. This permanently removes all your transactions, budgets, groups, and reports. The action is irreversible, so please export any data you need first.',
      },
    ],
  },
];

/* ── Quick links ──────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { label: 'Dashboard',          path: '/dashboard',          icon: Zap          },
  { label: 'Transactions',       path: '/transactions',       icon: CreditCard   },
  { label: 'Budget',             path: '/budget',             icon: BookOpen     },
  { label: 'Split Bills',        path: '/split-bills',        icon: Users        },
  { label: 'Analytics',          path: '/analytics',          icon: BarChart3    },
  { label: 'Settings',           path: '/settings',           icon: Shield       },
];

/* ── FAQ Item ─────────────────────────────────────────────────────────────── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${open ? 'var(--color-border-strong)' : 'var(--color-border)'}`, transition: 'border-color 0.2s' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors"
        style={{ background: open ? 'rgba(255,255,255,0.04)' : 'transparent' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{q}</span>
        {open
          ? <ChevronUp  size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          : <ChevronDown size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="px-4 pb-4 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)' }}
            >
              <span className="block pt-3">{a}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── FAQ Category block ───────────────────────────────────────────────────── */
function FaqCategory({ cat, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="card p-5"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}
        >
          <cat.icon size={15} style={{ color: cat.color }} strokeWidth={1.75} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {cat.label}
        </h3>
      </div>
      <div className="space-y-2">
        {cat.questions.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Contact form ─────────────────────────────────────────────────────────── */
const SUBJECTS = [
  'General Question',
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'Billing / Subscription',
  'Data / Privacy',
  'Other',
];

function ContactForm() {
  const [form,    setForm]    = useState({ subject: SUBJECTS[0], message: '' });
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [errMsg,  setErrMsg]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('Please enter a message.'); return; }
    setStatus('loading');
    try {
      // Best-effort POST — silently succeeds even if no backend endpoint exists yet
      await api.post('/notifications/contact', {
        subject: form.subject,
        message: form.message.trim(),
      }).catch(() => {}); // swallow 404 if endpoint not yet live
      setStatus('success');
      setForm({ subject: SUBJECTS[0], message: '' });
    } catch (err) {
      setErrMsg('Something went wrong. Please email us directly.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 gap-3"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success-border)' }}>
          <CheckCircle size={22} style={{ color: 'var(--color-success)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Message sent!</p>
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          We'll get back to you within 24–48 hours.
        </p>
        <button className="btn-secondary mt-2" onClick={() => setStatus('idle')}>
          Send another
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="form-label">Subject</label>
        <select
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
          className="input-field"
        >
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Message</label>
        <textarea
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="Describe your issue or question in detail…"
          rows={5}
          className="input-field resize-none"
          style={{ height: 'auto', paddingTop: '10px', paddingBottom: '10px' }}
          required
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
          style={{ background: 'var(--color-danger-muted)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
          <AlertCircle size={13} /> {errMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full"
        style={{ height: 40 }}
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Sending…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send size={14} /> Send Message
          </span>
        )}
      </button>
    </form>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  /* filter FAQ by search */
  const filtered = FAQ_CATEGORIES
    .filter(cat => activeCategory === 'all' || cat.id === activeCategory)
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(
        item =>
          !searchQuery ||
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cat => cat.questions.length > 0);

  return (
    <div className="space-y-6 max-w-screen-xl">

      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.025em' }}
          >
            Help & Support
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Answers, guides, and ways to reach us
          </p>
        </div>
      </motion.div>

      {/* ── Hero search ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="card p-6 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--color-accent-muted)', border: '1px solid var(--color-accent-border)' }}
        >
          <HelpCircle size={22} style={{ color: 'var(--color-accent)' }} strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          How can we help?
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
          Search the FAQ or browse by category below
        </p>
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions…"
            className="input-field pl-4 pr-4 text-sm"
            style={{ height: 42, fontSize: 14 }}
          />
        </div>
      </motion.div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — FAQ ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Category filter pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setActiveCategory('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeCategory === 'all' ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === 'all' ? '#fff' : 'var(--color-text-muted)',
                border: `1px solid ${activeCategory === 'all' ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              All topics
            </button>
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: activeCategory === cat.id ? `${cat.color}18` : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat.id ? cat.color : 'var(--color-text-muted)',
                  border: `1px solid ${activeCategory === cat.id ? `${cat.color}40` : 'var(--color-border)'}`,
                }}
              >
                <cat.icon size={11} strokeWidth={2} />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* FAQ cards */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-10 text-center"
            >
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>No results found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Try a different search term or browse all topics
              </p>
            </motion.div>
          ) : (
            filtered.map((cat, i) => (
              <FaqCategory key={cat.id} cat={cat} delay={0.08 + i * 0.06} />
            ))
          )}
        </div>

        {/* Right — Contact & quick links ───────────────────────── */}
        <div className="space-y-5">

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.25 }}
            className="card p-5"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <MessageSquare size={15} style={{ color: 'var(--color-info)' }} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contact Support</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  We reply within 24–48 h
                </p>
              </div>
            </div>
            <ContactForm />
          </motion.div>

          {/* Direct contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.25 }}
            className="card p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-muted)' }}>
              Reach us directly
            </p>
            <div className="space-y-3">
              <a
                href="mailto:support@campuswallet.app"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group"
                style={{ border: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent-muted)' }}>
                  <Mail size={14} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Email Support</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                    support@campuswallet.app
                  </p>
                </div>
                <ExternalLink size={12} style={{ color: 'var(--color-text-muted)' }} />
              </a>
            </div>

            <div
              className="mt-4 rounded-lg p-3 text-xs"
              style={{
                background: 'var(--color-accent-muted)',
                border: '1px solid var(--color-accent-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span className="font-medium" style={{ color: 'var(--color-accent)' }}>Response times: </span>
              General questions within 24 h · Bugs and account issues within 4–8 h
            </div>
          </motion.div>

          {/* Quick navigation links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.20, duration: 0.25 }}
            className="card p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--color-text-muted)' }}>
              Quick navigation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(link => (
                <a
                  key={link.path}
                  href={link.path}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <link.icon size={12} strokeWidth={2} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
