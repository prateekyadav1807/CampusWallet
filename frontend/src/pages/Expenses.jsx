import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  formatCurrency, formatDate,
  CATEGORY_CONFIG, EXPENSE_CATEGORIES, PAYMENT_METHODS,
} from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/* ─── colour map for category pills ─────────────────────────────────────── */
const CAT_PILL = {
  Food:          'bg-amber-500/15 text-amber-400',
  Rent:          'bg-indigo-500/15 text-indigo-400',
  Travel:        'bg-sky-500/15 text-sky-400',
  Shopping:      'bg-pink-500/15 text-pink-400',
  Gym:           'bg-emerald-500/15 text-emerald-400',
  Bills:         'bg-red-500/15 text-red-400',
  Education:     'bg-violet-500/15 text-violet-400',
  Entertainment: 'bg-purple-500/15 text-purple-400',
  Health:        'bg-teal-500/15 text-teal-400',
  Miscellaneous: 'bg-slate-500/15 text-slate-400',
};

const BLANK = {
  title: '', amount: '', category: 'Food',
  date: new Date().toISOString().split('T')[0],
  notes: '', paymentMethod: 'UPI',
};

/* ─── Inline quick-add row ───────────────────────────────────────────────── */
function AddRow({ onSaved }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState(BLANK);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Add a title and amount'); return;
    }
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('💸 Expense saved!');
      setForm(BLANK);
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* Toggle button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="btn-warm flex items-center gap-2 text-sm font-semibold">
          <Plus size={15} /> Add Expense
        </button>
      )}

      {/* Inline form */}
      <AnimatePresence>
        {open && (
          <motion.form onSubmit={submit}
            className="rounded-2xl p-4 mt-0"
            style={{ background: '#161f2e', border: '1px solid rgba(249,115,22,0.22)' }}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-wrap gap-2 items-end">
              {/* Title */}
              <div className="flex-1 min-w-[160px]">
                <label className="form-label">What did you spend on?</label>
                <input autoFocus placeholder="e.g. Lunch, Uber, Books…"
                  value={form.title} onChange={e => set('title', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>

              {/* Amount */}
              <div className="w-28">
                <label className="form-label">Amount ₹</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => set('amount', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>

              {/* Category */}
              <div className="w-36">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="input-field h-9 text-sm">
                  {EXPENSE_CATEGORIES.map(c =>
                    <option key={c} value={c}>{CATEGORY_CONFIG[c]?.emoji} {c}</option>
                  )}
                </select>
              </div>

              {/* Date */}
              <div className="w-36">
                <label className="form-label">Date</label>
                <input type="date" value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>

              {/* Payment */}
              <div className="w-32">
                <label className="form-label">Via</label>
                <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                  className="input-field h-9 text-sm">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div className="flex-1 min-w-[140px]">
                <label className="form-label">Notes (optional)</label>
                <input placeholder="Any note…" value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pb-px">
                <button type="submit" disabled={saving}
                  className="btn-warm h-9 px-5 text-sm font-semibold">
                  {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="btn-secondary h-9 px-3">
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Edit modal form ────────────────────────────────────────────────────── */
function EditModal({ expense, onClose, onSaved }) {
  const [form,   setForm]   = useState({
    title: expense.title,
    amount: expense.amount.toString(),
    category: expense.category,
    date: new Date(expense.date).toISOString().split('T')[0],
    notes: expense.notes || '',
    paymentMethod: expense.paymentMethod || 'UPI',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) { toast.error('Title and amount required'); return; }
    setSaving(true);
    try {
      await api.put(`/expenses/${expense._id}`, { ...form, amount: parseFloat(form.amount) });
      toast.success('✅ Expense updated!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="✏️ Edit Expense"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <LoadingSpinner size="sm" /> : '✅ Update'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="form-label">Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="form-label">Amount ₹</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
            {EXPENSE_CATEGORIES.map(c =>
              <option key={c} value={c}>{CATEGORY_CONFIG[c]?.emoji} {c}</option>
            )}
          </select>
        </div>
        <div>
          <label className="form-label">Payment</label>
          <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} className="input-field">
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="form-label">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input-field resize-none" />
        </div>
      </div>
    </Modal>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Expenses() {
  const [expenses,   setExpenses]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* filters */
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setFilters] = useState(false);

  /* editing / deleting */
  const [editing,  setEditing]  = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* debounce search */
  const [debouncedSearch, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy: 'date', sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category !== 'All') params.category = category;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end)   params.endDate   = dateRange.end;

      const [listRes, statsRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/expenses/stats'),
      ]);
      setExpenses(listRes.data.expenses);
      setTotal(listRes.data.total);
      setTotalPages(listRes.data.totalPages);
      setStats(statsRes.data.stats);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, debouncedSearch, category, sortOrder, dateRange.start, dateRange.end]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success('🗑️ Deleted');
      setDeleteId(null);
      fetchExpenses();
    } catch (_) { toast.error('Delete failed'); }
  };

  const clearFilters = () => {
    setCategory('All'); setDateRange({ start: '', end: '' }); setPage(1);
  };
  const hasFilters = category !== 'All' || dateRange.start || dateRange.end;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Expenses 💸</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats?.count ?? 0} transactions · {formatCurrency(stats?.total ?? 0)} this month
          </p>
        </div>
        <AddRow onSaved={fetchExpenses} />
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Month',   value: formatCurrency(stats?.total ?? 0),        color: 'text-orange-400', emoji: '💸' },
          { label: 'Transactions', value: stats?.count ?? 0,                         color: 'text-white',      emoji: '🔢' },
          { label: 'Top Category', value: stats?.byCategory?.[0]?._id ?? '—',
            color: 'text-teal-400',
            emoji: CATEGORY_CONFIG[stats?.byCategory?.[0]?._id]?.emoji ?? '📦' },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Search + filter bar ─────────────────────────────── */}
      <div className="card p-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input placeholder="Search expenses…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 h-9 text-sm" />
          </div>
          <button onClick={() => setFilters(v => !v)}
            className={`btn-secondary h-9 flex items-center gap-1.5 text-sm ${showFilters ? 'border-teal-500/40 text-teal-300' : ''}`}>
            <Filter size={13} />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
          </button>
          <button onClick={() => setSortOrder(v => v === 'asc' ? 'desc' : 'asc')}
            className="btn-secondary h-9 px-3 text-xs"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}>
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div>
                <label className="form-label">Category</label>
                <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
                  className="input-field text-sm h-9">
                  <option value="All">All Categories</option>
                  {EXPENSE_CATEGORIES.map(c =>
                    <option key={c} value={c}>{CATEGORY_CONFIG[c]?.emoji} {c}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="form-label">From</label>
                <input type="date" value={dateRange.start}
                  onChange={e => { setDateRange(d => ({ ...d, start: e.target.value })); setPage(1); }}
                  className="input-field text-sm h-9" />
              </div>
              <div>
                <label className="form-label">To</label>
                <input type="date" value={dateRange.end}
                  onChange={e => { setDateRange(d => ({ ...d, end: e.target.value })); setPage(1); }}
                  className="input-field text-sm h-9" />
              </div>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                  <X size={11} /> Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      {loading ? <SkeletonList rows={8} /> : expenses.length === 0 ? (
        <EmptyState emoji="💸" title="No expenses found"
          description={hasFilters || search ? 'Try adjusting your filters or search' : 'Add your first expense above'}
        />
      ) : (
        <div className="space-y-1.5">
          {expenses.map((exp, i) => {
            const cfg = CATEGORY_CONFIG[exp.category] ?? {};
            return (
              <motion.div key={exp._id}
                className="card p-3.5 flex items-center gap-3 group"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${CAT_PILL[exp.category]?.split(' ')[0] ?? 'bg-slate-700/40'}`}>
                  {cfg.emoji ?? '💸'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{exp.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-medium ${CAT_PILL[exp.category] ?? 'text-slate-400'}`}>
                      {exp.category}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{formatDate(exp.date)}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{exp.paymentMethod}</span>
                    {exp.notes && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-600 truncate max-w-[160px]">{exp.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-display font-bold text-orange-400 text-sm">
                    −{formatCurrency(exp.amount)}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(exp)}
                      className="btn-icon w-7 h-7 hover:text-teal-400">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(exp._id)}
                      className="btn-icon w-7 h-7 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">{expenses.length} of {total} expenses</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
            <span className="text-xs text-slate-400 px-1">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal expense={editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchExpenses(); }} />
      )}

      {/* Delete confirm */}
      <ConfirmDialog isOpen={!!deleteId}
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete Expense?" message="This will permanently remove the expense." />
    </div>
  );
}
