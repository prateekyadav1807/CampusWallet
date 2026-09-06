import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import { setTheme } from './store/slices/themeSlice';
import api from './services/api';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Auth
const Login          = lazy(() => import('./pages/auth/Login'));
const Register       = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'));

// App pages
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Transactions       = lazy(() => import('./pages/Transactions'));
const Budget             = lazy(() => import('./pages/Budget'));
const Analytics          = lazy(() => import('./pages/Analytics'));
const Groups             = lazy(() => import('./pages/Groups'));
const Insights           = lazy(() => import('./pages/Insights'));
const RecurringPayments  = lazy(() => import('./pages/RecurringPayments'));
const Settings           = lazy(() => import('./pages/Settings'));
const Reports            = lazy(() => import('./pages/Reports'));
const Help               = lazy(() => import('./pages/Help'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const NotFound       = lazy(() => import('./pages/NotFound'));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(s => s.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
    <LoadingSpinner size="lg" />
  </div>
);

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);
  const { mode }  = useSelector(s => s.theme);

  useEffect(() => {
    dispatch(setTheme('dark'));
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch(getMe());
    }
  }, [token, dispatch]);

  return (
    <div className={mode}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password"element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* App */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="transactions"       element={<Transactions />} />
            <Route path="budget"             element={<Budget />} />
            <Route path="analytics"          element={<Analytics />} />
            <Route path="split-bills"        element={<Groups />} />
            <Route path="insights"           element={<Insights />} />
            <Route path="recurring-payments" element={<RecurringPayments />} />
            <Route path="settings"           element={<Settings />} />
            <Route path="reports"            element={<Reports />} />
            <Route path="help"               element={<Help />} />
            {/* Legacy redirects so old links don't 404 */}
            <Route path="expenses"      element={<Navigate to="/transactions" replace />} />
            <Route path="income"        element={<Navigate to="/transactions" replace />} />
            <Route path="groups"        element={<Navigate to="/split-bills"  replace />} />
            <Route path="subscriptions" element={<Navigate to="/recurring-payments" replace />} />
            <Route path="student-fees"  element={<Navigate to="/recurring-payments" replace />} />
            <Route path="profile"       element={<Navigate to="/settings"     replace />} />
            <Route path="notifications" element={<Navigate to="/dashboard"    replace />} />
            <Route path="reports"       element={<Navigate to="/analytics"    replace />} />
            <Route path="placement"     element={<Navigate to="/dashboard"    replace />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users"     element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}
