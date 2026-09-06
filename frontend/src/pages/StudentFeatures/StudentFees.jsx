import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency, formatDate, FEE_TYPES, getDaysOverdue } from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS = {
  paid:           { label: 'Paid',           cls: 'badge-success', bar: '#14b8a6', emoji: '✅' },
  partially_paid: { label: 'Partially Paid', cls: 'badge-warning', bar: '#f59e0b', emoji: '⏳' },
  pending:        { label: 'Pending',         cls: 'badge-info',    bar: '#0ea5e9', emoji: '🔔' },
  overdue:        { label: 'Overdue',         cls: 'badge-danger',  bar: '#ef4444', emoji: '🚨' },
};

const BLANK = {
  feeType: 'Semester Fee', title: '', totalAmount: '', paidAmount: '0',
  dueDate: '', semester: '', academicYear: '', notes: '', status: 'pending',
};

export default function StudentFees() {
  const [fees,     setFees]     = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [deleteId, setDeleteId] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/student-fees', { params });
      setFees(res.data.fees);
      setSummary(res.data.summary ?? {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit = (fee) => {
    setForm({
      feeType: fee.feeType, title: fee.title,
      totalAmount: fee.totalAmount.toString(),
      paidAmount:  fee.paidAmount.toString(),
      dueDate:     new Date(fee.dueDate).toISOString().split('T')[0],
      semester:    fee.semester?.toString() ?? '',
      academicYear: fee.academicYear ?? '',
      notes:       fee.notes ?? '',
      status:      fee.status,
    });
    setEditId(fee._id); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.totalAmount || !form.dueDate) {
      toast.error('Title, amount and due date are required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        paidAmount:  parseFloat(form.paidAmount) || 0,
        semester:    form.semester ? parseInt(form.semester) : undefined,
      };
      if (editId) {
        await api.put(`/student-fees/${editId}`, payload);
        toast.success('✅ Fee updated!');
      } else {
        await api.post('/student-fees', payload);
        toast.success('🎓 Fee added!');
      }
      setModal(false); fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/student-fees/${deleteId}`);
      toast.success('🗑️ Deleted');
      setDeleteId(null); fetch();
    } catch (_) { toast.error('Failed to delete'); }
  };

  const FILTER_TABS = [
    { key: 'all',            label: '📋 All' },
    { key: 'pending',        label: '🔔 Pending' },
    { key: 'partially_paid', label: '⏳ Partial' },
    { key: 'paid',           label: '✅ Paid' },
    { key: 'overdue',        label: '🚨 Overdue' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Fee Tracker 🎓</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track semester, hostel, exam and placement fees</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Fee
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Fees', value: formatCurrency(summary.totalFees   ?? 0), emoji: '💰', color: 'text-white'      },
          { label: 'Paid',       value: formatCurrency(summary.totalPaid   ?? 0), emoji: '✅', color: 'text-teal-400'   },
          { label: 'Due',        value: formatCurrency(summary.totalDue    ?? 0), emoji: '⏳', color: 'text-amber-400'  },
          { label: 'Overdue',    value: summary.overdueFees ?? 0,                  emoji: '🚨', color: 'text-red-400'   },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === t.key
              ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <SkeletonList rows={5} /> : fees.length === 0 ? (
        <EmptyState emoji="🎓" title="No fees found"
          description="Add your semester fees, hostel charges, and more"
          action={<button onClick={openAdd} className="btn-primary">+ Add Fee</button>} />
      ) : (
        <div className="space-y-3">
          {fees.map((fee, i) => {
            const st       = STATUS[fee.status] ?? STATUS.pending;
            const paidPct  = fee.totalAmount > 0 ? Math.round((fee.paidAmount / fee.totalAmount) * 100) : 0;
            const dueAmt   = fee.totalAmount - fee.paidAmount;
            const overdays = fee.status === 'overdue' ? getDaysOverdue(fee.dueDate) : 0;

            return (
              <motion.div key={fee._id} className="card p-5 group"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`${st.cls} text-xs`}>{st.emoji} {st.label}</span>
                      <span className="badge text-[10px]" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {fee.feeType}
                      </span>
                      {fee.semester && (
                        <span className="badge-teal text-[10px]">Sem {fee.semester}</span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-white truncate">{fee.title}</h3>
                    {fee.academicYear && <p className="text-xs text-slate-500 mt-0.5">AY: {fee.academicYear}</p>}
                  </div>
                  <div className="flex items-start gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-display text-lg font-black text-white">{formatCurrency(fee.totalAmount)}</p>
                      {dueAmt > 0 && <p className="text-xs text-orange-400">Due: {formatCurrency(dueAmt)}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(fee)} className="btn-icon w-7 h-7 hover:text-teal-400"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteId(fee._id)} className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Paid: {formatCurrency(fee.paidAmount)}</span>
                    <span className="font-semibold" style={{ color: st.bar }}>{paidPct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: st.bar }}
                      initial={{ width: 0 }}
                      animate={{ width: `${paidPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={11} /> Due: {formatDate(fee.dueDate)}</span>
                  {overdays > 0 && <span className="text-red-400 font-semibold">🚨 {overdays}d overdue</span>}
                  {fee.notes && <span className="truncate text-slate-600">📝 {fee.notes}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} size="lg"
        title={editId ? '✏️ Edit Fee' : '🎓 Add Fee Record'}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : editId ? '✅ Update' : '🎓 Add Fee'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Fee Type</label>
            <select value={form.feeType} onChange={e => set('feeType', e.target.value)} className="input-field">
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Title *</label>
            <input placeholder="e.g. 5th Semester Fee" value={form.title}
              onChange={e => set('title', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Total Amount ₹ *</label>
            <input type="number" placeholder="0.00" min="0" value={form.totalAmount}
              onChange={e => set('totalAmount', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Paid Amount ₹</label>
            <input type="number" placeholder="0.00" min="0" value={form.paidAmount}
              onChange={e => set('paidAmount', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select value={form.semester} onChange={e => set('semester', e.target.value)} className="input-field">
              <option value="">Select</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Academic Year</label>
            <input placeholder="e.g. 2025-26" value={form.academicYear}
              onChange={e => set('academicYear', e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              className="input-field resize-none" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete Fee Record?" message="This fee record will be permanently deleted." />
    </div>
  );
}
