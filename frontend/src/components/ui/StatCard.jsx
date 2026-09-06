import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, gradient, change, changeLabel, subtitle, delay = 0 }) {
  const isPositive = change >= 0;

  return (
    <motion.div
      className="stat-card glass-shine hover-lift relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-10 rounded-2xl ${gradient}`} />

      <div className="relative z-10">
        {/* Icon + Title */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-white number-animate">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(change)}%
            </div>
            {changeLabel && <span className="text-xs text-slate-500">{changeLabel}</span>}
          </div>
        )}

        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
