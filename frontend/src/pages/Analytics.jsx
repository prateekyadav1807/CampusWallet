import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import {
  formatCurrency, CATEGORY_CONFIG,
  MONTHS, getCurrentMonthYear,
} from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

const CURR = getCurrentMonthYear();

/* Palette — strictly semantic, no neon */
const PIE_COLORS = [
  '#14B8A6','#3B82F6','#22C55E','#F59E0B','#EF4444',
  '#8B5CF6','#EC4899','#0EA5E9','#10B981','#6366F1',
];

/* ── Shared tooltip ──────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <p className="font-medium mb-1.5" style={{ color: 'var(--color-text)', fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={{ fontSize: 11, padding: '1px 0' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="tooltip">
      <p className="font-semibold" style={{ color: 'var(--color-text)', fontSize: 11 }}>{d.name}</p>
      <p style={{ color: 'var(--color-accent)', fontSize: 11, fontWeight: 600 }}>{formatCurrency(d.value)}</p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{d.payload?.pct}% of total</p>
    </div>
  );
}

/* ── Section card wrapper ────────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children, action, delay = 0, className = '' }) {
  return (
    <motion.div
      className={`card p-5 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

/* ── Shared axis props ───────────────────────────────────────────────────── */
const axisProps = {
  tick:      { fill: 'var(--color-text-muted)', fontSize: 11 },
  axisLine:  false,
  tickLine:  false,
};
const gridProps = {
  strokeDasharray: '0',
  stroke:   'var(--color-border)',
  vertical: false,
};

/* ── Period → months map ─────────────────────────────────────────────────── */
const PERIOD_MONTHS = { Monthly: 6, Quarterly: 12, Yearly: 24 };
const TABS = ['Monthly', 'Quarterly', 'Yearly'];

