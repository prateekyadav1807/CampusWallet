import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3,
  Users, Lightbulb, RefreshCw, Settings, ShieldCheck, X, LogOut,
  FileText, HelpCircle,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { getInitials } from '../../utils/helpers';

const NAV = [
  { label: 'Dashboard',          path: '/dashboard',          icon: LayoutDashboard },
  { label: 'Transactions',       path: '/transactions',       icon: ArrowLeftRight  },
  { label: 'Budget',             path: '/budget',             icon: PiggyBank       },
  { label: 'Analytics',          path: '/analytics',          icon: BarChart3       },
  { label: 'Split Bills',        path: '/split-bills',        icon: Users           },
  { label: 'AI Insights',        path: '/insights',           icon: Lightbulb       },
  { label: 'Recurring Payments', path: '/recurring-payments', icon: RefreshCw       },
  { label: 'Reports',            path: '/reports',            icon: FileText        },
  { label: 'Settings',           path: '/settings',           icon: Settings        },
  { label: 'Help & Support',     path: '/help',               icon: HelpCircle      },
];

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
      }
    >
      <item.icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onClose }) {
  const dispatch = useDispatch();
  const user     = useSelector(s => s.auth.user);

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div
        className={`flex items-center h-14 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--color-accent)', boxShadow: '0 0 12px rgba(20,184,166,0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z"
              stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <circle cx="7" cy="7" r="2" fill="white"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight leading-none"
              style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              CampusWallet
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Student Finance
            </p>
          </div>
        )}
        <button onClick={onClose} className="btn-icon ml-auto lg:hidden">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}

        {user?.role === 'admin' && (
          <div className="pt-2" style={{ borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
            <NavItem
              item={{ label: 'Admin Panel', path: '/admin/dashboard', icon: ShieldCheck }}
              collapsed={collapsed}
            />
          </div>
        )}
      </nav>

      {/* User */}
      <div className="flex-shrink-0 p-2"
        style={{ borderTop: '1px solid var(--color-border)' }}>
        {collapsed ? (
          <NavLink to="/settings"
            className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center
                       text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-accent)' }}>
            {getInitials(user?.name)}
          </NavLink>
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <NavLink to="/settings" className="flex items-center gap-2.5 flex-1 min-w-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar"
                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center
                               text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: 'var(--color-accent)' }}>
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate leading-tight"
                  style={{ color: 'var(--color-text)' }}>
                  {user?.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {user?.yearOfStudy || user?.college || user?.email}
                </p>
              </div>
            </NavLink>
            <button onClick={() => dispatch(logout())} className="btn-icon flex-shrink-0"
              title="Sign out" style={{ width: 28, height: 28 }}>
              <LogOut size={13} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen, onClose, collapsed, onToggleCollapse,
  fullWidth = 220, slimWidth = 56,
}) {
  return (
    <>
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-[width] duration-300 ease-in-out"
        style={{
          width: collapsed ? slimWidth : fullWidth,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <SidebarContent collapsed={collapsed} onClose={onClose} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full z-50 flex flex-col lg:hidden"
              style={{
                width: fullWidth,
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
              }}
              initial={{ x: -fullWidth }} animate={{ x: 0 }} exit={{ x: -fullWidth }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            >
              <SidebarContent collapsed={false} onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
