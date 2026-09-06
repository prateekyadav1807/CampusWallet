import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

/* ── Card visual config per insight type ───────────────────── */
const TYPE_CFG = {
  success: {
    Icon: CheckCircle,
    bg:     'rgba(20,184,166,0.08)',
    border: 'rgba(20,184,166,0.2)',
    icon:   'text-teal-400',
    badge:  'bg-teal-500/15 text-teal-300',
  },
  warning: {
    Icon: AlertTriangle,
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    icon:   'text-amber-400',
    badge:  'bg-amber-500/15 text-amber-300',
  },
  danger: {
    Icon: AlertTriangle,
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    icon:   'text-red-400',
    badge:  'bg-red-500/15 text-red-300',
  },
  info: {
    Icon: Info,
    bg:     'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.2)',
    icon:   'text-sky-400',
    badge:  'bg-sky-500/15 text-sky-300',
  },
};

const PRIORITY_LABEL = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

/* ── Single insight card ───────────────────────────────────── */
function InsightCard({ insight, delay }) {
  const cfg = TYPE_CFG[insight.type] ?? TYPE_CFG.info;
  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-start gap-4">
        {/* Emoji */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
          {insight.emoji}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-display text-sm font-semibold text-white">{insight.title}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {PRIORITY_LABEL[insight.priority] ?? insight.priority}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function Insights() {
  const [insights,   setInsights]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/insights');
      setInsights(res.data.insights ?? []);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchInsights(); }, []);

  const high   = insights.filter(i => i.priority === 'high');
  const others = insights.filter(i => i.priority !== 'high');

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">AI Insights 🤖</h1>
          <p className="text-sm text-slate-400 mt-0.5">Smart spending analysis based on your financial data</p>
        </div>
        <button onClick={() => fetchInsights(true)} disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Insights',    value: insights.length,                                 emoji: '💡' },
          { label: 'Action Required',   value: high.length,                                     emoji: '🚨' },
          { label: 'Opportunities',     value: insights.filter(i => i.type === 'info').length,  emoji: '✨' },
        ].map((s, i) => (
          <motion.div key={i} className="card p-4 text-center"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className="font-display text-xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : insights.length === 0 ? (
        <EmptyState emoji="🤖" title="No insights yet"
          description="Add more transactions to receive personalised AI spending insights" />
      ) : (
        <div className="space-y-4">
          {/* High priority */}
          {high.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Requires Attention</p>
              </div>
              <div className="space-y-3">
                {high.map((ins, i) => <InsightCard key={i} insight={ins} delay={i * 0.07} />)}
              </div>
            </div>
          )}

          {/* Others */}
          {others.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-teal-400" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">All Insights</p>
              </div>
              <div className="space-y-3">
                {others.map((ins, i) => (
                  <InsightCard key={i} insight={ins} delay={high.length * 0.07 + i * 0.06} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
