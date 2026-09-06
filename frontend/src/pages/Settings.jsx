import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Camera, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, changePassword, uploadAvatar } from '../store/slices/authSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getInitials, YEAR_OF_STUDY, DEGREE_TYPES } from '../utils/helpers';

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div className="card p-6"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}>
      <h2 className="text-sm font-semibold mb-5"
        style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function Settings() {
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
  });

  const [pw, setPw]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErr, setPwErr] = useState({});

  const setP   = (k, v) => setProfile(f => ({ ...f, [k]: v }));
  const setPwF = (k, v) => { setPw(f => ({ ...f, [k]: v })); setPwErr(e => ({ ...e, [k]: '' })); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.college.trim()) { toast.error('College name required'); return; }
    if (!profile.course.trim())  { toast.error('Course / Degree required'); return; }
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
    if (!pw.currentPassword)                                    err.currentPassword = 'Required';
    if (pw.newPassword.length < 8)                              err.newPassword     = 'Min 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw.newPassword))err.newPassword     = 'Needs uppercase, lowercase & number';
    if (pw.newPassword !== pw.confirmPassword)                  err.confirmPassword = 'Passwords do not match';
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

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--color-text)', letterSpacing: '-0.025em' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Account details and preferences
        </p>
      </div>

      {/* Avatar */}
      <motion.div className="card p-5 flex items-center gap-5"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar"
              className="w-16 h-16 rounded-xl object-cover"
              style={{ border: '2px solid var(--color-accent-border)' }} />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-semibold text-white"
              style={{ background: 'var(--color-accent)', border: '2px solid var(--color-accent-border)' }}>
              {getInitials(user?.name)}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={avLoading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-accent)', border: '2px solid var(--color-card)' }}>
            {avLoading ? <LoadingSpinner size="sm" /> : <Camera size={12} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={handleAvatar} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{user?.name}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</p>
          {user?.college && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>
              {[user.yearOfStudy, user.course, user.college].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </motion.div>

      {/* Academic & personal info */}
      <Section title="Academic Details" delay={0.05}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Full Name</label>
              <input value={profile.name} onChange={e => setP('name', e.target.value)} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="form-label">College / University *</label>
              <input value={profile.college} onChange={e => setP('college', e.target.value)} placeholder="e.g. IIT Bombay" className="input-field" />
            </div>
            <div>
              <label className="form-label">Degree *</label>
              <select value={profile.course} onChange={e => setP('course', e.target.value)} className="input-field">
                <option value="">Select</option>
                {(DEGREE_TYPES ?? ['B.Tech','B.E.','B.Sc','MBA','M.Tech','PhD','Other']).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Branch</label>
              <input value={profile.branch} onChange={e => setP('branch', e.target.value)} placeholder="e.g. CSE, ECE" className="input-field" />
            </div>
            <div>
              <label className="form-label">Year of Study</label>
              <select value={profile.yearOfStudy} onChange={e => setP('yearOfStudy', e.target.value)} className="input-field">
                <option value="">Select</option>
                {(YEAR_OF_STUDY ?? ['1st Year','2nd Year','3rd Year','4th Year','PG 1st Year','PG 2nd Year','PhD']).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Semester</label>
              <select value={profile.semester} onChange={e => setP('semester', e.target.value)} className="input-field">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Roll / Student ID</label>
              <input value={profile.studentId} onChange={e => setP('studentId', e.target.value)} placeholder="e.g. 21CS1001" className="input-field" />
            </div>
            <div>
              <label className="form-label">Graduation Year</label>
              <input type="number" value={profile.graduationYear} onChange={e => setP('graduationYear', e.target.value)} placeholder="e.g. 2027" className="input-field" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input value={profile.phone} onChange={e => setP('phone', e.target.value)} placeholder="10-digit number" className="input-field" />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select value={profile.currency} onChange={e => setP('currency', e.target.value)} className="input-field">
                {['₹','$','€','£','¥'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={pSaving} className="btn-primary flex items-center gap-2">
            {pSaving ? <LoadingSpinner size="sm" /> : <><Save size={14} /> Save Changes</>}
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password" delay={0.1}>
        <form onSubmit={handlePwSave} className="space-y-4">
          {[
            { label: 'Current Password',     k: 'currentPassword',  ph: 'Your current password'         },
            { label: 'New Password',          k: 'newPassword',      ph: 'Min 8 chars, A-Z & number'     },
            { label: 'Confirm New Password',  k: 'confirmPassword',  ph: 'Re-enter new password'         },
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
            {pwSaving ? <LoadingSpinner size="sm" /> : <><Lock size={14} /> Update Password</>}
          </button>
        </form>
      </Section>

      {/* Account info */}
      <Section title="Account Information" delay={0.15}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Account ID',     v: user?._id?.slice(-8).toUpperCase() ?? '—' },
            { l: 'Member Since',   v: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            { l: 'Last Login',     v: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : '—' },
            { l: 'Role',           v: user?.role ?? 'user' },
          ].map(item => (
            <div key={item.l} className="rounded-lg p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.l}</p>
              <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--color-text)' }}>{item.v}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
