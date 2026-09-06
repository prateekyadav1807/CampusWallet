import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginUser } from '../../store/slices/authSlice';
import AuthLayout from '../../components/auth/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector(s => s.auth);

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const res = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(res)) navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle="Sign in to your CampusWallet account"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {/* Email */}
        <div>
          <label className="form-label">College Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-label)' }} />
            <input
              type="email" placeholder="you@college.edu" autoComplete="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              className={`input-field pl-10 ${errors.email ? 'border-red-500/50' : ''}`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label mb-0">Password</label>
            <Link to="/forgot-password"
              className="text-xs transition-colors"
              style={{ color: 'var(--teal-500)' }}
              onMouseEnter={e => e.target.style.color = 'var(--teal-400)'}
              onMouseLeave={e => e.target.style.color = 'var(--teal-500)'}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-label)' }} />
            <input
              type={showPass ? 'text' : 'password'} placeholder="Your password"
              autoComplete="current-password"
              value={form.password} onChange={e => set('password', e.target.value)}
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-label)' }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-primary w-full h-11 font-display font-semibold text-base">
          {loading
            ? <LoadingSpinner size="sm" />
            : <><span>Sign In</span><ArrowRight size={16} /></>
          }
        </button>

        {/* Divider */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
              New student?
            </span>
          </div>
        </div>

        <Link to="/register" className="btn-secondary w-full h-11 font-semibold">
          🎓 Create Student Account
        </Link>

      </form>
    </AuthLayout>
  );
}
