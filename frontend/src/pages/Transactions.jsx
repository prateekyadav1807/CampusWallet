import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  formatCurrency, formatDate,
  CATEGORY_CONFIG, EXPENSE_CATEGORIES, PAYMENT_METHODS, INCOME_TYPES, INCOME_TYPE_CONFIG,
} from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/* ── Inline add form ─────────────────────────────────────────────────────── */
function AddRow({ type, onSaved }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({
    title: '', amount: '', category: 'Mess / Food', incomeType: 'Pocket Money',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Enter title and amount'); return;
    }
    setSaving(true);
    try {
      if (type === 'expense') {
        await api.post('/expenses', {
          title: form.title, amount: parseFloat(form.amount),
          category: form.category, date: form.date, paymentMethod: form.paymentMethod,
        });
        toast.success('Expense recorded');
      } else {
        await api.post('/income', {
          title: form.title, amount: parseFloat(form.amount),
          type: form.incomeType, date: form.date,
        });
        toast.success('Income recorded');
      }
      setForm({ title: '', amount: '', category: 'Mess / Food', incomeType: 'Pocket Money', date: new Date().toISOString().split('T')[0], paymentMethod: 'UPI' });
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const isExpense = type === 'expense';

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)}
          className={isExpense ? 'btn-secondary flex items-center gap-1.5 text-sm' : 'btn-primary flex items-center gap-1.5 text-sm'}
          style={{ height: 34 }}>
          <Plus size={14} strokeWidth={2} />
          {isExpense ? 'Add Expense' : 'Add Income'}
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.form onSubmit={submit}
            className="flex flex-wrap items-end gap-2 p-3 rounded-xl"
            style={{ background: 'var(--color-card)', border: `1px solid ${isExpense ? 'var(--color-border-strong)' : 'var(--color-accent-border)'}` }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <div className="flex-1 min-w-[160px]">
              <label className="form-label">{isExpense ? 'What did you spend on?' : 'Income source'}</label>
              <input autoFocus placeholder={isExpense ? 'e.g. Canteen lunch' : 'e.g. Internship stipend'}
                value={form.title} onChange={e => set('title', e.target.value)} className="input-field" />
            </div>
            <div className="w-24">
              <label className="form-label">Amount</label>
              <input type="number" placeholder="0" min="0.01" step="0.01"
                value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" />
            </div>
            {isExpense ? (
              <div className="w-40">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.emoji} {c}</option>)}
                </select>
              </div>
            ) : (
              <div className="w-40">
                <label className="form-label">Type</label>
                <select value={form.incomeType} onChange={e => set('incomeType', e.target.value)} className="input-field">
                  {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div className="w-36">
              <label className="form-label">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-2 pb-px">
              <button type="submit" disabled={saving}
                className={isExpense ? 'btn-secondary' : 'btn-primary'}
                style={{ height: 34 }}>
                {saving ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="btn-ghost" style={{ height: 34, width: 34, padding: 0 }}>
                <X size={15} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Transactions() {
  const [items,      setItems]      = useState([]);
  const [stats,      setStats]      = useState({ totalIncome: 0, totalExpenses: 0, count: 0 });
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('all');   // all | income | expense
  const [search,     setSearch]     = useState('');
  const [debSearch,  setDebSearch]  = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteItem, setDeleteItem] = useState(null);   // { id, type }
  const [editItem,   setEditItem]   = useState(null);   // { data, type }
  const [tick,       setTick]       = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sortBy: 'date', sortOrder: 'desc' };
      if (debSearch) params.search = debSearch;

      if (tab === 'all') {
        const [eR, iR] = await Promise.all([
          api.get('/expenses', { params: { ...params, limit: 10 } }),
          api.get('/income',   { params: { ...params, limit: 10 } }),
        ]);
        const merged = [
          ...(eR.data.expenses ?? []).map(e => ({ ...e, _type: 'expense' })),
          ...(iR.data.incomes  ?? []).map(i => ({ ...i, _type: 'income'  })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setItems(merged);
        setTotalPages(1);
        setStats(s => ({
          ...s,
          totalExpenses: eR.data.expenses?.reduce((a, x) => a + x.amount, 0) ?? 0,
          totalIncome:   iR.data.incomes?.reduce((a, x) => a + x.amount, 0) ?? 0,
          count: (eR.data.total ?? 0) + (iR.data.total ?? 0),
        }));
      } else if (tab === 'expense') {
        const r = await api.get('/expenses', { params });
        setItems((r.data.expenses ?? []).map(e => ({ ...e, _type: 'expense' })));
        setTotalPages(r.data.totalPages ?? 1);
      } else {
        const r = await api.get('/income', { params });
        setItems((r.data.incomes ?? []).map(i => ({ ...i, _type: 'income' })));
        setTotalPages(r.data.totalPages ?? 1);
      }
    } catch (err) {
      console.error('Fetch transactions error:', err.response?.data ?? err.message);
    }
    finally { setLoading(false); }
  }, [tab, page, debSearch, tick]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    try {
      if (deleteItem.type === 'expense') {
        await api.delete(`/expenses/${deleteItem.id}`);
      } else {
        await api.delete(`/income/${deleteItem.id}`);
      }
      toast.success('Deleted');
      setDeleteItem(null);
      setTick(t => t + 1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Delete failed';
      toast.error(msg);
      console.error('Delete error:', err.response?.data ?? err.message);
    }
  };

  const net = stats.totalIncome - stats.totalExpenses;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.025em' }}>
            Transactions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            All income and expenses in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddRow type="income"  onSaved={() => setTick(t => t + 1)} />
          <AddRow type="expense" onSaved={() => setTick(t => t + 1)} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income',   value: formatCurrency(stats.totalIncome),   color: 'var(--color-success)', Icon: ArrowUpRight   },
          { label: 'Expenses', value: formatCurrency(stats.totalExpenses),  color: 'var(--color-danger)',  Icon: ArrowDownRight },
          { label: 'Net',      value: formatCurrency(Math.abs(net)),        color: net >= 0 ? 'var(--color-accent)' : 'var(--color-danger)', Icon: net >= 0 ? ArrowUpRight : ArrowDownRight },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              <s.Icon size={13} style={{ color: s.color }} />
            </div>
            <p className="text-lg font-semibold tabular-nums tracking-fin"
              style={{ color: s.color, letterSpacing: '-0.02em' }}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        {/* Type tabs */}
        <div className="flex rounded-lg overflow-hidden flex-shrink-0"
          style={{ border: '1px solid var(--color-border-strong)' }}>
          {[
            { k: 'all', l: 'All' }, { k: 'income', l: 'Income' }, { k: 'expense', l: 'Expenses' }
          ].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setPage(1); }}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: tab === t.k ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t.k ? 'var(--color-text)' : 'var(--color-text-muted)',
                borderRight: t.k !== 'expense' ? '1px solid var(--color-border)' : 'none',
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }} />
          <input placeholder="Search transactions…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-8" style={{ height: 34 }} />
        </div>
      </div>

      {/* List */}
      {loading ? <SkeletonList rows={8} /> : items.length === 0 ? (
        <EmptyState emoji="💳" title="No transactions found"
          description={search ? 'Try a different search' : 'Add your first income or expense'} />
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => {
            const isExp = item._type === 'expense';
            const cfg   = isExp ? (CATEGORY_CONFIG[item.category] ?? {}) : (INCOME_TYPE_CONFIG[item.type] ?? {});
            const color = isExp ? 'var(--color-danger)' : 'var(--color-success)';
            return (
              <motion.div key={item._id}
                className="card p-3.5 flex items-center gap-3 group"
                style={{ cursor: 'default' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isExp ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }}>
                  {isExp
                    ? <ArrowDownRight size={15} style={{ color: 'var(--color-danger)' }} />
                    : <ArrowUpRight   size={15} style={{ color: 'var(--color-success)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {isExp ? item.category : item.type} · {formatDate(item.date, 'dd MMM yyyy')}
                    {isExp && item.paymentMethod ? ` · ${item.paymentMethod}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-sm font-semibold tabular-nums"
                    style={{ color, letterSpacing: '-0.02em' }}>
                    {isExp ? '−' : '+'}{formatCurrency(item.amount)}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setDeleteItem({ id: item._id, type: item._type })}
                      className="btn-icon hover:text-red-400" style={{ width: 28, height: 28 }}>
                      <Trash2 size={13} />
                    </button>
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
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-xs disabled:opacity-30" style={{ height: 30, padding: '0 12px' }}>
              ← Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-xs disabled:opacity-30" style={{ height: 30, padding: '0 12px' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteItem} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)}
        title="Delete transaction?" message="This will permanently remove this entry." />
    </div>
  );
}
