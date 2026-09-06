import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Bell, Clock, RefreshCw } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatCurrency, formatDate, FEE_TYPES, SUBSCRIPTION_PLATFORMS, SUBSCRIPTION_LOGOS, BILLING_CYCLES } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const TABS = ['Subscriptions', 'Semester Fees'];

export default function RecurringPayments() {
  const [tab,       setTab]       = useState('Subscriptions');
  const [subs,      setSubs]      = useState([]);
  const [fees,      setFees]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleteType,setDeleteType]= useState('sub');
  const [form,      setForm]      = useState({});

  const subBlank = {
    name: '', platform: 'Netflix', amount: '', billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0], nextRenewalDate: '',
    status: 'active', reminderDays: 3,
  };
  const feeBlank = {
    feeType: 'Semester Fee', title: '', totalAmount: '', paidAmount: '0',
    dueDate: '', semester: '', academicYear: '', status: 'pending',
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [sR, fR] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/student-fees'),
      ]);
      setSubs(sR.data.subscriptions ?? []);
      setFees(fR.data.fees ?? []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm(tab === 'Subscriptions' ? subBlank : feeBlank);
    setEditId(null); setModal(true);
  };

  const openEdit = (item) => {
    if (tab === 'Subscriptions') {
      setForm({
        name: item.name, platform: item.platform ?? 'Other', amount: item.amount.toString(),
        billingCycle: item.billingCycle,
        startDate:       new Date(item.startDate).toISOString().split('T')[0],
        nextRenewalDate: new Date(item.nextRenewalDate).toISOString().split('T')[0],
        status: item.status, reminderDays: item.reminderDays ?? 3,
      });
    } else {
      setForm({
        feeType: item.feeType, title: item.title,
        totalAmount: item.totalAmount.toString(), paidAmount: item.paidAmount.toString(),
        dueDate: new Date(item.dueDate).toISOString().split('T')[0],
        semester: item.semester?.toString() ?? '', academicYear: item.academicYear ?? '',
        status: item.status,
      });
    }
    setEditId(item._id); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isSub = tab === 'Subscriptions';
      const payload = isSub
        ? { ...form, amount: parseFloat(form.amount) }
        : { ...form, totalAmount: parseFloat(form.totalAmount), paidAmount: parseFloat(form.paidAmount) || 0, semester: form.semester ? parseInt(form.semester) : undefined };

      if (editId) {
        await api.put(`/${isSub ? 'subscriptions' : 'student-fees'}/${editId}`, payload);
        toast.success('Updated');
      } else {
        await api.post(`/${isSub ? 'subscriptions' : 'student-fees'}`, payload);
        toast.success('Added');
      }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/${deleteType === 'sub' ? 'subscriptions' : 'student-fees'}/${deleteId}`);
      toast.success('Deleted'); setDeleteId(null); fetch();
    } catch (_) { toast.error('Failed'); }
  };

  const daysUntil = (d) => { try { return differenceInDays(parseISO(d), new Date()); } catch { return null; } };

  const monthlyCost = subs.filter(s => s.status === 'active').reduce((sum, s) => {
    const m = { monthly: 1, quarterly: 1/3, 'half-yearly': 1/6, yearly: 1/12 };
    return sum + s.amount * (m[s.billingCycle] ?? 1);
  }, 0);
  const totalFees = fees.reduce((s, f) => s + f.totalAmount, 0);
  const feePaid   = fees.reduce((s, f) => s + f.paidAmount, 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)', letterSpacing: '-0.025em' }}>
            Recurring Payments
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Subscriptions and semester fees
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5" style={{ height: 34 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Monthly Cost', v: formatCurrency(monthlyCost),            emoji: '🔄' },
          { l: 'Annual Cost',  v: formatCurrency(monthlyCost * 12),       emoji: '📅' },
          { l: 'Total Fees',   v: formatCurrency(totalFees),               emoji: '🎓' },
          { l: 'Fees Paid',    v: formatCurrency(feePaid),                 emoji: '✅' },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <p className="text-lg mb-1">{s.emoji}</p>
            <p className="text-base font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>{s.v}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.l}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-strong)', width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderRight: i === 0 ? '1px solid var(--color-border)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? <SkeletonList rows={5} /> : tab === 'Subscriptions' ? (
        subs.length === 0 ? (
          <EmptyState emoji="📺" title="No subscriptions" description="Add Netflix, Spotify and other subscriptions"
            action={<button onClick={openAdd} className="btn-primary">+ Add Subscription</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subs.map((sub, i) => {
              const days   = daysUntil(sub.nextRenewalDate);
              const urgent = days !== null && days <= 3 && sub.status === 'active';
              return (
                <motion.div key={sub._id} className="card p-4 group"
                  style={urgent ? { borderColor: 'var(--color-warning-border)' } : {}}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)' }}>
                        {SUBSCRIPTION_LOGOS[sub.platform] ?? '📱'}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{sub.name}</p>
                        <span className={`badge-${sub.status === 'active' ? 'success' : 'neutral'} text-[10px]`}>{sub.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(sub)} className="btn-icon hover:text-accent" style={{ width: 28, height: 28 }}><Edit2 size={12} /></button>
                      <button onClick={() => { setDeleteId(sub._id); setDeleteType('sub'); }} className="btn-icon hover:text-red-400" style={{ width: 28, height: 28 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p style={{ color: 'var(--color-text-muted)' }}>Amount</p>
                      <p className="font-semibold mt-0.5 tabular-nums" style={{ color: 'var(--color-text)' }}>{formatCurrency(sub.amount)}</p>
                      <p style={{ color: 'var(--color-text-muted)' }} className="mt-0.5 capitalize">{sub.billingCycle}</p>
                    </div>
                    <div className="rounded-lg p-2"
                      style={{ background: urgent ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)', border: urgent ? '1px solid var(--color-warning-border)' : 'none' }}>
                      <p style={{ color: 'var(--color-text-muted)' }}>Renewal</p>
                      <p className="font-semibold mt-0.5" style={{ color: urgent ? 'var(--color-warning)' : 'var(--color-text)' }}>
                        {days !== null ? (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`) : '—'}
                      </p>
                      <p style={{ color: 'var(--color-text-muted)' }} className="mt-0.5">{formatDate(sub.nextRenewalDate, 'dd MMM')}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        fees.length === 0 ? (
          <EmptyState emoji="🎓" title="No fees added" description="Track semester, hostel and exam fees"
            action={<button onClick={openAdd} className="btn-primary">+ Add Fee</button>} />
        ) : (
          <div className="space-y-3">
            {fees.map((fee, i) => {
              const pct = fee.totalAmount > 0 ? Math.round((fee.paidAmount / fee.totalAmount) * 100) : 0;
              const barColor = fee.status === 'paid' ? 'var(--color-accent)' : fee.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-warning)';
              return (
                <motion.div key={fee._id} className="card p-5 group"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge-${fee.status === 'paid' ? 'success' : fee.status === 'overdue' ? 'danger' : 'warning'} text-[10px]`}>
                          {fee.status.replace('_', ' ')}
                        </span>
                        <span className="badge-neutral text-[10px]">{fee.feeType}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{fee.title}</p>
                      {fee.academicYear && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>AY {fee.academicYear}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-base font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>{formatCurrency(fee.totalAmount)}</p>
                        {fee.totalAmount - fee.paidAmount > 0 && (
                          <p className="text-xs" style={{ color: 'var(--color-warning)' }}>Due: {formatCurrency(fee.totalAmount - fee.paidAmount)}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(fee)} className="btn-icon" style={{ width: 28, height: 28 }}><Edit2 size={12} /></button>
                        <button onClick={() => { setDeleteId(fee._id); setDeleteType('fee'); }} className="btn-icon hover:text-red-400" style={{ width: 28, height: 28 }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--color-text-muted)' }}>Paid: {formatCurrency(fee.paidAmount)}</span>
                      <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div className="progress-bar"><motion.div className="progress-fill" style={{ background: barColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock size={11} /> Due: {formatDate(fee.dueDate)}
                    {fee.semester && <span className="ml-1">· Sem {fee.semester}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={`${editId ? 'Edit' : 'Add'} ${tab === 'Subscriptions' ? 'Subscription' : 'Fee'}`}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : 'Save'}
            </button>
          </>
        }
      >
        {tab === 'Subscriptions' ? (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Platform</label>
              <select value={form.platform ?? 'Other'} onChange={e => { set('platform', e.target.value); if (!editId && e.target.value !== 'Other') set('name', e.target.value); }} className="input-field">
                {SUBSCRIPTION_PLATFORMS.map(p => <option key={p} value={p}>{SUBSCRIPTION_LOGOS[p]} {p}</option>)}
              </select></div>
            <div><label className="form-label">Name *</label><input value={form.name ?? ''} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Subscription name" /></div>
            <div><label className="form-label">Amount ₹ *</label><input type="number" value={form.amount ?? ''} onChange={e => set('amount', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Billing Cycle</label>
              <select value={form.billingCycle ?? 'monthly'} onChange={e => set('billingCycle', e.target.value)} className="input-field capitalize">
                {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="form-label">Start Date</label><input type="date" value={form.startDate ?? ''} onChange={e => set('startDate', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Next Renewal *</label><input type="date" value={form.nextRenewalDate ?? ''} onChange={e => set('nextRenewalDate', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Status</label>
              <select value={form.status ?? 'active'} onChange={e => set('status', e.target.value)} className="input-field capitalize">
                {['active','paused','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Fee Type</label>
              <select value={form.feeType ?? 'Semester Fee'} onChange={e => set('feeType', e.target.value)} className="input-field">
                {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="form-label">Due Date *</label><input type="date" value={form.dueDate ?? ''} onChange={e => set('dueDate', e.target.value)} className="input-field" /></div>
            <div className="col-span-2"><label className="form-label">Title *</label><input placeholder="e.g. 5th Semester Fee" value={form.title ?? ''} onChange={e => set('title', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Total ₹ *</label><input type="number" min="0" value={form.totalAmount ?? ''} onChange={e => set('totalAmount', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Paid ₹</label><input type="number" min="0" value={form.paidAmount ?? '0'} onChange={e => set('paidAmount', e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Semester</label>
              <select value={form.semester ?? ''} onChange={e => set('semester', e.target.value)} className="input-field">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select></div>
            <div><label className="form-label">Academic Year</label><input placeholder="e.g. 2025-26" value={form.academicYear ?? ''} onChange={e => set('academicYear', e.target.value)} className="input-field" /></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete?" message="This will permanently remove this entry." />
    </div>
  );
}
