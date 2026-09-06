import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Plus, Shield, Clock,
  ChevronRight, Zap, Sparkles, Target, Brain,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  formatCurrency, formatDate,
  CATEGORY_CONFIG, EXPENSE_CATEGORIES,
} from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/* ── Design tokens ──────────────────────────────────────────────────────── */
const ACCENT  = '#14B8A6';
const SUCCESS = '#22C55E';
const DANGER  = '#EF4444';
const WARNING = '#F59E0B';
const INFO    = '#3B82F6';
const PIE_COLORS = ['#14B8A6','#22C55E','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#0EA5E9','#F97316'];

/* ── Responsive hook ────────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
}

/* ── Glass card style ───────────────────────────────────────────────────── */
const glassCard = (extra = {}) => ({
  background: 'rgba(21,31,50,0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  ...extra,
});

/* ── Chart tooltip ──────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...glassCard(), padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, iconBg, sparkData, sparkColor, trend, i = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        ...glassCard(),
        padding: '16px',
        cursor: 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${sparkColor}22`
          : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0, marginLeft: 8,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${iconBg}55`,
        }}>
          <Icon size={16} color="#fff" strokeWidth={1.75} />
        </div>
      </div>

      {sparkData && sparkData.length >= 2 && (
        <div style={{ height: 28, marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spk-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
                fill={`url(#spk-${i})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 600, color: trend >= 0 ? SUCCESS : DANGER }}>
              {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          <span style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Budget ring ────────────────────────────────────────────────────────── */
