import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Search, LogOut, User, Shield,
  ChevronLeft, ChevronRight, ChevronDown,
  CheckCheck, Settings,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markAllRead } from '../../store/slices/notificationSlice';
import { getInitials, formatRelative } from '../../utils/helpers';

/* ── Route title map ──────────────────────────────────────────────────────── */
const ROUTE_TITLES = {
  '/dashboard':          ['Dashboard',          () => new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })],
  '/transactions':       ['Transactions',       () => 'Income & expenses in one view'],
  '/budget':             ['Budget',             () => 'Monthly spending limits'],
  '/analytics':          ['Analytics',          () => 'Trends, patterns & insights'],
  '/split-bills':        ['Split Bills',        () => 'Group expense management'],
  '/insights':           ['AI Insights',        () => 'Smart spending analysis'],
  '/recurring-payments': ['Recurring Payments', () => 'Fees, subscriptions & bills'],
  '/reports':            ['Reports',            () => 'Professional financial reports'],
  '/settings':           ['Settings',           () => 'Account & preferences'],
  '/help':               ['Help & Support',     () => 'FAQs, contact and guides'],
  '/admin/dashboard':    ['Admin',              () => 'Platform management'],
};

const NOTIF_ICON_COLOR = {
  budget_exceeded: 'var(--color-danger)',
  budget_alert:    'var(--color-warning)',
  subscription_renewal: 'var(--color-info)',
  fee_due:         'var(--color-warning)',
  monthly_summary: 'var(--color-accent)',
  insight:         'var(--color-accent)',
  system:          'var(--color-text-muted)',
  settlement:      'var(--color-success)',
};

/* ── Dropdown wrapper ─────────────────────────────────────────────────────── */
const DROP_ANIM = {
  initial: { opacity: 0, y: 4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: 4, scale: 0.98 },
  transition: { duration: 0.13, ease: 'easeOut' },
};

const DropdownPanel = ({ className = '', style = {}, children }) => (
  <motion.div
    {...DROP_ANIM}
    className={`absolute right-0 top-11 rounded-xl overflow-hidden z-50 ${className}`}
    style={{
      background: 'var(--color-elevated)',
      border: '1px solid var(--color-border-strong)',
      boxShadow: 'var(--shadow-dropdown)',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

export default function Navbar({ onMenuOpen, collapsed, onToggleCollapse }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector(s => s.auth);
  const { items: notifications, unreadCount } = useSelector(s => s.notifications);

  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState('');

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const searchRef  = useRef(null);

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Cmd/Ctrl+K to open search */
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* page title */
  const routeKey   = Object.keys(ROUTE_TITLES).find(k => location.pathname.startsWith(k)) ?? '/dashboard';
  const [title, subtitle] = ROUTE_TITLES[routeKey] ?? ['CampusWallet', () => ''];

  const openNotif = () => {
    setShowNotif(v => !v);
    setShowProfile(false);
    if (!showNotif) dispatch(fetchNotifications());
  };

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 sm:px-6"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Mobile menu */}
      <button onClick={onMenuOpen} className="btn-icon lg:hidden">
        <Menu size={18} />
      </button>

      {/* Collapse toggle desktop */}
      <button
        onClick={onToggleCollapse}
        className="btn-icon hidden lg:flex"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <h2 className="text-sm font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        {typeof subtitle === 'function' && (
          <p className="text-[11px] leading-none mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle()}
          </p>
        )}
      </div>

      <div className="flex-1" />

      {/* ── Right side ────────────────────────────────── */}
      <div className="flex items-center gap-1">

        {/* Search */}
        <div className="relative hidden md:block">
          {searchOpen ? (
            <motion.div
              initial={{ width: 140, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              className="relative"
            >
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-muted)' }} />
              <input
                ref={searchRef}
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onBlur={() => { if (!searchVal) { setSearchOpen(false); } }}
                placeholder="Search transactions…"
                className="input-field pl-7 text-xs"
                style={{ height: 32, fontSize: '12px' }}
              />
            </motion.div>
          ) : (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
              className="btn-icon"
              title="Search (⌘K)"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={openNotif} className="btn-icon relative">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 w-2 h-2 rounded-full border-2 animate-pulse-dot"
                style={{
                  background: 'var(--color-danger)',
                  borderColor: 'var(--color-surface)',
                }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <DropdownPanel style={{ width: 340 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="badge-danger text-[10px]">{unreadCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => dispatch(markAllRead())}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <CheckCheck size={12} /> Mark read
                      </button>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setShowNotif(false)}
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      View all
                    </Link>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell size={24} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        All caught up
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 7).map(n => (
                      <div
                        key={n._id}
                        className="px-4 py-3 flex gap-3 cursor-default transition-colors"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: !n.isRead ? 'rgba(20,184,166,0.03)' : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(20,184,166,0.03)' : 'transparent'}
                      >
                        {/* Status dot */}
                        <div className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: !n.isRead ? NOTIF_ICON_COLOR[n.type] ?? 'var(--color-accent)' : 'transparent' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-snug"
                            style={{ color: !n.isRead ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                            {n.title}
                          </p>
                          <p className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                            style={{ color: 'var(--color-text-muted)' }}>
                            {n.message}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownPanel>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-strong)' }} />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-[11px] font-semibold text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                {getInitials(user?.name)}
              </div>
            )}
            <span className="text-[13px] font-medium hidden sm:block max-w-[80px] truncate"
              style={{ color: 'var(--color-text)' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <DropdownPanel style={{ width: 220 }}>
                {/* User info */}
                <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {user?.name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {user?.email}
                  </p>
                  {user?.college && (
                    <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--color-text-faint)' }}>
                      {user.yearOfStudy ? `${user.yearOfStudy} · ` : ''}{user.college}
                    </p>
                  )}
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <ProfileItem to="/settings" icon={User} label="Settings"
                    onClick={() => setShowProfile(false)} />
                  {user?.role === 'admin' && (
                    <ProfileItem to="/admin/dashboard" icon={Shield} label="Admin Panel"
                      onClick={() => setShowProfile(false)}
                      color="var(--color-warning)" />
                  )}
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                  <button
                    onClick={() => { dispatch(logout()); navigate('/login'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm
                               transition-colors text-left"
                    style={{ color: 'var(--color-danger)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-danger-muted)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} strokeWidth={1.75} /> Sign out
                  </button>
                </div>
              </DropdownPanel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function ProfileItem({ to, icon: Icon, label, onClick, color }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
      style={{ color: color ?? 'var(--color-text-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
