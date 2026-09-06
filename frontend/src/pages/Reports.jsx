import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Printer, RefreshCw,
  TrendingUp, TrendingDown, PiggyBank, Target,
  Calendar, ChevronDown, Shield, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import {
  formatCurrency, formatDate,
  CATEGORY_CONFIG, MONTHS, getCurrentMonthYear,
} from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CURR = getCurrentMonthYear();
const ACCENT  = '#14B8A6';
const SUCCESS = '#22C55E';
const DANGER  = '#EF4444';
const INFO    = '#3B82F6';
const WARNING = '#F59E0B';
const PIE_COLORS = ['#14B8A6','#22C55E','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#0EA5E9','#F97316'];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2540', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94A3B8', marginBottom: 5, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1px 0' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Health Score ────────────────────────────────────────────── */
function healthScore(inc, exp, budgetPct) {
  const savRate   = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
  const savScore  = Math.min(100, Math.max(0, savRate * 3));
  const budScore  = Math.max(0, 100 - (budgetPct ?? 0));
  const incScore  = inc > 0 ? 100 : 0;
  const score = Math.round(budScore * 0.35 + savScore * 0.40 + incScore * 0.25);
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention';
  const color = score >= 75 ? SUCCESS : score >= 50 ? WARNING : DANGER;
  return { score, label, color };
}

