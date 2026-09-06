import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { differenceInDays, parseISO } from 'date-fns';
import api from '../../services/api';
import {
  formatCurrency, formatDate,
  SUBSCRIPTION_PLATFORMS, SUBSCRIPTION_LOGOS, BILLING_CYCLES,
} from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/SkeletonLoader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_CLS = { active: 'badge-success', paused: 'badge-warning', cancelled: 'badge-danger' };

const BLANK = {
  name: '', platform: 'Netflix', amount: '', billingCycle: 'monthly',
  startDate:       new Date().toISOString().split('T')[0],
  nextRenewalDate: '',
  status: 'active', reminderDays: 3, category: 'Entertainment', notes: '',
};

export default function Subscriptions() {
  const [subs,       setSubs]       = useState([]);
  const [monthly,    setMonthly]    = useState(0);
  const [upcoming,   setUpcoming]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [statusFilt, setStatusFilt] = useState('active');
  const [modal,      setModal]      = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(BLANK);
  const [deleteId,   setDeleteId]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [sR, uR] = await Promise.all([
        api.get('/subscriptions', { params: statusFilt !== 'all' ? { status: statusFilt } : {} }),
        api.get('/subscriptions/upcoming?days=7'),
      ]);
      setSubs(sR.data.subscriptions);
      setMonthly(sR.data.monthlyCost ?? 0);
      setUpcoming(uR.data.renewals ?? []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [statusFilt]);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(BLANK); setEditId(null); setModal(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, platform: s.platform ?? 'Other', amount: s.amount.toString(),
      billingCycle: s.billingCycle,
      startDate:        new Date(s.startDate).toISOString().split('T')[0],
      nextRenewalDate:  new Date(s.nextRenewalDate).toISOString().split('T')[0],
      status: s.status, reminderDays: s.reminderDays ?? 3,
      category: s.category ?? 'Entertainment', notes: s.notes ?? '',
    });
    setEditId(s._id); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.nextRenewalDate) {
      toast.error('Name, amount and renewal date are required'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editId) { await api.put(`/subscriptions/${editId}`, payload); toast.success('✅ Updated!'); }
      else        { await api.post('/subscriptions', payload);          toast.success('📺 Added!');  }
      setModal(false); fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/subscriptions/${deleteId}`); toast.success('🗑️ Deleted'); setDeleteId(null); fetch(); }
    catch (_) { toast.error('Failed'); }
  };

  const daysUntil = (date) => {
    try { return differenceInDays(parseISO(date), new Date()); }
    catch { return null; }
  };

  const annualCost = monthly * 12;

  const FILTER_TABS = [
    { k: 'all',       l: '📋 All'       },
    { k: 'active',    l: '✅ Active'    },
    { k: 'paused',    l: '⏸️ Paused'    },
    { k: 'cancelled', l: '❌ Cancelled' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Subscriptions 📺</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage digital subscriptions and renewal alerts</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Subscription</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monthly Cost', value: formatCurrency(monthly),     emoji: '💸', color: 'text-orange-400' },
          { label: 'Annual Cost',  value: formatCurrency(annualCost),  emoji: '📅', color: 'text-amber-400'  },
          { label: 'Active',       value: subs.filter(s => s.status === 'active').length, emoji: '✅', color: 'text-teal-400' },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <motion.div className="card p-4" style={{ borderColor: 'rgba(245,158,11,0.25)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-amber-400" />
            <p className="text-sm font-semibold text-amber-300 font-display">Renewing in 7 days</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcoming.map(s => {
              const d = daysUntil(s.nextRenewalDate);
              return (
                <div key={s._id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-base">{SUBSCRIPTION_LOGOS[s.platform] ?? '📱'}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-amber-400">
                      {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`} · {formatCurrency(s.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(t => (
          <button key={t.k} onClick={() => setStatusFilt(t.k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilt === t.k
              ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? <SkeletonList rows={4} /> : subs.length === 0 ? (
        <EmptyState emoji="📺" title="No subscriptions"
          description="Add Netflix, Spotify and other subscriptions"
          action={<button onClick={openAdd} className="btn-primary">+ Add Subscription</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subs.map((sub, i) => {
            const logo   = SUBSCRIPTION_LOGOS[sub.platform] ?? '📱';
            const days   = daysUntil(sub.nextRenewalDate);
            const urgent = days !== null && days <= 3 && sub.status === 'active';
            return (
              <motion.div key={sub._id}
                className="card p-4 group"
                style={urgent ? { borderColor: 'rgba(245,158,11,0.3)' } : {}}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {logo}
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-white">{sub.name}</h3>
                      <span className={`${STATUS_CLS[sub.status]} text-[10px]`}>{sub.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(sub)} className="btn-icon w-7 h-7 hover:text-teal-400"><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteId(sub._id)} className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-slate-500 mb-0.5">Amount</p>
                    <p className="font-display font-bold text-white">{formatCurrency(sub.amount)}</p>
                    <p className="text-slate-600 capitalize">{sub.billingCycle}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: urgent ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: urgent ? '1px solid rgba(245,158,11,0.2)' : 'none' }}>
                    <p className="text-slate-500 mb-0.5">Renewal</p>
                    <p className={`font-display font-bold ${urgent ? 'text-amber-400' : 'text-white'}`}>
                      {days !== null ? (days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`) : '—'}
                    </p>
                    <p className="text-slate-600">{formatDate(sub.nextRenewalDate, 'dd MMM')}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? '✏️ Edit Subscription' : '📺 Add Subscription'}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : editId ? '✅ Update' : '📺 Add'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Platform</label>
            <select value={form.platform} onChange={e => { set('platform', e.target.value); if (!editId && e.target.value !== 'Other') set('name', e.target.value); }} className="input-field">
              {SUBSCRIPTION_PLATFORMS.map(p => <option key={p} value={p}>{SUBSCRIPTION_LOGOS[p]} {p}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Name *</label>
            <input placeholder="Subscription name" value={form.name} onChange={e => set('name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Amount ₹ *</label>
            <input type="number" min="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Billing Cycle</label>
            <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)} className="input-field capitalize">
              {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Next Renewal *</label>
            <input type="date" value={form.nextRenewalDate} onChange={e => set('nextRenewalDate', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="form-label">Remind me</label>
            <select value={form.reminderDays} onChange={e => set('reminderDays', parseInt(e.target.value))} className="input-field">
              {[1,2,3,5,7,14].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''} before</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field capitalize">
              {['active','paused','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <input placeholder="Any notes…" value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete Subscription?" message="This will remove the subscription from your tracker." />
    </div>
  );
}
