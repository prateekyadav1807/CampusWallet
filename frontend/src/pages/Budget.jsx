import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  formatCurrency, CATEGORY_CONFIG, EXPENSE_CATEGORIES,
  getCurrentMonthYear, getDaysRemainingInMonth, MONTHS,
} from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CURR = getCurrentMonthYear();

function statusInfo(pct) {
  if (pct >= 100) return { label: 'Over Budget',   color: 'text-red-400',    bar: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' };
  if (pct >= 80)  return { label: 'Near Limit',    color: 'text-orange-400', bar: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' };
  if (pct >= 50)  return { label: 'On Track',      color: 'text-amber-400',  bar: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' };
  return           { label: 'Looking Good',        color: 'text-teal-400',   bar: '#14b8a6', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)' };
}

export default function Budget() {
  const [budget,   setBudget]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [month,    setMonth]    = useState(CURR.month);
  const [year,     setYear]     = useState(CURR.year);
  const [modal,    setModal]    = useState(false);
  const [delConf,  setDelConf]  = useState(false);

  const [form, setForm] = useState({
    totalBudget: '', alertThreshold: 80, notes: '',
    categoryBudgets: EXPENSE_CATEGORIES.map(c => ({ category: c, limit: '' })),
  });

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month, year } });
      setBudget(res.data.budget);
    } catch (_) {}
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const openModal = () => {
    setForm({
      totalBudget: budget?.totalBudget?.toString() ?? '',
      alertThreshold: budget?.alertThreshold ?? 80,
      notes: budget?.notes ?? '',
      categoryBudgets: EXPENSE_CATEGORIES.map(cat => {
        const cb = budget?.categoryBudgets?.find(c => c.category === cat);
        return { category: cat, limit: cb?.limit?.toString() ?? '' };
      }),
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.totalBudget || parseFloat(form.totalBudget) <= 0) {
      toast.error('Enter a valid budget amount'); return;
    }
    setSaving(true);
    try {
      await api.post('/budgets', {
        month, year,
        totalBudget: parseFloat(form.totalBudget),
        alertThreshold: parseInt(form.alertThreshold),
        notes: form.notes,
        categoryBudgets: form.categoryBudgets
          .filter(c => c.limit && parseFloat(c.limit) > 0)
          .map(c => ({ category: c.category, limit: parseFloat(c.limit) })),
      });
      toast.success('💼 Budget saved!');
      setModal(false);
      fetchBudget();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/budgets/${budget._id}`);
      toast.success('🗑️ Budget removed');
      setBudget(null);
      setDelConf(false);
    } catch (_) { toast.error('Failed to delete'); }
  };

  const daysLeft = getDaysRemainingInMonth();
  const isCurrentMonth = month === CURR.month && year === CURR.year;
  const years = [CURR.year - 1, CURR.year, CURR.year + 1];
  const info  = budget ? statusInfo(budget.usedPercentage ?? 0) : null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Budget Planner 🎯</h1>
          <p className="text-sm text-slate-400 mt-0.5">Set monthly spending limits and track utilisation</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector */}
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="input-field h-9 text-sm w-32">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="input-field h-9 text-sm w-24">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openModal} className="btn-primary flex items-center gap-2 h-9">
            {budget ? <><Edit2 size={14} /> Edit</> : <><Plus size={14} /> Set Budget</>}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : !budget ? (
        <EmptyState emoji="🎯" title={`No budget for ${MONTHS[month - 1]} ${year}`}
          description="Set a monthly budget to track your spending and get alerts"
          action={<button onClick={openModal} className="btn-primary">🎯 Set Budget Now</button>}
        />
      ) : (
        <div className="space-y-4">

          {/* Main card */}
          <motion.div className="card p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            {/* Tinted glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${info.bg} 0%, transparent 70%)` }} />

            <div className="relative z-10">
              {/* Title row */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">{MONTHS[month - 1]} {year}</h2>
                  <p className={`text-sm font-medium mt-0.5 ${info.color}`}>{info.label}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={openModal} className="btn-icon hover:text-teal-400"><Edit2 size={15} /></button>
                  <button onClick={() => setDelConf(true)} className="btn-icon hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Budget',    value: formatCurrency(budget.totalBudget), color: 'text-white' },
                  { label: 'Spent',     value: formatCurrency(budget.totalSpent),  color: 'text-orange-400' },
                  { label: 'Remaining', value: formatCurrency(Math.max(0, budget.remaining)), color: budget.remaining >= 0 ? 'text-teal-400' : 'text-red-400' },
                ].map(n => (
                  <div key={n.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className={`font-display text-xl font-black ${n.color}`}>{n.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Budget used</span>
                  <span className={`font-bold ${info.color}`}>{budget.usedPercentage ?? 0}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: info.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, budget.usedPercentage ?? 0)}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Info chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { emoji: '📅', label: 'Days Left',   value: isCurrentMonth ? `${daysLeft} days` : '—' },
                  { emoji: '⚡', label: 'Daily Limit', value: budget.dailyLimit > 0 ? formatCurrency(budget.dailyLimit) : '—' },
                  { emoji: '🔔', label: 'Alert At',    value: `${budget.alertThreshold ?? 80}%` },
                  { emoji: budget.isOverBudget ? '🚨' : '✅', label: 'Status', value: budget.isOverBudget ? 'Over Budget' : 'On Track' },
                ].map(c => (
                  <div key={c.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-base mb-0.5">{c.emoji}</p>
                    <p className="font-display text-sm font-bold text-white">{c.value}</p>
                    <p className="text-[10px] text-slate-500">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Over-budget warning */}
              {budget.isOverBudget && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="text-xl">🚨</span>
                  <p className="text-sm text-red-300">
                    You're <strong>{formatCurrency(Math.abs(budget.remaining))}</strong> over budget. Review your expenses.
                  </p>
                </div>
              )}

              {budget.notes && (
                <div className="mt-3 px-4 py-3 rounded-xl text-xs text-slate-400"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  📝 {budget.notes}
                </div>
              )}
            </div>
          </motion.div>

          {/* Category breakdown */}
          {budget.categoryBreakdown?.length > 0 && (
            <motion.div className="card p-5"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="font-display font-semibold text-white mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {budget.categoryBreakdown.map((cb, i) => {
                  const cfg = CATEGORY_CONFIG[cb.category] ?? {};
                  const si  = statusInfo(cb.percentage ?? 0);
                  return (
                    <div key={cb.category} className="flex items-center gap-3">
                      <span className="text-xl w-7 flex-shrink-0">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium">{cb.category}</span>
                          <span className="text-slate-400">{formatCurrency(cb.spent)} / {formatCurrency(cb.limit)}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <motion.div className="h-full rounded-full"
                            style={{ background: si.bar }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, cb.percentage ?? 0)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.04 }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-bold w-9 text-right flex-shrink-0 ${si.color}`}>
                        {cb.percentage ?? 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} size="lg"
        title={`🎯 ${budget ? 'Edit' : 'Set'} Budget — ${MONTHS[month - 1]} ${year}`}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : '💾 Save Budget'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Total Monthly Budget ₹ *</label>
              <input type="number" placeholder="e.g. 15000" min="1"
                value={form.totalBudget}
                onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))}
                className="input-field text-base font-bold" />
            </div>
            <div>
              <label className="form-label">Alert Threshold %</label>
              <input type="number" min="10" max="100"
                value={form.alertThreshold}
                onChange={e => setForm(f => ({ ...f, alertThreshold: e.target.value }))}
                className="input-field" />
              <p className="text-[10px] text-slate-600 mt-1">Notify when you hit this % of budget</p>
            </div>
          </div>

          <div>
            <label className="form-label">Category Limits <span className="text-slate-600 normal-case">(optional)</span></label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {form.categoryBudgets.map((cb, i) => {
                const cfg = CATEGORY_CONFIG[cb.category] ?? {};
                return (
                  <div key={cb.category} className="flex items-center gap-2 rounded-xl p-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-base flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 truncate">{cb.category}</p>
                      <input type="number" placeholder="₹ limit" min="0"
                        value={cb.limit}
                        onChange={e => {
                          const updated = [...form.categoryBudgets];
                          updated[i] = { ...updated[i], limit: e.target.value };
                          setForm(f => ({ ...f, categoryBudgets: updated }));
                        }}
                        className="w-full bg-transparent text-xs text-white placeholder-slate-600
                                   border-none outline-none mt-0.5 p-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea rows={2} placeholder="Budget goals…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field resize-none" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={delConf} onCancel={() => setDelConf(false)} onConfirm={handleDelete}
        title="Delete Budget?" message={`Remove budget for ${MONTHS[month - 1]} ${year}?`} />
    </div>
  );
}
