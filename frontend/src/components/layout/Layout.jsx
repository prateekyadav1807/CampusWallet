import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { fetchNotifications } from '../../store/slices/notificationSlice';

const SIDEBAR_FULL = 220;
const SIDEBAR_SLIM = 56;

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('cw_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });
  const [isLg, setIsLg] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  const dispatch  = useDispatch();
  const location  = useLocation();

  /* track viewport size for sidebar offset */
  useEffect(() => {
    const h = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, []);

  /* poll notifications */
  useEffect(() => {
    dispatch(fetchNotifications());
    const id = setInterval(() => dispatch(fetchNotifications()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  /* close mobile sidebar on navigation */
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('cw_sidebar_collapsed', String(next)); } catch {}
  };

  const sw = collapsed ? SIDEBAR_SLIM : SIDEBAR_FULL;

  return (
    <div
      className="min-h-screen transition-[padding-left] duration-300 ease-in-out"
      style={{ paddingLeft: isLg ? sw : 0, backgroundColor: 'var(--color-bg)' }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggle}
        fullWidth={SIDEBAR_FULL}
        slimWidth={SIDEBAR_SLIM}
      />

      <div className="flex flex-col min-h-screen">
        {/* Sticky navbar */}
        <div className="sticky top-0 z-30">
          <Navbar
            onMenuOpen={() => setSidebarOpen(true)}
            collapsed={collapsed}
            onToggleCollapse={toggle}
          />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>

        <footer className="px-8 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            CampusWallet &copy; {new Date().getFullYear()}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Student Finance Platform
          </span>
        </footer>
      </div>
    </div>
  );
}
