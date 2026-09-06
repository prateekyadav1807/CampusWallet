import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Activity, UserCheck, UserX } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const STAT_CARDS = (s) => [
  {
    title: 'Total Users',      value: s.totalUsers ?? 0,
    sub:  `${s.newUsersThisMonth ?? 0} new this month`,
    icon: Users,    from: '#0f766e', to: '#0d9488',
  },
  {
    title: 'Active Users',     value: s.activeUsers ?? 0,
    sub:  `${s.inactiveUsers ?? 0} inactive`,
    icon: UserCheck, from: '#047857', to: '#059669',
  },
  {
    title: 'Platform Expenses', value: formatCurrency(s.totalExpenses ?? 0),
    sub:  `${s.totalExpenseCount ?? 0} transactions`,
    icon: TrendingDown, from: '#c2410c', to: '#ea580c',
  },
  {
    title: 'Platform Income',  value: formatCurrency(s.totalIncome ?? 0),
    sub:  `${s.totalIncomeCount ?? 0} entries`,
    icon: TrendingUp, from: '#047857', to: '#059669',
  },
  {
    title: 'Total Transactions', value: (s.totalTransactions ?? 0).toLocaleString(),
    sub:  'All time',
    icon: Activity,  from: '#b45309', to: '#d97706',
  },
  {
    title: 'New This Month',   value: s.newUsersThisMonth ?? 0,
    sub:  'Registrations',
    icon: UserX,     from: '#0e7490', to: '#0891b2',
  },
];

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/user-trend'),
        ]);
        setStats(sRes.data.stats);
        setTrend(
          (tRes.data.trend ?? []).map(t => ({
            month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t._id.month - 1]} ${t._id.year}`,
            users: t.count,
          }))
        );
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  const cards = stats ? STAT_CARDS(stats) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard 🛡️</h1>
          <p className="text-sm text-slate-400 mt-0.5">Platform overview and user management</p>
        </div>
        <Link to="/admin/users" className="btn-primary flex items-center gap-2">
          <Users size={15} /> Manage Users
        </Link>
      </div>

      {/* Warning banner */}
      <motion.div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="text-xl">🛡️</span>
        <p className="text-sm text-amber-300">Admin mode — all actions affect real user data.</p>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} className="card p-5 relative overflow-hidden"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            {/* glow blob */}
            <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
            <div className="relative z-10">
              <div className="p-2.5 rounded-xl mb-3 w-fit"
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 14px ${c.from}55` }}>
                <c.icon size={16} className="text-white" />
              </div>
              <p className="font-display text-2xl font-black text-white">{c.value}</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">{c.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* User registration bar chart */}
        <motion.div className="card p-5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <h3 className="font-display font-semibold text-white mb-0.5">User Registrations</h3>
          <p className="text-xs text-slate-400 mb-4">Monthly new signups</p>
          {trend.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={trend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="users" name="New Users" fill="#14b8a6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Platform health */}
        <motion.div className="card p-5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-display font-semibold text-white mb-4">Platform Health</h3>
          <div className="space-y-4">

            {/* Activation rate */}
            {[
              {
                label: 'User Activation Rate',
                pct: stats?.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0,
                color: '#14b8a6',
              },
              {
                label: 'Avg Transactions / User',
                pct: Math.min(100, stats?.totalUsers > 0 ? Math.round(stats.totalTransactions / stats.totalUsers) : 0),
                color: '#f97316',
              },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">{m.label}</span>
                  <span className="text-white font-bold">{m.pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.15 }} />
                </div>
              </div>
            ))}

            <div className="divider" />

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '💰', label: 'Avg Income/User',  value: formatCurrency(stats?.totalUsers > 0 ? (stats.totalIncome / stats.totalUsers) : 0) },
                { emoji: '💸', label: 'Avg Expense/User', value: formatCurrency(stats?.totalUsers > 0 ? (stats.totalExpenses / stats.totalUsers) : 0) },
                { emoji: '✅', label: 'Active Users',     value: stats?.activeUsers  ?? 0 },
                { emoji: '🚫', label: 'Inactive Users',   value: stats?.inactiveUsers ?? 0 },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-base mb-0.5">{s.emoji}</p>
                  <p className="font-display text-sm font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
