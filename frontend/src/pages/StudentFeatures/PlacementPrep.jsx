import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency, formatDate, PLACEMENT_CATEGORIES } from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CAT_EMOJIS = {
  'Courses': '🎓', 'Certifications': '🏆', 'Interview Preparation': '💼',
  'Books': '📚', 'Online Platforms': '💻', 'Mock Tests': '📝',
  'Resume Building': '📄', 'Coaching': '🧑‍🏫', 'Other': '📦',
};
const STATUS_CLS = { completed: 'badge-success', 'in-progress': 'badge-info', planned: 'badge-warning' };

const BLANK = {
  title: '', amount: '', category: 'Courses', platform: '',
  date: new Date().toISOString().split('T')[0],
  status: 'completed', outcome: '', certificateUrl: '', notes: '',
};

export default function PlacementPrep() {
  const [expenses,  setExpenses]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [catStats,  setCatStats]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(BLANK);
  const [deleteId,  setDeleteId]  = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = catFilter ? { category: catFilter } : {};
      const res = await api.get('/placement', { params });
      setExpenses(res.data.expenses);
      setTotal(res.data.totalInvested ?? 0);
      setCatStats(res.data.categoryStats ?? []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [catFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit = (exp) => {
    setForm({
      title: exp.title, amount: exp.amount.toString(), category: exp.category,
      platform: exp.platform ?? '', date: new Date(exp.date).toISOString().split('T')[0],
      status: exp.status, outcome: exp.outcome ?? '',
      certificateUrl: exp.certificateUrl ?? '', notes: exp.notes ?? '',
    });
    setEditId(exp._id); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) { await api.put(`/placement/${editId}`, payload); toast.success('✅ Updated!'); }
      else        { await api.post('/placement', payload);           toast.success('🎯 Added!');  }
      setModal(false); fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/placement/${deleteId}`); toast.success('🗑️ Deleted'); setDeleteId(null); fetch(); }
    catch (_) { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Placement Prep 🎯</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track investment in courses, certifications & interview prep</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Expense</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invested', value: formatCurrency(total),                                           emoji: '💰', color: 'text-amber-400'  },
          { label: 'Items',          value: expenses.length,                                                  emoji: '📋', color: 'text-white'      },
          { label: 'Completed',      value: expenses.filter(e => e.status === 'completed').length,            emoji: '✅', color: 'text-teal-400'   },
          { label: 'In Progress',    value: expenses.filter(e => e.status === 'in-progress').length,          emoji: '⚡', color: 'text-sky-400'    },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category filter chips */}
      {catStats.length > 0 && (
        <motion.div className="card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCatFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!catFilter
                ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
              📋 All
            </button>
            {catStats.map(cs => (
              <button key={cs._id} onClick={() => setCatFilter(f => f === cs._id ? '' : cs._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === cs._id
                  ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
                {CAT_EMOJIS[cs._id] ?? '📦'} {cs._id}
                <span className="ml-1 text-orange-400 font-bold">{formatCurrency(cs.total)}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* List */}
      {loading ? <SkeletonList rows={5} /> : expenses.length === 0 ? (
        <EmptyState emoji="🎯" title="No placement expenses"
          description="Track courses, certifications, interview prep spending"
          action={<button onClick={openAdd} className="btn-primary">+ Add Expense</button>} />
      ) : (
        <div className="space-y-2">
          {expenses.map((exp, i) => (
            <motion.div key={exp._id} className="card p-4 group flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.15)' }}>
                {CAT_EMOJIS[exp.category] ?? '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-sm font-semibold text-white truncate">{exp.title}</h3>
                  <span className={`${STATUS_CLS[exp.status] ?? 'badge-info'} text-[10px]`}>{exp.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="text-teal-400 font-medium">{exp.category}</span>
                  {exp.platform && <><span>·</span><span>{exp.platform}</span></>}
                  <span>·</span><span>{formatDate(exp.date)}</span>
                </div>
                {exp.outcome && <p className="text-xs text-emerald-400 mt-1">🏆 {exp.outcome}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-display font-bold text-amber-400 text-sm">{formatCurrency(exp.amount)}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {exp.certificateUrl && (
                    <a href={exp.certificateUrl} target="_blank" rel="noopener noreferrer"
                      className="btn-icon w-7 h-7 hover:text-emerald-400"><ExternalLink size={12} /></a>
                  )}
                  <button onClick={() => openEdit(exp)} className="btn-icon w-7 h-7 hover:text-teal-400"><Edit2 size={12} /></button>
                  <button onClick={() => setDeleteId(exp._id)} className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? '✏️ Edit Expense' : '🎯 Add Placement Expense'}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : editId ? '✅ Update' : '🎯 Add'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="form-label">Title *</label>
            <input placeholder="e.g. DSA Course on Udemy" value={form.title}
              onChange={e => set('title', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Amount ₹ *</label>
            <input type="number" min="0.01" value={form.amount}
              onChange={e => set('amount', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" value={form.date}
              onChange={e => set('date', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {PLACEMENT_CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJIS[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field capitalize">
              {['completed','in-progress','planned'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Platform / Provider</label>
            <input placeholder="e.g. Udemy, Coursera, LeetCode" value={form.platform}
              onChange={e => set('platform', e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Outcome / Achievement</label>
            <input placeholder="e.g. Got certificate, Passed interview" value={form.outcome}
              onChange={e => set('outcome', e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Certificate URL</label>
            <input placeholder="https://…" value={form.certificateUrl}
              onChange={e => set('certificateUrl', e.target.value)} className="input-field" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete Record?" message="This placement expense will be permanently deleted." />
    </div>
  );
}
