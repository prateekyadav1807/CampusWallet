import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatCurrency, formatDate, INCOME_TYPE_CONFIG, INCOME_TYPES } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const TYPE_PILL = {
  Internship:     'bg-teal-500/15 text-teal-400',
  Salary:         'bg-amber-500/15 text-amber-400',
  Freelancing:    'bg-sky-500/15 text-sky-400',
  'Pocket Money': 'bg-pink-500/15 text-pink-400',
  Scholarship:    'bg-violet-500/15 text-violet-400',
  Other:          'bg-slate-500/15 text-slate-400',
};

const BLANK = {
  title: '', amount: '', type: 'Salary',
  date: new Date().toISOString().split('T')[0],
  source: '', notes: '', isRecurring: false,
};

/* ── Inline add row ─────────────────────────────────────────────────────── */
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
      await api.post('/income', { ...form, amount: parseFloat(form.amount) });
      toast.success('💰 Income saved!');
      setForm(BLANK);
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="btn-success flex items-center gap-2 text-sm font-semibold">
          <Plus size={15} /> Add Income
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.form onSubmit={submit}
            className="rounded-2xl p-4"
            style={{ background: '#161f2e', border: '1px solid rgba(20,184,166,0.22)' }}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="form-label">Source / Title</label>
                <input autoFocus placeholder="e.g. Internship stipend, Freelance…"
                  value={form.title} onChange={e => set('title', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>
              <div className="w-28">
                <label className="form-label">Amount ₹</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => set('amount', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>
              <div className="w-36">
                <label className="form-label">Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="input-field h-9 text-sm">
                  {INCOME_TYPES.map(t =>
                    <option key={t} value={t}>{INCOME_TYPE_CONFIG[t]?.emoji} {t}</option>
                  )}
                </select>
              </div>
              <div className="w-36">
                <label className="form-label">Date</label>
                <input type="date" value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="form-label">From (optional)</label>
                <input placeholder="Company / person"
                  value={form.source} onChange={e => set('source', e.target.value)}
                  className="input-field h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="rec" checked={form.isRecurring}
                  onChange={e => set('isRecurring', e.target.checked)}
                  className="w-3.5 h-3.5 accent-teal-500 cursor-pointer" />
                <label htmlFor="rec" className="text-xs text-slate-400 cursor-pointer">Recurring</label>
              </div>
              <div className="flex gap-2 pb-px">
                <button type="submit" disabled={saving}
                  className="btn-success h-9 px-5 text-sm font-semibold">
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

/* ── Edit modal ─────────────────────────────────────────────────────────── */
function EditModal({ income, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: income.title, amount: income.amount.toString(),
    type: income.type, date: new Date(income.date).toISOString().split('T')[0],
    source: income.source || '', notes: income.notes || '',
    isRecurring: income.isRecurring || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/income/${income._id}`, { ...form, amount: parseFloat(form.amount) });
      toast.success('✅ Income updated!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="✏️ Edit Income"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-success flex items-center gap-2">
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
          <label className="form-label">Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field">
            {INCOME_TYPES.map(t => <option key={t} value={t}>{INCOME_TYPE_CONFIG[t]?.emoji} {t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Source</label>
          <input value={form.source} onChange={e => set('source', e.target.value)} className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="form-label">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input-field resize-none" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="recEdit" checked={form.isRecurring}
            onChange={e => set('isRecurring', e.target.checked)}
            className="w-3.5 h-3.5 accent-teal-500 cursor-pointer" />
          <label htmlFor="recEdit" className="text-sm text-slate-300 cursor-pointer">🔄 Recurring income</label>
        </div>
      </div>
    </Modal>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Income() {
  const [incomes,    setIncomes]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search,     setSearch]     = useState('');
  const [debSearch,  setDebSearch]  = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOrder,  setSortOrder]  = useState('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy: 'date', sortOrder };
      if (debSearch)          params.search = debSearch;
      if (typeFilter !== 'All') params.type = typeFilter;
      const [listRes, statsRes] = await Promise.all([
        api.get('/income', { params }),
        api.get('/income/stats'),
      ]);
      setIncomes(listRes.data.incomes);
      setTotal(listRes.data.total);
      setTotalPages(listRes.data.totalPages);
      setStats(statsRes.data.stats);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, debSearch, typeFilter, sortOrder]);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  const handleDelete = async () => {
    try {
      await api.delete(`/income/${deleteId}`);
      toast.success('🗑️ Deleted');
      setDeleteId(null);
      fetchIncomes();
    } catch (_) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Income 💰</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats?.count ?? 0} entries · {formatCurrency(stats?.total ?? 0)} this month
          </p>
        </div>
        <AddRow onSaved={fetchIncomes} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Month',  value: formatCurrency(stats?.total ?? 0),          color: 'text-teal-400',   emoji: '💰' },
          { label: 'Entries',     value: stats?.count ?? 0,                           color: 'text-white',      emoji: '🔢' },
          { label: 'Top Source',  value: stats?.byType?.[0]?._id ?? '—',             color: 'text-amber-400',  emoji: INCOME_TYPE_CONFIG[stats?.byType?.[0]?._id]?.emoji ?? '💼' },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="card p-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input placeholder="Search income…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 h-9 text-sm" />
          </div>
          <button onClick={() => setShowFilter(v => !v)}
            className={`btn-secondary h-9 flex items-center gap-1.5 text-sm ${showFilter ? 'border-teal-500/40 text-teal-300' : ''}`}>
            <Filter size={13} /> Filters
          </button>
          <button onClick={() => setSortOrder(v => v === 'asc' ? 'desc' : 'asc')}
            className="btn-secondary h-9 px-3 text-xs">
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>

        <AnimatePresence>
          {showFilter && (
            <motion.div className="pt-1"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
              <label className="form-label">Type</label>
              <div className="flex flex-wrap gap-2">
                {['All', ...INCOME_TYPES].map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === t
                      ? 'bg-teal-600/30 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
                    {INCOME_TYPE_CONFIG[t]?.emoji ?? '📋'} {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      {loading ? <SkeletonList rows={8} /> : incomes.length === 0 ? (
        <EmptyState emoji="💰" title="No income found"
          description={search || typeFilter !== 'All' ? 'Try adjusting filters' : 'Add your first income entry above'} />
      ) : (
        <div className="space-y-1.5">
          {incomes.map((inc, i) => {
            const cfg  = INCOME_TYPE_CONFIG[inc.type] ?? {};
            const pill = TYPE_PILL[inc.type] ?? 'bg-slate-700/40 text-slate-400';
            return (
              <motion.div key={inc._id}
                className="card p-3.5 flex items-center gap-3 group"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${pill.split(' ')[0]}`}>
                  {cfg.emoji ?? '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{inc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-medium ${pill}`}>{inc.type}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{formatDate(inc.date)}</span>
                    {inc.source && <><span className="text-slate-700">·</span><span className="text-xs text-slate-500">{inc.source}</span></>}
                    {inc.isRecurring && <span className="badge-teal text-[10px]">🔄 recurring</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-display font-bold text-teal-400 text-sm">+{formatCurrency(inc.amount)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(inc)} className="btn-icon w-7 h-7 hover:text-teal-400"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteId(inc._id)} className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">{incomes.length} of {total}</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
            <span className="text-xs text-slate-400 px-1">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      {editing && <EditModal income={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchIncomes(); }} />}
      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete Income?" message="This income entry will be permanently removed." />
    </div>
  );
}