function BudgetRing({ pct = 0, spent, total, remaining, dailyLimit }) {
  const R = 48;
  const C = 2 * Math.PI * R;
  const pctCapped = Math.min(100, pct);
  const dashOffset = C - (pctCapped / 100) * C;
  const color = pct >= 100 ? DANGER : pct >= 80 ? WARNING : ACCENT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 116, height: 116 }}>
        <svg width="116" height="116" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
          <motion.circle cx="58" cy="58" r={R} fill="none" stroke={color} strokeWidth={9}
            strokeLinecap="round" strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.16,1,0.3,1], delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct}%</p>
          <p style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>used</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
        {[
          { l: 'Spent',       v: formatCurrency(spent),                           c: DANGER },
          { l: 'Remaining',   v: formatCurrency(remaining > 0 ? remaining : 0),   c: ACCENT },
          { l: 'Budget',      v: formatCurrency(total),                            c: '#fff' },
          { l: 'Daily limit', v: formatCurrency(dailyLimit),                       c: INFO   },
        ].map(s => (
          <div key={s.l} style={{ padding: '7px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 9, color: '#64748B', marginBottom: 2 }}>{s.l}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Spending donut ─────────────────────────────────────────────────────── */
function SpendingDonut({ data }) {
  const [active, setActive] = useState(null);
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13 }}>No spending data yet</div>
  );
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flexShrink: 0, position: 'relative', width: 110, height: 110 }}>
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={48}
              paddingAngle={3} dataKey="value" strokeWidth={0}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                  opacity={active === null || active === i ? 1 : 0.4}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={({ active: a, payload: p }) => {
              if (!a || !p?.length) return null;
              const d = p[0];
              return (
                <div style={{ ...glassCard(), padding: '8px 12px', fontSize: 11 }}>
                  <p style={{ color: '#fff', fontWeight: 600 }}>{d.name}</p>
                  <p style={{ color: PIE_COLORS[d.payload?.index ?? 0] }}>{formatCurrency(d.value)} · {((d.value / total) * 100).toFixed(0)}%</p>
                </div>
              );
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {data.slice(0, 5).map((d, i) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: active === i ? '#fff' : '#94A3B8', transition: 'color 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Health score ───────────────────────────────────────────────────────── */
function HealthScore({ s }) {
  if (!s) return null;
  const savingsRate  = s.totalIncome > 0 ? (s.totalSavings / s.totalIncome) * 100 : 0;
  const budgetScore  = s.monthlyBudget > 0 ? Math.max(0, 100 - (s.budgetUsedPercentage ?? 0)) : 50;
  const incomeScore  = s.totalIncome > 0 ? 100 : 0;
  const savingsScore = Math.min(100, Math.max(0, savingsRate * 3));
  const score = Math.round(budgetScore * 0.35 + savingsScore * 0.40 + incomeScore * 0.25);
  const color = score >= 75 ? SUCCESS : score >= 50 ? WARNING : DANGER;
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';
  const R = 36; const C = 2 * Math.PI * R;

  const factors = [
    { l: 'Savings Rate',   v: `${savingsRate.toFixed(0)}%`,    pct: Math.min(100, savingsScore), c: savingsScore >= 60 ? SUCCESS : WARNING },
    { l: 'Budget Control', v: `${budgetScore.toFixed(0)}%`,    pct: Math.min(100, budgetScore),  c: budgetScore  >= 60 ? SUCCESS : WARNING },
    { l: 'Income Active',  v: incomeScore > 0 ? 'Yes' : 'No', pct: incomeScore,                 c: incomeScore  >= 60 ? SUCCESS : DANGER  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
            <motion.circle cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth={7}
              strokeLinecap="round" strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (score / 100) * C }}
              transition={{ duration: 1.2, ease: [0.16,1,0.3,1], delay: 0.4 }}
              style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{score}</p>
            <p style={{ fontSize: 8, color: '#64748B' }}>/ 100</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{label}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Financial health</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
            <Shield size={10} color={color} />
            <span style={{ fontSize: 10, color: '#64748B' }}>Savings & budget</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {factors.map(f => (
          <div key={f.l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{f.l}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: f.c }}>{f.v}</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', borderRadius: 99, background: f.c }}
                initial={{ width: 0 }} animate={{ width: `${f.pct}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16,1,0.3,1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AI insight card ────────────────────────────────────────────────────── */
function AIInsightCard({ insight, delay = 0 }) {
  const colors = { success: SUCCESS, warning: WARNING, danger: DANGER, info: ACCENT };
  const c = colors[insight.type] ?? ACCENT;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 13px', borderRadius: 10, background: `${c}0d`, border: `1px solid ${c}22`, transition: 'background 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.background = `${c}18`}
      onMouseLeave={e => e.currentTarget.style.background = `${c}0d`}
    >
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{insight.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2, lineHeight: 1.3 }}>{insight.title}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>{insight.message}</p>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 4, background: `${c}22`, color: c, flexShrink: 0 }}>
        {insight.priority}
      </span>
    </motion.div>
  );
}

/* ── Upcoming payments ──────────────────────────────────────────────────── */
function UpcomingPayments() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const [subR, feeR] = await Promise.all([
          api.get('/subscriptions/upcoming?days=14'),
          api.get('/student-fees?status=pending'),
        ]);
        const subs = (subR.data.renewals ?? []).map(s => ({ id: s._id, name: s.name, amount: s.amount, date: s.nextRenewalDate, emoji: '🔄' }));
        const fees = (feeR.data.fees ?? []).slice(0, 3).map(f => ({ id: f._id, name: f.title, amount: f.totalAmount - f.paidAmount, date: f.dueDate, emoji: '🎓' }));
        setItems([...subs, ...fees].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5));
      } catch (_) {}
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: 13 }}>No upcoming payments</p>
      ) : items.map((item, i) => {
        const d = Math.ceil((new Date(item.date) - new Date()) / (1000 * 60 * 60 * 24));
        const urgent = d <= 3;
        return (
          <motion.div key={item.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, background: urgent ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: urgent ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.background = urgent ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = urgent ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)'}
          >
            <span style={{ fontSize: 14 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
              <p style={{ fontSize: 10, color: urgent ? WARNING : '#64748B', marginTop: 1 }}>
                {d <= 0 ? 'Due today!' : d === 1 ? 'Tomorrow' : `${d} days`}
              </p>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(item.amount)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Quick add form ─────────────────────────────────────────────────────── */
function QuickAdd({ onAdded }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({ title: '', amount: '', category: 'Mess / Food', date: new Date().toISOString().split('T')[0] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter title and amount'); return; }
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense recorded');
      setForm({ title: '', amount: '', category: 'Mess / Food', date: new Date().toISOString().split('T')[0] });
      setOpen(false);
      onAdded?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  if (!open) return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #0F766E, #14B8A6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(20,184,166,0.3)', flexShrink: 0 }}>
      <Plus size={15} strokeWidth={2} /> Add Expense
    </motion.button>
  );

  return (
    <motion.form onSubmit={submit}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ ...glassCard(), padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', width: '100%' }}>
      {[
        { label: 'What?',  k: 'title',  type: 'text',   ph: 'Canteen, transport…', flex: '1 1 140px' },
        { label: '₹',      k: 'amount', type: 'number', ph: '0.00',                flex: '0 0 90px'  },
        { label: 'Date',   k: 'date',   type: 'date',   ph: '',                    flex: '0 0 130px' },
      ].map(f => (
        <div key={f.k} style={{ flex: f.flex, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</p>
          <input autoFocus={f.k === 'title'} type={f.type} placeholder={f.ph} value={form[f.k]}
            onChange={e => set(f.k, e.target.value)}
            style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 13, outline: 'none', cursor: 'text' }} />
        </div>
      ))}
      <div style={{ flex: '0 0 130px', minWidth: 0 }}>
        <p style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</p>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, background: '#1a2540', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 13, outline: 'none' }}>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.emoji} {c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{ height: 34, padding: '0 16px', borderRadius: 6, background: 'linear-gradient(135deg, #0F766E, #14B8A6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}>
          {saving ? <LoadingSpinner size="sm" /> : 'Save'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ height: 34, width: 34, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
    </motion.form>
  );
}

/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user }   = useSelector(s => s.auth);
  const { isMobile, isTablet } = useBreakpoint();

  const [summary,  setSummary]  = useState(null);
  const [trend,    setTrend]    = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [catData,  setCatData]  = useState([]);
  const [insights, setInsights] = useState([]);
  const [budget,   setBudget]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tick,     setTick]     = useState(0);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const [sumR, trendR, txR, insightR, budgetR] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/monthly-trend?months=7'),
        api.get('/analytics/recent-transactions?limit=8'),
        api.get('/insights'),
        api.get(`/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
      ]);
      const s = sumR.data.summary ?? {};
      setSummary(s);
      setTrend(trendR.data.trend ?? []);
      setRecentTx(txR.data.transactions ?? []);
      setInsights((insightR.data.insights ?? []).slice(0, 4));
      setBudget(budgetR.data.budget);
      const catMap = {};
      (txR.data.transactions ?? []).filter(t => t.transactionType === 'expense')
        .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
      setCatData(Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
    } catch (_) {}
    finally { setLoading(false); }
  }, [tick]);

  useEffect(() => { load(); }, [load]);

  const cur  = trend[trend.length - 1] ?? {};
  const prev = trend[trend.length - 2] ?? {};
  const delta = (c, p) => p > 0 ? ((c - p) / p) * 100 : 0;

  const incSpark = trend.slice(-6).map((d, i) => ({ i, v: d.income   ?? 0 }));
  const expSpark = trend.slice(-6).map((d, i) => ({ i, v: d.expenses ?? 0 }));
  const savSpark = trend.slice(-6).map((d, i) => ({ i, v: Math.max(0, (d.income ?? 0) - (d.expenses ?? 0)) }));
  const s = summary;

  /* Responsive grid helpers */
  const gap = isMobile ? 12 : 14;
  // Stat cards: 2-col on mobile, 4-col on desktop
  const statCols = isMobile
    ? 'repeat(2, 1fr)'
    : 'repeat(4, minmax(0, 1fr))';
  // Wide+narrow panels: stack on mobile/tablet, side-by-side on desktop
  const sidePanel = (narrowPx) =>
    isTablet ? '1fr' : `1fr ${narrowPx}px`;
  // Three-column row: stack on tablet
  const threeCol = isTablet
    ? '1fr'
    : '1fr 220px 220px';

  /* Skeleton */
  if (loading) return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap, marginBottom: 20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ ...glassCard(), padding: 16, height: 120 }}>
            <div className="skeleton" style={{ height: 10, width: 70, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 24, width: 100, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 28 }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
              Financial Overview
            </p>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#14B8A6', fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B' }}>
            Welcome back, <span style={{ color: '#94A3B8', fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
          </p>
        </div>
        <QuickAdd onAdded={() => setTick(t => t + 1)} />
      </motion.div>

      {/* Alert banner */}
      {s?.budgetUsedPercentage >= 90 && s.monthlyBudget > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
          <Zap size={14} color={DANGER} />
          <p style={{ fontSize: 12, color: DANGER, flex: 1, minWidth: 160 }}>
            <strong>{s.budgetUsedPercentage}% of budget used</strong> · {formatCurrency(Math.max(0, s.remainingBudget))} remaining
          </p>
          <Link to="/budget" style={{ fontSize: 12, color: DANGER, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            Review <ChevronRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* Row 1 — Stat cards (2-col mobile, 4-col desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap, marginBottom: gap + 4 }}>
        <StatCard i={0} label="Balance"         value={formatCurrency(s?.currentBalance  ?? 0)} icon={Wallet}      iconBg="linear-gradient(135deg,#0F766E,#14B8A6)" sparkData={savSpark} sparkColor={ACCENT}   sub="All-time net" />
        <StatCard i={1} label="Income"           value={formatCurrency(s?.totalIncome     ?? 0)} icon={TrendingUp}  iconBg="linear-gradient(135deg,#15803D,#22C55E)" sparkData={incSpark} sparkColor={SUCCESS}  trend={delta(cur.income   ?? 0, prev.income   ?? 0)} sub="vs last month" />
        <StatCard i={2} label="Expenses"         value={formatCurrency(s?.totalExpenses   ?? 0)} icon={TrendingDown} iconBg="linear-gradient(135deg,#B91C1C,#EF4444)" sparkData={expSpark} sparkColor={DANGER}   trend={delta(cur.expenses ?? 0, prev.expenses ?? 0)} sub="vs last month" />
        <StatCard i={3} label="Savings Rate"     value={s?.totalIncome > 0 ? `${Math.round((s.totalSavings / s.totalIncome) * 100)}%` : '—'} icon={PiggyBank}   iconBg="linear-gradient(135deg,#1D4ED8,#3B82F6)" sparkData={savSpark} sparkColor={INFO}     sub={s?.totalSavings ? `${formatCurrency(s.totalSavings)} saved` : 'No income yet'} />
      </div>

      {/* Row 2 — Chart + Budget + Health
          Desktop: chart | budget | health
          Tablet:  chart | budget (side by side)  then health below
          Mobile:  all stacked
      */}
      {isTablet ? (
        <>
          {/* Chart + Budget side by side on tablet, stacked on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap, marginBottom: gap }}>
            {/* Area chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={glassCard({ padding: 18 })}>
              <SectionHeader title="Income vs Expenses" subtitle={`Last ${trend.length} months`}
                action={<Link to="/analytics" style={{ fontSize: 11, color: ACCENT, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>Analytics <ChevronRight size={11} /></Link>}
              />
              {trend.length < 2 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#64748B', fontSize: 13 }}>
                  Log transactions to see trends
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={trend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gInc2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={SUCCESS} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gExp2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={DANGER} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={DANGER} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                      <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="income"   name="Income"   stroke={SUCCESS} strokeWidth={1.75} fill="url(#gInc2)" dot={false} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke={DANGER}  strokeWidth={1.75} fill="url(#gExp2)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 14, marginTop: 7 }}>
                    {[{ c: SUCCESS, l: 'Income' }, { c: DANGER, l: 'Expenses' }].map(x => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.c }} />
                        <span style={{ fontSize: 11, color: '#64748B' }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Budget ring */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
              style={glassCard({ padding: 18 })}>
              <SectionHeader title="Budget" subtitle="This month"
                action={<Link to="/budget" style={{ fontSize: 11, color: ACCENT }}>Manage</Link>}
              />
              {!budget || !s?.monthlyBudget ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '14px 0' }}>
                  <Target size={28} color="#475569" strokeWidth={1.5} />
                  <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>No budget set</p>
                  <Link to="/budget" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, padding: '5px 12px', borderRadius: 6, background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.2)' }}>Set Budget</Link>
                </div>
              ) : (
                <BudgetRing pct={s.budgetUsedPercentage ?? 0} spent={s.totalExpenses ?? 0} total={s.monthlyBudget} remaining={s.remainingBudget ?? 0} dailyLimit={budget.dailyLimit ?? 0} />
              )}
            </motion.div>
          </div>

          {/* Health score — full width on tablet */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            style={{ ...glassCard({ padding: 18 }), marginBottom: gap }}>
            <SectionHeader title="Health Score" subtitle="Financial fitness" action={<Brain size={14} color="#475569" />} />
            <HealthScore s={s} />
          </motion.div>
        </>
      ) : (
        /* Desktop three-column row */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 220px', gap, marginBottom: gap }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={glassCard({ padding: 20 })}>
            <SectionHeader title="Income vs Expenses" subtitle={`Last ${trend.length} months`}
              action={<Link to="/analytics" style={{ fontSize: 11, color: ACCENT, display: 'flex', alignItems: 'center', gap: 3 }}>Analytics <ChevronRight size={11} /></Link>}
            />
            {trend.length < 2 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#64748B', fontSize: 13 }}>Log transactions to see trends</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gInc2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={SUCCESS} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExp2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={DANGER} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={DANGER} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                    <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="income"   name="Income"   stroke={SUCCESS} strokeWidth={1.75} fill="url(#gInc2)" dot={false} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke={DANGER}  strokeWidth={1.75} fill="url(#gExp2)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {[{ c: SUCCESS, l: 'Income' }, { c: DANGER, l: 'Expenses' }].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.c }} />
                      <span style={{ fontSize: 11, color: '#64748B' }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            style={glassCard({ padding: 20 })}>
            <SectionHeader title="Budget" subtitle="This month" action={<Link to="/budget" style={{ fontSize: 11, color: ACCENT }}>Manage</Link>} />
            {!budget || !s?.monthlyBudget ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <Target size={32} color="#475569" strokeWidth={1.5} />
                <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>No budget set</p>
                <Link to="/budget" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, padding: '6px 14px', borderRadius: 6, background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.2)' }}>Set Budget</Link>
              </div>
            ) : (
              <BudgetRing pct={s.budgetUsedPercentage ?? 0} spent={s.totalExpenses ?? 0} total={s.monthlyBudget} remaining={s.remainingBudget ?? 0} dailyLimit={budget.dailyLimit ?? 0} />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            style={glassCard({ padding: 20 })}>
            <SectionHeader title="Health Score" subtitle="Financial fitness" action={<Brain size={14} color="#475569" />} />
            <HealthScore s={s} />
          </motion.div>
        </div>
      )}

      {/* Row 3 — Transactions + Spending (stack on tablet/mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: sidePanel(300), gap, marginBottom: gap }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          style={glassCard({ padding: isMobile ? 16 : 20 })}>
          <SectionHeader title="Recent Transactions" subtitle={`${recentTx.length} latest`}
            action={<Link to="/transactions" style={{ fontSize: 11, color: ACCENT, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>See all <ChevronRight size={11} /></Link>}
          />
          {recentTx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748B', fontSize: 13 }}>No transactions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTx.map((tx, i) => {
                const isExp = tx.transactionType === 'expense';
                const cfg   = CATEGORY_CONFIG[tx.category] ?? {};
                const color = isExp ? DANGER : SUCCESS;
                return (
                  <motion.div key={tx._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 + i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8, transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExp ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)', flexShrink: 0, fontSize: 13 }}>
                      {isExp ? (cfg.emoji ?? '💸') : '💰'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                      <p style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                        {isExp ? (tx.category ?? 'Expense') : (tx.type ?? 'Income')} · {formatDate(tx.date, 'dd MMM')}
                      </p>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {isExp ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={glassCard({ padding: isMobile ? 16 : 20 })}>
          <SectionHeader title="Spending Categories" subtitle="This month"
            action={<Link to="/analytics" style={{ fontSize: 11, color: ACCENT }}>Details</Link>}
          />
          <SpendingDonut data={catData} />
        </motion.div>
      </div>

      {/* Row 4 — AI Insights + Upcoming (stack on tablet/mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: sidePanel(300), gap }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
          style={glassCard({ padding: isMobile ? 16 : 20 })}>
          <SectionHeader title="AI Insights" subtitle="Smart spending analysis"
            action={
              <Link to="/insights" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.2)', fontSize: 11, color: ACCENT, fontWeight: 600, flexShrink: 0 }}>
                <Sparkles size={11} /> View all
              </Link>
            }
          />
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Brain size={28} color="#475569" strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#64748B' }}>Add more transactions for insights</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.map((ins, i) => <AIInsightCard key={i} insight={ins} delay={0.54 + i * 0.07} />)}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
          style={glassCard({ padding: isMobile ? 16 : 20 })}>
          <SectionHeader title="Upcoming Payments" subtitle="Next 14 days"
            action={<Link to="/recurring-payments" style={{ fontSize: 11, color: ACCENT, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>View all <ChevronRight size={11} /></Link>}
          />
          <UpcomingPayments />
        </motion.div>
      </div>

    </div>
  );
}
