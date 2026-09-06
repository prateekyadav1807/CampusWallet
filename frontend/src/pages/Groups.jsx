import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, ArrowRight, Trash2, ChevronDown, ChevronUp,
  UserPlus, DollarSign, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const GROUP_TYPES  = ['Flatmates', 'Trip', 'Project', 'Friends', 'Other'];
const TYPE_EMOJI   = { Flatmates: '🏠', Trip: '✈️', Project: '💻', Friends: '👥', Other: '📦' };
const SPLIT_CATS   = ['Rent','Food','Bills','Travel','Shopping','Entertainment','Other'];

export default function Groups() {
  const { user } = useSelector(s => s.auth);

  const [groups,       setGroups]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [expanded,     setExpanded]     = useState(null);   // group._id
  const [detail,       setDetail]       = useState(null);   // { group, balances }
  const [settlements,  setSettlements]  = useState([]);
  const [loadDetail,   setLoadDetail]   = useState(false);

  /* modals */
  const [groupModal,   setGroupModal]   = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);

  /* forms */
  const [gForm, setGForm] = useState({
    name: '', description: '', type: 'Flatmates',
    members: [],
  });
  const [memberInput, setMemberInput] = useState({ name: '', email: '' });
  const [eForm, setEForm] = useState({
    title: '', amount: '', paidByName: '', category: 'Other',
    date: new Date().toISOString().split('T')[0], notes: '',
  });

  /* ── fetch groups ─────────────────────────────────────────── */
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data.groups);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  /* ── expand / collapse group ──────────────────────────────── */
  const toggleGroup = async (group) => {
    if (expanded === group._id) {
      setExpanded(null); setDetail(null); setSettlements([]);
      return;
    }
    setExpanded(group._id);
    setLoadDetail(true);
    try {
      const [dRes, sRes] = await Promise.all([
        api.get(`/groups/${group._id}`),
        api.get(`/groups/${group._id}/settlements`),
      ]);
      setDetail(dRes.data);
      setSettlements(sRes.data.settlements ?? []);
    } catch (_) {}
    finally { setLoadDetail(false); }
  };

  /* ── open create modal ────────────────────────────────────── */
  const openCreate = () => {
    setGForm({
      name: '', description: '', type: 'Flatmates',
      members: [{ name: user.name, email: user.email, isRegistered: true, user: user._id }],
    });
    setGroupModal(true);
  };

  const addMember = () => {
    if (!memberInput.name.trim()) { toast.error('Member name required'); return; }
    setGForm(f => ({ ...f, members: [...f.members, { ...memberInput, isRegistered: false }] }));
    setMemberInput({ name: '', email: '' });
  };

  const removeMember = (i) =>
    setGForm(f => ({ ...f, members: f.members.filter((_, idx) => idx !== i) }));

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!gForm.name.trim())        { toast.error('Group name required'); return; }
    if (gForm.members.length < 1)  { toast.error('Add at least one member'); return; }
    setSaving(true);
    try {
      await api.post('/groups', gForm);
      toast.success('👥 Group created!');
      setGroupModal(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  /* ── delete group ─────────────────────────────────────────── */
  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${deleteId}`);
      toast.success('🗑️ Group deleted');
      setDeleteId(null);
      if (expanded === deleteId) { setExpanded(null); setDetail(null); }
      fetchGroups();
    } catch (_) { toast.error('Failed to delete'); }
  };

  /* ── add expense ──────────────────────────────────────────── */
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!eForm.title || !eForm.amount || !eForm.paidByName) {
      toast.error('Title, amount and payer required'); return;
    }
    setSaving(true);
    try {
      await api.post(`/groups/${expanded}/expenses`, {
        ...eForm, amount: parseFloat(eForm.amount),
      });
      toast.success('💰 Expense split!');
      setExpenseModal(false);
      setEForm({ title: '', amount: '', paidByName: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '' });
      /* refresh detail */
      const [dRes, sRes] = await Promise.all([
        api.get(`/groups/${expanded}`),
        api.get(`/groups/${expanded}/settlements`),
      ]);
      setDetail(dRes.data);
      setSettlements(sRes.data.settlements ?? []);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  /* ── settle debt ──────────────────────────────────────────── */
  const handleSettle = async (sid) => {
    try {
      await api.patch(`/groups/settlements/${sid}/settle`, { paymentMethod: 'UPI' });
      toast.success('✅ Marked as settled!');
      const sRes = await api.get(`/groups/${expanded}/settlements`);
      setSettlements(sRes.data.settlements ?? []);
      const dRes = await api.get(`/groups/${expanded}`);
      setDetail(dRes.data);
    } catch (_) { toast.error('Failed'); }
  };

  /* ── current group members for expense form ───────────────── */
  const currentMembers = groups.find(g => g._id === expanded)?.members ?? [];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Expense Splitter 👥</h1>
          <p className="text-sm text-slate-400 mt-0.5">Split bills with flatmates, track who owes whom</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Group
        </button>
      </div>

      {/* Groups list */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : groups.length === 0 ? (
        <EmptyState emoji="👥" title="No groups yet"
          description="Create a group with your flatmates to start splitting expenses"
          action={<button onClick={openCreate} className="btn-primary">+ Create Group</button>}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group, gi) => {
            const isOpen = expanded === group._id;
            return (
              <motion.div key={group._id} className="card overflow-hidden"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.06 }}>

                {/* Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleGroup(group)}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.15)' }}>
                    {TYPE_EMOJI[group.type] ?? '👥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-white">{group.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {group.members?.length ?? 0} members · {group.type}
                      {group.description ? ` · ${group.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-display font-bold text-white text-sm">
                        {formatCurrency(group.totalExpenses ?? 0)}
                      </p>
                      <p className="text-[10px] text-slate-500">total</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(group._id); }}
                      className="btn-icon hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded panel */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {loadDetail ? (
                        <div className="flex justify-center py-8">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">

                          {/* Action */}
                          <button
                            onClick={() => setExpenseModal(true)}
                            className="btn-warm flex items-center gap-2 text-sm"
                          >
                            <DollarSign size={14} /> Add &amp; Split Expense
                          </button>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Balances */}
                            {detail?.balances?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💰 Balances</p>
                                <div className="space-y-1.5">
                                  {detail.balances.map(b => (
                                    <div key={b.name}
                                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                      <span className="text-sm text-white">{b.name}</span>
                                      <span className={`font-display font-bold text-sm ${b.balance > 0 ? 'text-teal-400' : b.balance < 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                                        {b.balance > 0 ? '+' : ''}{formatCurrency(b.balance)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Settlements */}
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">🤝 Settlements</p>
                              {settlements.filter(s => s.status === 'pending').length === 0 ? (
                                <div className="px-3 py-3 rounded-xl text-xs text-teal-400 font-medium"
                                  style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}>
                                  ✅ All settled up!
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {settlements.filter(s => s.status === 'pending').map(s => (
                                    <div key={s._id}
                                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                                      style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.15)' }}>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-orange-400 font-semibold">{s.from.name}</span>
                                        <ArrowRight size={11} className="text-slate-500" />
                                        <span className="text-teal-400 font-semibold">{s.to.name}</span>
                                        <span className="text-white font-bold ml-1">{formatCurrency(s.amount)}</span>
                                      </div>
                                      <button
                                        onClick={() => handleSettle(s._id)}
                                        className="btn-success text-[10px] px-2 py-1 flex items-center gap-1 h-auto"
                                        style={{ padding: '3px 8px', fontSize: 10 }}
                                      >
                                        <Check size={10} /> Settle
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Recent expenses */}
                          {detail?.group?.expenses?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📋 Recent Expenses</p>
                              <div className="space-y-1">
                                {[...detail.group.expenses].reverse().slice(0, 5).map(exp => (
                                  <div key={exp._id}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                      <p className="text-xs font-semibold text-white">{exp.title}</p>
                                      <p className="text-[10px] text-slate-500">
                                        Paid by {exp.paidByName} · {formatDate(exp.date)}
                                      </p>
                                    </div>
                                    <p className="font-display font-bold text-white text-sm">
                                      {formatCurrency(exp.amount)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create Group Modal ─────────────────────────────────── */}
      <Modal isOpen={groupModal} onClose={() => setGroupModal(false)}
        title="👥 Create Group" size="lg"
        footer={
          <>
            <button onClick={() => setGroupModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateGroup} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : '👥 Create Group'}
            </button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Group Name *</label>
              <input placeholder="e.g. Flat 302 Squad"
                value={gForm.name} onChange={e => setGForm(f => ({ ...f, name: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select value={gForm.type} onChange={e => setGForm(f => ({ ...f, type: e.target.value }))}
                className="input-field">
                {GROUP_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <input placeholder="Optional"
                value={gForm.description} onChange={e => setGForm(f => ({ ...f, description: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="form-label">Members ({gForm.members.length})</label>
            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
              {gForm.members.map((m, i) => (
                <div key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-[11px] text-white font-bold">
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{m.name}</span>
                    {m.email && <span className="text-xs text-slate-500">{m.email}</span>}
                    {m.isRegistered && <span className="badge-teal text-[10px]">you</span>}
                  </div>
                  {!m.isRegistered && (
                    <button type="button" onClick={() => removeMember(i)}
                      className="btn-icon w-5 h-5 p-0 hover:text-red-400">
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input placeholder="Member name"
                value={memberInput.name}
                onChange={e => setMemberInput(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                className="input-field text-sm flex-1 h-9" />
              <input placeholder="Email (optional)"
                value={memberInput.email}
                onChange={e => setMemberInput(p => ({ ...p, email: e.target.value }))}
                className="input-field text-sm flex-1 h-9" />
              <button type="button" onClick={addMember}
                className="btn-secondary h-9 px-3 flex-shrink-0">
                <UserPlus size={14} />
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Add Expense Modal ──────────────────────────────────── */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)}
        title="💰 Add & Split Expense"
        footer={
          <>
            <button onClick={() => setExpenseModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddExpense} disabled={saving} className="btn-warm flex items-center gap-2">
              {saving ? <LoadingSpinner size="sm" /> : '💰 Split Expense'}
            </button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="form-label">Title *</label>
              <input placeholder="e.g. Monthly Rent, Groceries"
                value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="form-label">Amount ₹ *</label>
              <input type="number" placeholder="0.00" min="0.01"
                value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date"
                value={eForm.date} onChange={e => setEForm(f => ({ ...f, date: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="form-label">Paid By *</label>
              <select value={eForm.paidByName}
                onChange={e => setEForm(f => ({ ...f, paidByName: e.target.value }))}
                className="input-field">
                <option value="">Select member</option>
                {currentMembers.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select value={eForm.category}
                onChange={e => setEForm(f => ({ ...f, category: e.target.value }))}
                className="input-field">
                {SPLIT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <input placeholder="Any notes…"
                value={eForm.notes} onChange={e => setEForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          {/* Preview split */}
          {eForm.amount && currentMembers.length > 0 && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.18)' }}>
              <p className="text-xs text-slate-400 mb-0.5">Equal split preview</p>
              <p className="font-display font-bold text-teal-300">
                {formatCurrency(parseFloat(eForm.amount) / currentMembers.length)} per person
                <span className="text-slate-400 font-normal text-xs ml-2">({currentMembers.length} members)</span>
              </p>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDeleteGroup} onCancel={() => setDeleteId(null)}
        title="Delete Group?"
        message="This will delete the group and all its expenses and settlements." />
    </div>
  );
}
