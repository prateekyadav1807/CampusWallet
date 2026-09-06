import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User, BookOpen, School, Hash, Calendar, GitBranch } from 'lucide-react';
import { registerUser } from '../../store/slices/authSlice';
import AuthLayout from '../../components/auth/AuthLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { YEAR_OF_STUDY, DEGREE_TYPES } from '../../utils/helpers';

const STEPS = ['Account', 'Academic', 'Done'];

/* ── Field must live OUTSIDE Register so it keeps a stable reference
      across re-renders — otherwise React remounts the input on every
      keystroke and focus is lost. ─────────────────────────────────── */
function Field({ label, k, type = 'text', icon: Icon, placeholder, required, errors, form, set, children }) {
  return (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-teal-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-label)' }}
          />
        )}
        {children ?? (
          <input
            type={type}
            placeholder={placeholder}
            value={form[k]}
            onChange={e => set(k, e.target.value)}
            className={`input-field ${Icon ? 'pl-10' : ''} ${errors[k] ? 'border-red-500/60' : ''}`}
          />
        )}
      </div>
      {errors[k] && <p className="text-xs text-red-400 mt-1">{errors[k]}</p>}
    </div>
  );
}

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.auth);

  const [step,     setStep]     = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    college: '', course: '', branch: '',
    yearOfStudy: '', semester: '', studentId: '',
    graduationYear: '',
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  /* ── Password strength ─────────────────────────────────── */
  const strength = (() => {
    if (!form.password) return null;
    const checks = [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /[a-z]/.test(form.password),
      /\d/.test(form.password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#14b8a6'];
    return { score, label: labels[score], color: colors[score] };
  })();

  /* ── Validation ────────────────────────────────────────── */
  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim())    e.name     = 'Full name is required';
    if (!form.email)          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)       e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must include uppercase, lowercase & number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.college.trim()) e.college = 'College / University is required';
    if (!form.course.trim())  e.course  = 'Course / Degree is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    const payload = {
      ...form,
      semester:       form.semester       ? parseInt(form.semester)       : undefined,
      graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
    };
    const res = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(res)) navigate('/dashboard', { replace: true });
  };

  /* Shared props for every Field */
  const fieldProps = { form, errors, set };

  return (
    <AuthLayout title="Join CampusWallet 🎓" subtitle="Your student finance companion — free forever">

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: i <= step ? 'var(--teal-600)' : 'var(--bg-hover)',
                  color:      i <= step ? '#fff' : 'var(--text-muted)',
                  border:     `1px solid ${i <= step ? 'var(--teal-500)' : 'var(--border-input)'}`,
                }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block"
                style={{ color: i === step ? 'var(--teal-400)' : 'var(--text-muted)' }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px"
                style={{ background: i < step ? 'var(--teal-600)' : 'var(--border-input)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0 — Account ──────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Full Name" k="name" icon={User} placeholder="Rahul Sharma" required {...fieldProps} />
          <Field label="Email Address" k="email" type="email" icon={Mail} placeholder="rahul@college.edu" required {...fieldProps} />

          {/* Password (custom — needs show/hide toggle) */}
          <div>
            <label className="form-label">
              Password<span className="text-teal-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-label)' }}
              />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars, uppercase & number"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-label)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div className="mt-1.5">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= strength.score ? strength.color : 'var(--border-input)' }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label} password</p>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
          </div>

          <button type="button" onClick={nextStep} className="btn-primary w-full h-11">
            Continue →
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs"
                style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                Already have an account?
              </span>
            </div>
          </div>
          <Link to="/login" className="btn-secondary w-full h-11">Sign In</Link>
        </div>
      )}

      {/* ── Step 1 — Academic details ──────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            These details personalise your experience. College and course are required.
          </p>

          <Field label="College / University" k="college" icon={School}
            placeholder="e.g. IIT Bombay, VIT Vellore" required {...fieldProps} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">
                Degree<span className="text-teal-400 ml-0.5">*</span>
              </label>
              <select value={form.course} onChange={e => set('course', e.target.value)}
                className={`input-field ${errors.course ? 'border-red-500/60' : ''}`}>
                <option value="">Select degree</option>
                {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.course && <p className="text-xs text-red-400 mt-1">{errors.course}</p>}
            </div>
            <Field label="Branch / Stream" k="branch" icon={GitBranch}
              placeholder="e.g. CSE, ECE, MBA" {...fieldProps} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Year of Study</label>
              <select value={form.yearOfStudy} onChange={e => set('yearOfStudy', e.target.value)}
                className="input-field">
                <option value="">Select year</option>
                {YEAR_OF_STUDY.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Semester</label>
              <select value={form.semester} onChange={e => set('semester', e.target.value)}
                className="input-field">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Student / Roll No." k="studentId" icon={Hash}
              placeholder="e.g. 21CS1001" {...fieldProps} />
            <Field label="Graduation Year" k="graduationYear" icon={Calendar}
              placeholder="e.g. 2027" {...fieldProps} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1 h-11">
              ← Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 h-11">
              {loading ? <LoadingSpinner size="sm" /> : '🎓 Create Account'}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
