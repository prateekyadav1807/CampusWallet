import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Camera, Save, Lock, GraduationCap, User, Hash, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, changePassword, uploadAvatar } from '../store/slices/authSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getInitials, YEAR_OF_STUDY, DEGREE_TYPES } from '../utils/helpers';

function Section({ title, icon, children, delay = 0 }) {
  return (
    <motion.div className="card p-6"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}>
      <h2 className="font-display text-base font-semibold mb-5 flex items-center gap-2"
        style={{ color: 'var(--text-primary)' }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const fileRef  = useRef(null);

  const [pSaving,   setPSaving]   = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [avLoading, setAvLoading] = useState(false);

  const [profile, setProfile] = useState({
    name:           user?.name           ?? '',
    college:        user?.college        ?? '',
    course:         user?.course         ?? '',
    branch:         user?.branch         ?? '',
    yearOfStudy:    user?.yearOfStudy    ?? '',
    semester:       user?.semester?.toString() ?? '',
    studentId:      user?.studentId      ?? '',
    graduationYear: user?.graduationYear?.toString() ?? '',
    phone:          user?.phone          ?? '',
    currency:       user?.currency       ?? '₹',
    theme:          user?.theme          ?? 'dark',
  });

  const [pw, setPw]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErr, setPwErr] = useState({});

  const setP   = (k, v) => setProfile(f => ({ ...f, [k]: v }));
  const setPwF = (k, v) => { setPw(f => ({ ...f, [k]: v })); setPwErr(e => ({ ...e, [k]: '' })); };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.college.trim()) { toast.error('College name is required'); return; }
    if (!profile.course.trim())  { toast.error('Course / Degree is required'); return; }
    setPSaving(true);
    await dispatch(updateProfile({
      ...profile,
      semester:       profile.semester       ? parseInt(profile.semester)       : undefined,
      graduationYear: profile.graduationYear ? parseInt(profile.graduationYear) : undefined,
    }));
    setPSaving(false);
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    const err = {};
    if (!pw.currentPassword)                                   err.currentPassword = 'Required';
    if (pw.newPassword.length < 8)                             err.newPassword     = 'Min 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw.newPassword))
                                                               err.newPassword     = 'Needs uppercase, lowercase & number';
    if (pw.newPassword !== pw.confirmPassword)                 err.confirmPassword = 'Passwords do not match';
    if (Object.keys(err).length) { setPwErr(err); return; }
    setPwSaving(true);
    const res = await dispatch(changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }));
    if (changePassword.fulfilled.match(res))
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwSaving(false);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    setAvLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    await dispatch(uploadAvatar(fd));
    setAvLoading(false);
  };

  const InputRow = ({ label, k, type = 'text', placeholder, children }) => (
    <div>
      <label className="form-label">{label}</label>
      {children ?? (
        <input type={type} placeholder={placeholder} value={profile[k]}
          onChange={e => setP(k, e.target.value)} className="input-field" />
      )}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Profile 👤
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Keep your student details up to date
        </p>
      </div>

      {/* ── Avatar card ──────────────────────────────────────── */}
      <motion.div className="card p-5 flex items-center gap-5"
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar"
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: '2px solid rgba(20,184,166,0.4)' }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center
                            justify-center text-2xl font-black text-white"
              style={{ border: '2px solid rgba(20,184,166,0.4)' }}>
              {getInitials(user?.name)}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={avLoading}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center
                       justify-center transition-colors"
            style={{ background: 'var(--teal-700)', border: '2px solid var(--bg-page)' }}>
            {avLoading ? <LoadingSpinner size="sm" /> : <Camera size={13} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={handleAvatar} />
        </div>

        <div>
          <p className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {user?.name}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
          {user?.college && (
            <p className="text-xs mt-1" style={{ color: 'var(--teal-500)' }}>
              🎓 {[user.yearOfStudy, user.course, user.college].filter(Boolean).join(' · ')}
            </p>
          )}
          {user?.studentId && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-label)' }}>
              🪪 Roll No: {user.studentId}
            </p>
          )}
          <span className="badge-teal text-[10px] mt-2 capitalize inline-block">{user?.role}</span>
        </div>
      </motion.div>

      {/* ── Academic info ─────────────────────────────────────── */}
      <Section title="Academic Details" icon="🎓" delay={0.05}>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Full Name</label>
              <input value={profile.name} onChange={e => setP('name', e.target.value)}
                placeholder="Your full name" className="input-field" />
            </div>

            <div className="col-span-2">
              <label className="form-label">
                College / University
                <span style={{ color: 'var(--teal-400)' }} className="ml-0.5">*</span>
              </label>
              <input value={profile.college} onChange={e => setP('college', e.target.value)}
                placeholder="e.g. IIT Bombay, VIT Vellore" className="input-field" />
            </div>

            <div>
              <label className="form-label">
                Degree
                <span style={{ color: 'var(--teal-400)' }} className="ml-0.5">*</span>
              </label>
              <select value={profile.course} onChange={e => setP('course', e.target.value)}
                className="input-field">
                <option value="">Select degree</option>
                {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Branch / Stream</label>
              <input value={profile.branch} onChange={e => setP('branch', e.target.value)}
                placeholder="e.g. CSE, ECE, Finance" className="input-field" />
            </div>

            <div>
              <label className="form-label">Year of Study</label>
              <select value={profile.yearOfStudy} onChange={e => setP('yearOfStudy', e.target.value)}
                className="input-field">
                <option value="">Select year</option>
                {YEAR_OF_STUDY.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Semester</label>
              <select value={profile.semester} onChange={e => setP('semester', e.target.value)}
                className="input-field">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Student / Roll No.</label>
              <input value={profile.studentId} onChange={e => setP('studentId', e.target.value)}
                placeholder="e.g. 21CS1001" className="input-field" />
            </div>

            <div>
              <label className="form-label">Graduation Year</label>
              <input type="number" value={profile.graduationYear}
                onChange={e => setP('graduationYear', e.target.value)}
                placeholder="e.g. 2027" min="2020" max="2040" className="input-field" />
            </div>
          </div>

          {/* Contact + prefs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="form-label">Phone Number</label>
              <input value={profile.phone} onChange={e => setP('phone', e.target.value)}
                placeholder="10-digit mobile" maxLength={10} className="input-field" />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select value={profile.currency} onChange={e => setP('currency', e.target.value)}
                className="input-field">
                {['₹','$','€','£','¥'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Theme</label>
              <select value={profile.theme} onChange={e => setP('theme', e.target.value)}
                className="input-field">
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={pSaving} className="btn-primary flex items-center gap-2">
            {pSaving ? <LoadingSpinner size="sm" /> : <><Save size={15} /> Save Changes</>}
          </button>
        </form>
      </Section>

      {/* ── Change password ───────────────────────────────────── */}
      <Section title="Change Password" icon="🔐" delay={0.1}>
        <form onSubmit={handlePwSave} className="space-y-4">
          {[
            { label: 'Current Password',    k: 'currentPassword',  ph: 'Your current password'           },
            { label: 'New Password',         k: 'newPassword',      ph: 'Min 8 chars, uppercase & number' },
            { label: 'Confirm New Password', k: 'confirmPassword',  ph: 'Re-enter new password'           },
          ].map(f => (
            <div key={f.k}>
              <label className="form-label">{f.label}</label>
              <input type="password" placeholder={f.ph} value={pw[f.k]}
                onChange={e => setPwF(f.k, e.target.value)}
                className={`input-field ${pwErr[f.k] ? 'border-red-500/50' : ''}`} />
              {pwErr[f.k] && <p className="text-xs text-red-400 mt-1">{pwErr[f.k]}</p>}
            </div>
          ))}
          <button type="submit" disabled={pwSaving} className="btn-secondary flex items-center gap-2">
            {pwSaving ? <LoadingSpinner size="sm" /> : <><Lock size={15} /> Update Password</>}
          </button>
        </form>
      </Section>

      {/* ── Account info ─────────────────────────────────────── */}
      <Section title="Account Information" icon="ℹ️" delay={0.15}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Account ID',     value: user?._id?.slice(-8).toUpperCase() ?? '—'           },
            { label: 'Joined',         value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' }) : '—' },
            { label: 'Last Login',     value: user?.lastLogin  ? new Date(user.lastLogin).toLocaleDateString('en-IN') : '—' },
            { label: 'Email Verified', value: user?.isEmailVerified ? '✅ Verified' : '⏳ Pending' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-card)' }}>
              <p className="text-xs" style={{ color: 'var(--text-label)' }}>{item.label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
