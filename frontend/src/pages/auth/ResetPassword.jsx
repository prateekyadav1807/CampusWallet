import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { setCredentials } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!password) { toast.error('Password is required'); return false; }
    if (password.length < 8) { toast.error('Minimum 8 characters required'); return false; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      toast.error('Password must contain uppercase, lowercase, and a number');
      return false;
    }
    if (password !== confirm) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.put(`/auth/reset-password/${token}`, { password });
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      setSuccess(true);
      toast.success(res.data.message);
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password reset! 🎉" subtitle="You're being redirected...">
        <motion.div className="text-center py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <p className="text-slate-400 text-sm">Redirecting to dashboard...</p>
          <div className="mt-4 flex justify-center"><LoadingSpinner /></div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password 🔑" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="form-label">New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase & number"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              autoFocus
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="form-label">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`input-field pl-10 ${confirm && password !== confirm ? 'border-rose-500/60' : confirm && password === confirm ? 'border-emerald-500/60' : ''}`}
            />
            {confirm && (
              <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs ${password === confirm ? 'text-emerald-400' : 'text-rose-400'}`}>
                {password === confirm ? '✓' : '✗'}
              </span>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="glass rounded-xl p-3 space-y-1.5">
          {[
            { label: 'At least 8 characters', check: password.length >= 8 },
            { label: 'One uppercase letter (A-Z)', check: /[A-Z]/.test(password) },
            { label: 'One lowercase letter (a-z)', check: /[a-z]/.test(password) },
            { label: 'One number (0-9)', check: /\d/.test(password) },
          ].map((req, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${req.check ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{req.check ? '✓' : '○'}</span> {req.label}
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 h-11">
          {loading ? <LoadingSpinner size="sm" /> : '🔐 Reset Password'}
        </button>

        <Link to="/login" className="flex items-center justify-center text-sm text-slate-400 hover:text-white transition-colors">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}
