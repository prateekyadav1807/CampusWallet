import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, UserX, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDate, formatRelative, getInitials } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [debSearch,  setDebSearch]  = useState('');
  const [statusFilt, setStatusFilt] = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId,   setDeleteId]   = useState(null);
  const [viewUser,   setViewUser]   = useState(null);
  const [userStats,  setUserStats]  = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (debSearch)  params.search = debSearch;
      if (statusFilt) params.status = statusFilt;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, debSearch, statusFilt]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* view user detail */
  const handleView = async (u) => {
    setViewUser(u); setUserStats(null);
    try {
      const res = await api.get(`/admin/users/${u._id}`);
      setUserStats(res.data.stats);
    } catch (_) {}
  };

  /* toggle active status */
  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      const res = await api.patch(`/admin/users/${id}/toggle-status`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setTogglingId(null); }
  };

  /* delete user */
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteId}`);
      toast.success('🗑️ User deleted');
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const FILTER_TABS = [
    { val: '',         label: '📋 All'      },
    { val: 'active',   label: '✅ Active'   },
    { val: 'inactive', label: '🚫 Inactive' },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Manage Users 👥</h1>
        <p className="text-sm text-slate-400 mt-0.5">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 h-9 text-sm" />
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map(t => (
            <button key={t.val} onClick={() => { setStatusFilt(t.val); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilt === t.val
                ? 'bg-teal-600/25 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 border border-white/[0.06] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState emoji="👥" title="No users found" description="Try adjusting search or filters" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>College</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name}
                            className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center
                                          justify-center text-xs font-bold text-white flex-shrink-0">
                            {getInitials(u.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-slate-300 truncate max-w-[140px]">{u.college || '—'}</p>
                      {u.course && <p className="text-xs text-slate-500 truncate">{u.course}</p>}
                    </td>
                    <td><p className="text-xs text-slate-400">{formatDate(u.createdAt)}</p></td>
                    <td><p className="text-xs text-slate-400">{u.lastLogin ? formatRelative(u.lastLogin) : '—'}</p></td>
                    <td>
                      <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? '✅ Active' : '🚫 Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(u)}
                          className="btn-icon w-7 h-7 hover:text-sky-400" title="View">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => handleToggle(u._id)}
                          disabled={togglingId === u._id}
                          className={`btn-icon w-7 h-7 ${u.isActive ? 'hover:text-amber-400' : 'hover:text-teal-400'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {togglingId === u._id
                            ? <LoadingSpinner size="sm" />
                            : u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button onClick={() => setDeleteId(u._id)}
                          className="btn-icon w-7 h-7 hover:text-red-400" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{users.length} of {total} users</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
            <span className="text-xs text-slate-400 px-1">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      {/* View user modal */}
      <Modal isOpen={!!viewUser} onClose={() => { setViewUser(null); setUserStats(null); }}
        title="👤 User Details">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center
                              justify-center text-xl font-black text-white flex-shrink-0">
                {getInitials(viewUser.name)}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-white">{viewUser.name}</p>
                <p className="text-sm text-slate-400">{viewUser.email}</p>
                <span className={`mt-1 ${viewUser.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
                  {viewUser.isActive ? '✅ Active' : '🚫 Inactive'}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'College',   value: viewUser.college  || '—' },
                { label: 'Course',    value: viewUser.course   || '—' },
                { label: 'Semester',  value: viewUser.semester ? `Sem ${viewUser.semester}` : '—' },
                { label: 'Phone',     value: viewUser.phone    || '—' },
                { label: 'Joined',    value: formatDate(viewUser.createdAt) },
                { label: 'Last Login',value: viewUser.lastLogin ? formatDate(viewUser.lastLogin) : '—' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {userStats && (
              <>
                <div className="divider" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Activity Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Expenses', value: `₹${(userStats.totalExpenses ?? 0).toLocaleString('en-IN')}` },
                    { label: 'Expense Count',  value: userStats.expenseCount ?? 0 },
                    { label: 'Total Income',   value: `₹${(userStats.totalIncome ?? 0).toLocaleString('en-IN')}` },
                    { label: 'Income Count',   value: userStats.incomeCount ?? 0 },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3"
                      style={{ background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.15)' }}>
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="font-display text-sm font-bold text-teal-300 mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!userStats && (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Delete User?"
        message="This will permanently delete the user and ALL their financial data. This cannot be undone."
        confirmLabel="Delete User" />
    </div>
  );
}