export default function Analytics() {
  const [tab,      setTab]      = useState('Monthly');
  const [selMonth, setSelMonth] = useState(CURR.month);
  const [selYear,  setSelYear]  = useState(CURR.year);
  const [loading,  setLoading]  = useState(true);
  const [data,     setData]     = useState({ trend: [], cat: [], savings: [], budget: null });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const months = PERIOD_MONTHS[tab] ?? 6;
        const [tR, cR, sR, bR] = await Promise.all([
          api.get(`/analytics/monthly-trend?months=${months}`),
          api.get(`/analytics/category-breakdown?month=${selMonth}&year=${selYear}`),
          api.get(`/analytics/savings?months=${months}`),
          api.get(`/budgets?month=${selMonth}&year=${selYear}`),
        ]);
        setData({
          trend:   tR.data.trend   ?? [],
          cat:     (cR.data.breakdown ?? []).map((d, i) => ({ ...d, pct: d.percentage })),
          savings: sR.data.savings  ?? [],
          budget:  bR.data.budget,
        });
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, [tab, selMonth, selYear]);

  /* Summary metrics */
  const totInc = data.trend.reduce((s, d) => s + (d.income   ?? 0), 0);
  const totExp = data.trend.reduce((s, d) => s + (d.expenses ?? 0), 0);
  const netSav = totInc - totExp;
  const savRate = totInc > 0 ? ((netSav / totInc) * 100).toFixed(1) : '0';
  const budPct  = data.budget?.usedPercentage ?? 0;

  const SummaryChip = ({ label, value, color }) => (
    <div className="card p-4">
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-xl font-semibold mt-1 tabular-nums tracking-fin"
        style={{ color, letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-screen-xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.025em' }}>
            Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Trends, patterns and insights
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period tabs */}
          <div className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border-strong)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: tab === t ? 'var(--color-text)' : 'var(--color-text-muted)',
                  borderRight: t !== 'Yearly' ? '1px solid var(--color-border)' : 'none',
                }}>
                {t}
              </button>
            ))}
          </div>
          <select value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}
            className="input-field" style={{ width: 120, height: 32, fontSize: 12 }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}
            className="input-field" style={{ width: 80, height: 32, fontSize: 12 }}>
            {[CURR.year - 1, CURR.year].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Summary chips ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryChip label="Total Income"   value={formatCurrency(totInc)} color="var(--color-success)" />
        <SummaryChip label="Total Expenses" value={formatCurrency(totExp)} color="var(--color-danger)"  />
        <SummaryChip label="Net Savings"    value={formatCurrency(netSav)} color={netSav >= 0 ? 'var(--color-info)' : 'var(--color-warning)'} />
        <SummaryChip label="Savings Rate"   value={`${savRate}%`}                color="var(--color-accent)"  />
      </div>

      {/* ── Row 1: Bar trend + Pie ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Income vs Expense bars */}
        <ChartCard
          title="Income vs Expenses"
          subtitle={`${PERIOD_MONTHS[tab]} months`}
          delay={0.06}
          className="lg:col-span-2"
        >
          {data.trend.length < 2 ? (
            <EmptyState emoji="📊" title="Not enough data" description="Log a few months of transactions" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={9} barGap={3}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="income"   name="Income"   fill="#22C55E" radius={[3,3,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[{ color: '#22C55E', label: 'Income' }, { color: '#EF4444', label: 'Expenses' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Pie */}
        <ChartCard title="Spending Categories" subtitle={`${MONTHS[selMonth - 1]} ${selYear}`} delay={0.1}>
          {data.cat.length === 0 ? (
            <EmptyState emoji="🍕" title="No data" description="Add expenses to see breakdown" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={data.cat.map(d => ({ name: d.category, value: d.total, pct: d.pct }))}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    paddingAngle={2} dataKey="value" strokeWidth={0}
                  >
                    {data.cat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {data.cat.slice(0, 5).map((d, i) => {
                  const cfg = CATEGORY_CONFIG[d.category] ?? {};
                  return (
                    <div key={d.category} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {cfg.emoji} {d.category}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{d.pct}%</span>
                      <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>
                        {formatCurrency(d.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Savings + Budget ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Savings Growth */}
        <ChartCard
          title="Savings Growth"
          subtitle="Monthly & cumulative"
          delay={0.14}
        >
          {data.savings.length < 2 ? (
            <EmptyState emoji="💰" title="No data yet" description="Log income & expenses to track savings" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.savings} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#14B8A6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--color-border-strong)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="savings"    name="Monthly"    stroke="#14B8A6" strokeWidth={1.5} fill="url(#gSav)" dot={false} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#3B82F6" strokeWidth={1.5} fill="url(#gCum)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Budget utilization */}
        <ChartCard title="Budget Utilization" subtitle={`${MONTHS[selMonth - 1]} ${selYear}`} delay={0.18}>
          {!data.budget ? (
            <EmptyState emoji="🎯" title="No budget set" description="Set a monthly budget to track utilisation" />
          ) : (
            <div className="space-y-5">
              {/* Big number */}
              <div className="text-center py-2">
                <p
                  className="text-4xl font-semibold tabular-nums tracking-fin"
                  style={{
                    color: budPct >= 100 ? 'var(--color-danger)'
                      : budPct >= 80 ? 'var(--color-warning)'
                      : 'var(--color-accent)',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {budPct}%
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {formatCurrency(data.budget.totalSpent)} of {formatCurrency(data.budget.totalBudget)}
                </p>
              </div>

              {/* Progress */}
              <div className="progress-bar" style={{ height: 6 }}>
                <motion.div
                  className="progress-fill"
                  style={{
                    background: budPct >= 100 ? 'var(--color-danger)'
                      : budPct >= 80 ? 'var(--color-warning)'
                      : 'var(--color-accent)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, budPct)}%` }}
                  transition={{ duration: 1, ease: [0.16,1,0.3,1] }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Remaining',   value: formatCurrency(Math.max(0, data.budget.remaining ?? 0)), color: data.budget.remaining < 0 ? 'var(--color-danger)' : 'var(--color-success)' },
                  { label: 'Daily limit', value: data.budget.dailyLimit > 0 ? formatCurrency(data.budget.dailyLimit) : '—', color: 'var(--color-accent)' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Combined line chart */}
        <ChartCard
          title="Income, Expenses & Savings"
          subtitle="Combined view"
          delay={0.22}
          className="lg:col-span-2"
        >
          {data.trend.length < 2 ? (
            <EmptyState emoji="📉" title="No data" description="Log transactions to see combined view" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--color-border-strong)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="income"   name="Income"   stroke="#22C55E" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="savings"  name="Savings"  stroke="#14B8A6" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