export default function Reports() {
  const printRef = useRef(null);

  const [period,   setPeriod]   = useState('monthly');
  const [month,    setMonth]    = useState(CURR.month);
  const [year,     setYear]     = useState(CURR.year);
  const [startDate,setStartDate]= useState('');
  const [endDate,  setEndDate]  = useState('');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [generated,setGenerated]= useState(false);

  /* ── Compute date range ─────────────────────────────────── */
  const getRange = () => {
    if (period === 'custom' && startDate && endDate)
      return { s: new Date(startDate), e: new Date(new Date(endDate).setHours(23,59,59)) };
    const now = new Date();
    if (period === 'yearly')  return { s: new Date(year, 0, 1),  e: new Date(year, 11, 31, 23, 59, 59) };
    if (period === 'quarterly'){
      const q = Math.floor((month - 1) / 3);
      return { s: new Date(year, q*3, 1), e: new Date(year, q*3+3, 0, 23, 59, 59) };
    }
    return { s: new Date(year, month-1, 1), e: new Date(year, month, 0, 23, 59, 59) };
  };

  /* ── Generate report data ───────────────────────────────── */
  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const { s, e } = getRange();
      const sm = s.getMonth() + 1, sy = s.getFullYear();
      const em = e.getMonth() + 1, ey = e.getFullYear();

      const [expR, incR, trendR, budR, insightR] = await Promise.all([
        api.get('/expenses', { params: { limit: 100, startDate: s.toISOString(), endDate: e.toISOString(), sortBy: 'amount', sortOrder: 'desc' } }),
        api.get('/income',   { params: { limit: 100, startDate: s.toISOString(), endDate: e.toISOString() } }),
        api.get(`/analytics/monthly-trend?months=6`),
        api.get(`/budgets?month=${sm}&year=${sy}`),
        api.get('/insights'),
      ]);

      const expenses = expR.data.expenses ?? [];
      const incomes  = incR.data.incomes  ?? [];

      const totalExpenses = expenses.reduce((a, x) => a + x.amount, 0);
      const totalIncome   = incomes.reduce((a, x)  => a + x.amount, 0);

      // Category breakdown
      const catMap = {};
      expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const categories = Object.entries(catMap)
        .map(([name, value]) => ({ name, value, pct: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.value - a.value);

      setData({
        period: { start: s, end: e },
        totalIncome, totalExpenses,
        netSavings: totalIncome - totalExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0',
        expenses, incomes, categories,
        topExpenses: expenses.slice(0, 5),
        trend: trendR.data.trend ?? [],
        budget: budR.data.budget,
        insights: (insightR.data.insights ?? []).slice(0, 3),
      });
      setGenerated(true);
    } catch (_) {}
    finally { setLoading(false); }
  }, [period, month, year, startDate, endDate]);

  /* ── Print ──────────────────────────────────────────────── */
  const handlePrint = () => window.print();

  const years = [CURR.year - 1, CURR.year];

  const PERIOD_OPTS = [
    { v: 'monthly',   l: 'Monthly'     },
    { v: 'quarterly', l: 'Quarterly'   },
    { v: 'yearly',    l: 'Yearly'      },
    { v: 'custom',    l: 'Custom Range'},
  ];

  return (
    <>
      {/* ── Print CSS ─── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-report, #print-report * { visibility: visible !important; }
          #print-report { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; }
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
          .print-page-break { page-break-before: always; }
        }
        @media screen {
          #print-report .print-only { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* ── Controls ─────────────────────────────────────── */}
        <div className="no-print">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Reports
            </h1>
            <p style={{ fontSize: 13, color: '#64748B' }}>Generate professional financial reports</p>
          </motion.div>

          {/* Filter bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{
              background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12,
            }}>

            {/* Period */}
            <div>
              <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Period</p>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
                {PERIOD_OPTS.map((o, i) => (
                  <button key={o.v} onClick={() => setPeriod(o.v)}
                    style={{
                      padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      background: period === o.v ? ACCENT : 'transparent',
                      color: period === o.v ? '#000' : '#94A3B8',
                      border: 'none', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {period !== 'custom' && (
              <>
                {period !== 'yearly' && (
                  <div>
                    <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month</p>
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                      style={{ height: 34, padding: '0 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, outline: 'none' }}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Year</p>
                  <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                    style={{ height: 34, padding: '0 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, outline: 'none' }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}

            {period === 'custom' && (
              <>
                {[{ l: 'From', k: 'start', v: startDate, s: setStartDate }, { l: 'To', k: 'end', v: endDate, s: setEndDate }].map(f => (
                  <div key={f.k}>
                    <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.l}</p>
                    <input type="date" value={f.v} onChange={e => f.s(e.target.value)}
                      style={{ height: 34, padding: '0 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, outline: 'none' }} />
                  </div>
                ))}
              </>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={generate} disabled={loading}
                style={{ height: 34, padding: '0 16px', borderRadius: 8, background: 'linear-gradient(135deg, #0F766E, #14B8A6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(20,184,166,0.3)' }}>
                {loading ? <LoadingSpinner size="sm" /> : <><RefreshCw size={13} /> Generate Report</>}
              </motion.button>
              {generated && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={handlePrint}
                  style={{ height: 34, padding: '0 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={13} /> Print / PDF
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Empty state ─────────────────────────────────── */}
        {!generated && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '64px 0', background: 'rgba(21,31,50,0.5)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <FileText size={40} color="#475569" strokeWidth={1.25} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Generate a Report</p>
            <p style={{ fontSize: 13, color: '#64748B' }}>Select a period above and click Generate</p>
          </motion.div>
        )}

        {/* ── REPORT VIEWER ────────────────────────────────── */}
        {generated && data && (
          <motion.div id="print-report" ref={printRef}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}>

            {/* ── REPORT HEADER ─── */}
            <div style={{
              background: 'linear-gradient(135deg, #0B1220 0%, #0F2035 50%, #0B1220 100%)',
              border: '1px solid rgba(20,184,166,0.2)',
              borderRadius: 16, padding: '28px 32px', marginBottom: 16,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.12), transparent)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                        <circle cx="7" cy="7" r="2" fill="white"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>CampusWallet</span>
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>
                    Financial Report
                  </p>
                  <p style={{ fontSize: 13, color: '#64748B' }}>
                    {formatDate(data.period.start, 'dd MMM yyyy')} — {formatDate(data.period.end, 'dd MMM yyyy')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Generated</p>
                  <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '3px 10px', borderRadius: 99, background: `${healthScore(data.totalIncome, data.totalExpenses, data.budget?.usedPercentage).color}18`, border: `1px solid ${healthScore(data.totalIncome, data.totalExpenses, data.budget?.usedPercentage).color}30` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: healthScore(data.totalIncome, data.totalExpenses, data.budget?.usedPercentage).color }}>
                      {healthScore(data.totalIncome, data.totalExpenses, data.budget?.usedPercentage).label} Financial Health
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SUMMARY CARDS ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { l: 'Total Income',  v: formatCurrency(data.totalIncome),   c: SUCCESS, Icon: TrendingUp },
                { l: 'Total Expenses',v: formatCurrency(data.totalExpenses),  c: DANGER,  Icon: TrendingDown },
                { l: 'Net Savings',   v: formatCurrency(data.netSavings),     c: data.netSavings >= 0 ? INFO : WARNING, Icon: PiggyBank },
                { l: 'Savings Rate',  v: `${data.savingsRate}%`,              c: ACCENT,  Icon: Target },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                  style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{s.l}</p>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${s.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.Icon size={13} color={s.c} strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: s.c, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{s.v}</p>
                </motion.div>
              ))}
            </div>

            {/* ── CHARTS ROW ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 16 }}>

              {/* Trend chart */}
              <div style={{ padding: 20, borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Income vs Expenses — Trend</p>
                <p style={{ fontSize: 11, color: '#64748B', marginBottom: 16 }}>Last 6 months</p>
                {data.trend.length < 2 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13 }}>No trend data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data.trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={SUCCESS} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={DANGER} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={DANGER} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="income"   name="Income"   stroke={SUCCESS} strokeWidth={1.75} fill="url(#rInc)" dot={false} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke={DANGER}  strokeWidth={1.75} fill="url(#rExp)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Spending Pie */}
              <div style={{ padding: 20, borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Spending Breakdown</p>
                <p style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>By category</p>
                {data.categories.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13 }}>No spending data</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={data.categories} cx="50%" cy="50%" innerRadius={36} outerRadius={60}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {data.categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={({ active: a, payload: p }) => {
                          if (!a || !p?.length) return null;
                          return <div style={{ background: '#1a2540', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                            <p style={{ color: '#fff', fontWeight: 600 }}>{p[0].name}</p>
                            <p style={{ color: p[0].payload.fill }}>{formatCurrency(p[0].value)} · {p[0].payload.pct}%</p>
                          </div>;
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {data.categories.slice(0, 4).map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 10, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── BUDGET UTILIZATION ─── */}
            {data.budget && (
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Budget Utilization</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Spent {formatCurrency(data.budget.totalSpent)} of {formatCurrency(data.budget.totalBudget)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: data.budget.usedPercentage >= 100 ? DANGER : data.budget.usedPercentage >= 80 ? WARNING : ACCENT }}>
                        {data.budget.usedPercentage}%
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: data.budget.usedPercentage >= 100 ? DANGER : data.budget.usedPercentage >= 80 ? WARNING : ACCENT, width: `${Math.min(100, data.budget.usedPercentage)}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    {[
                      { l: 'Remaining', v: formatCurrency(Math.max(0, data.budget.remaining ?? 0)), c: ACCENT },
                      { l: 'Daily Limit', v: formatCurrency(data.budget.dailyLimit ?? 0), c: INFO },
                    ].map(s => (
                      <div key={s.l} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{s.l}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TOP EXPENSES + INCOME ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { title: 'Top Expenses', items: data.topExpenses, color: DANGER, getKey: e => e.category ?? 'Expense', getEmoji: e => CATEGORY_CONFIG[e.category]?.emoji ?? '💸' },
                { title: 'Income Sources', items: data.incomes.slice(0,5), color: SUCCESS, getKey: i => i.type ?? 'Income', getEmoji: () => '💰' },
              ].map(section => (
                <div key={section.title} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>{section.title}</p>
                  {section.items.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', padding: '16px 0' }}>No data</p>
                  ) : section.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: 14 }}>{section.getEmoji(item)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <p style={{ fontSize: 10, color: '#64748B' }}>{section.getKey(item)} · {formatDate(item.date, 'dd MMM')}</p>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: section.color, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* ── AI INSIGHTS SUMMARY ─── */}
            {data.insights.length > 0 && (
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20,184,166,0.15)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Sparkles size={14} color={ACCENT} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Insights Summary</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.insights.map((ins, i) => {
                    const colors = { success: SUCCESS, warning: WARNING, danger: DANGER, info: ACCENT };
                    const c = colors[ins.type] ?? ACCENT;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: `${c}0d`, border: `1px solid ${c}22` }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{ins.emoji}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{ins.title}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>{ins.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── HEALTH SCORE ─── */}
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(21,31,50,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
              {(() => {
                const hs = healthScore(data.totalIncome, data.totalExpenses, data.budget?.usedPercentage);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Shield size={20} color={hs.color} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Financial Health Score: {hs.score}/100</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>Status: <span style={{ color: hs.color, fontWeight: 600 }}>{hs.label}</span></p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${hs.score}%`, background: hs.color, borderRadius: 99 }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: hs.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{hs.score}</p>
                  </div>
                );
              })()}
            </div>

            {/* ── PRINT FOOTER ─── */}
            <div className="print-only" style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748B' }}>CampusWallet — Student Finance Platform</p>
              <p style={{ fontSize: 11, color: '#64748B' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* ── Action bar (screen only) ─── */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handlePrint}
                style={{ height: 36, padding: '0 18px', borderRadius: 8, background: 'linear-gradient(135deg, #0F766E, #14B8A6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(20,184,166,0.3)' }}>
                <Printer size={14} /> Print Report
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handlePrint}
                style={{ height: 36, padding: '0 18px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Download PDF
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
