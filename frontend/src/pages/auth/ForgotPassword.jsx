import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(res.data.message || 'Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox 📬" subtitle="We've sent you a password reset link">
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Success icon */}
          <div className="w-18 h-18 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)', width: 72, height: 72 }}>
            <CheckCircle size={36} className="text-teal-400" />
          </div>

          <h3 className="font-display text-lg font-bold text-white mb-2">Email Sent!</h3>
          <p className="text-slate-400 text-sm mb-1">Reset link sent to</p>
          <p className="text-teal-400 font-semibold mb-6">{email}</p>

          <div className="rounded-xl p-4 text-left space-y-2 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-slate-400">📌 Check spam if you don't see it</p>
            <p className="text-xs text-slate-400">⏰ Link expires in 1 hour</p>
          </div>

          <button onClick={() => setSent(false)} className="btn-secondary w-full mb-3">
            Try a different email
          </button>
          <Link to="/login"
            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password? 🔐"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="form-label">Email Address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="email" placeholder="you@college.edu" autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full h-11 font-display font-semibold">
          {loading ? <LoadingSpinner size="sm" /> : '📬 Send Reset Link'}
        </button>

        <Link to="/login"
          className="flex items-center justify-center gap-2 text-sm text-slate-400
                     hover:text-white transition-colors mt-2">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
