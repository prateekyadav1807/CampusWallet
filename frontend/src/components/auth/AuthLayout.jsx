import React from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-center px-14">
        {/* Background */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(145deg, #042f2e 0%, #0f3d38 50%, #0c2a1a 100%)' }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(20,184,166,0.6) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(20,184,166,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #eab308, transparent)' }} />

        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(20,184,166,0.18)', border: '1px solid rgba(20,184,166,0.35)' }}>
              🎓
            </div>
            <div>
              <p className="font-display font-black text-white text-2xl tracking-tight leading-none">
                CampusWallet
              </p>
              <p className="text-teal-400/80 text-xs tracking-widest uppercase mt-0.5">
                Your Student Finance Companion
              </p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-lg font-display font-semibold text-white/90 mb-8 leading-snug"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Built for students who want to<br />
            <span className="text-teal-300">spend smart</span> and{' '}
            <span className="text-yellow-300">stress less</span> about money.
          </motion.p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { emoji: '🍱', title: 'Track Mess & Daily Spends',  desc: 'Log canteen, transport, stationery in seconds' },
              { emoji: '📚', title: 'Manage Semester Fees',       desc: 'Never miss a fee deadline — get reminders' },
              { emoji: '💡', title: 'AI Spending Insights',       desc: 'See where your pocket money actually goes' },
              { emoji: '🤝', title: 'Split Hostel Expenses',      desc: 'Settle roommate bills fairly and instantly' },
              { emoji: '🎯', title: 'Monthly Budget Goals',       desc: 'Stay within budget even in month-end crunch' },
            ].map((f, i) => (
              <motion.div key={i} className="flex items-start gap-3"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {f.emoji}
                </div>
                <div>
                  <p className="font-display font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <span className="text-2xl">🎓</span>
            <span className="font-display font-black text-white text-xl">CampusWallet</span>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
