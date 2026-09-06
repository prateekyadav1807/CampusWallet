import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { formatRelative } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { fetchNotifications } from '../store/slices/notificationSlice';

const NOTIF_CFG = {
  budget_exceeded:      { emoji: '🚨', bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.2)',    dot: '#ef4444' },
  budget_alert:         { emoji: '⚠️', bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.2)',   dot: '#f59e0b' },
  subscription_renewal: { emoji: '🔔', bg: 'rgba(14,165,233,0.07)',   border: 'rgba(14,165,233,0.2)',   dot: '#0ea5e9' },
  fee_due:              { emoji: '🎓', bg: 'rgba(99,102,241,0.07)',    border: 'rgba(99,102,241,0.2)',   dot: '#6366f1' },
  monthly_summary:      { emoji: '📊', bg: 'rgba(20,184,166,0.07)',   border: 'rgba(20,184,166,0.2)',   dot: '#14b8a6' },
  insight:              { emoji: '💡', bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.2)',   dot: '#f97316' },
  system:               { emoji: '⚙️', bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.2)', dot: '#64748b' },
  settlement:           { emoji: '💸', bg: 'rgba(236,72,153,0.07)',   border: 'rgba(236,72,153,0.2)',  dot: '#ec4899' },
};
const DEFAULT_CFG = { emoji: '📢', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', dot: '#94a3b8' };

export default function Notifications() {
  const dispatch = useDispatch();

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly,  setUnreadOnly]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [clearDlg,    setClearDlg]    = useState(false);

  const fetchLocal = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: { page, limit: 20, unreadOnly },
      });
      setItems(res.data.notifications ?? []);
      setTotalPages(Math.ceil((res.data.total ?? 0) / 20));
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLocal(); }, [page, unreadOnly]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setItems(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    dispatch(fetchNotifications());
  };

  const markAll = async () => {
    await api.patch('/notifications/mark-all-read');
    setItems(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    dispatch(fetchNotifications());
    toast.success('✅ All marked as read');
  };

  const deleteOne = async (id) => {
    await api.delete(`/notifications/${id}`);
    setItems(ns => ns.filter(n => n._id !== id));
    dispatch(fetchNotifications());
  };

  const clearAll = async () => {
    await api.delete('/notifications/clear-all');
    setItems([]); setUnreadCount(0);
    setClearDlg(false);
    dispatch(fetchNotifications());
    toast.success('🗑️ All notifications cleared');
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Notifications 🔔</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAll} className="btn-secondary text-sm flex items-center gap-1.5">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button onClick={() => setClearDlg(true)}
              className="btn-secondary text-sm flex items-center gap-1.5 hover:text-red-400 hover:border-red-500/30">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { val: false, label: '📋 All' },
          { val: true,  label: `🔵 Unread (${unreadCount})` },
        ].map(t => (
          <button key={String(t.val)}
            onClick={() => { setUnreadOnly(t.val); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${unreadOnly === t.val
              ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji={unreadOnly ? '🎉' : '🔔'}
          title={unreadOnly ? "You're all caught up!" : 'No notifications'}
          description={unreadOnly ? 'No unread notifications' : 'Alerts and summaries will appear here'}
        />
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => {
            const cfg = NOTIF_CFG[n.type] ?? DEFAULT_CFG;
            return (
              <motion.div key={n._id}
                className="rounded-2xl p-4 group transition-[filter] hover:brightness-110"
                style={{
                  background: !n.isRead ? cfg.bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${!n.isRead ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: cfg.dot }} />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1.5">{formatRelative(n.createdAt)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button onClick={() => markRead(n._id)}
                            className="btn-icon w-7 h-7 hover:text-teal-400" title="Mark as read">
                            <CheckCheck size={13} />
                          </button>
                        )}
                        <button onClick={() => deleteOne(n._id)}
                          className="btn-icon w-7 h-7 hover:text-red-400" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
          <span className="text-xs text-slate-400">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
        </div>
      )}

      <ConfirmDialog isOpen={clearDlg} onCancel={() => setClearDlg(false)} onConfirm={clearAll}
        title="Clear All Notifications?"
        message="This will permanently delete all your notifications." confirmLabel="Clear All" />
    </div>
  );
}
