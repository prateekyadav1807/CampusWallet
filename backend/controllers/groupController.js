const Group = require('../models/Group');
const Settlement = require('../models/Settlement');

// @desc    Get all groups for user
const getGroups = async (req, res) => {
  const groups = await Group.find({
    $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }]
  }).populate('createdBy', 'name email avatar').sort({ updatedAt: -1 });

  res.status(200).json({ success: true, count: groups.length, groups });
};

// @desc    Get single group
const getGroup = async (req, res) => {
  const group = await Group.findOne({
    _id: req.params.id,
    $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }]
  }).populate('createdBy', 'name email avatar');

  if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

  // Calculate balances
  const balances = calculateBalances(group);
  res.status(200).json({ success: true, group, balances });
};

// @desc    Create group
const createGroup = async (req, res) => {
  const { name, description, members, type } = req.body;

  // Ensure creator is in the members list
  const membersList = members || [];
  const creatorInList = membersList.some(m => m.user?.toString() === req.user._id.toString());
  if (!creatorInList) {
    membersList.unshift({ user: req.user._id, name: req.user.name, email: req.user.email, isRegistered: true });
  }

  const group = await Group.create({
    name, description, type,
    createdBy: req.user._id,
    members: membersList
  });

  res.status(201).json({ success: true, message: '👥 Group created successfully.', group });
};

// @desc    Update group
const updateGroup = async (req, res) => {
  const group = await Group.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { name: req.body.name, description: req.body.description, type: req.body.type },
    { new: true, runValidators: true }
  );
  if (!group) return res.status(404).json({ success: false, message: 'Group not found or unauthorized.' });
  res.status(200).json({ success: true, message: '✅ Group updated.', group });
};

// @desc    Delete group
const deleteGroup = async (req, res) => {
  const group = await Group.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found or unauthorized.' });
  await Settlement.deleteMany({ group: req.params.id });
  res.status(200).json({ success: true, message: '🗑️ Group deleted.' });
};

// @desc    Add expense to group
const addGroupExpense = async (req, res) => {
  const group = await Group.findOne({
    _id: req.params.id,
    $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }]
  });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

  const { title, amount, paidByName, category, date, splitType, customSplits, notes } = req.body;
  const memberCount = group.members.length;

  let splits;
  if (splitType === 'custom' && customSplits) {
    splits = customSplits;
  } else {
    // Equal split
    const perPerson = parseFloat((amount / memberCount).toFixed(2));
    splits = group.members.map(m => ({
      memberId: m._id,
      memberName: m.name,
      amount: perPerson,
      isPaid: m.name === paidByName
    }));
  }

  const paidByMember = group.members.find(m => m.name === paidByName);

  group.expenses.push({
    title, amount, paidByName,
    paidBy: paidByMember?.user || null,
    category: category || 'Other',
    date: date || new Date(),
    splitType: splitType || 'equal',
    splits,
    notes
  });

  await group.save();

  // Auto-generate settlements
  await generateSettlements(group);

  res.status(201).json({
    success: true,
    message: '💰 Expense added and splits calculated.',
    expense: group.expenses[group.expenses.length - 1],
    balances: calculateBalances(group)
  });
};

// @desc    Delete group expense
const deleteGroupExpense = async (req, res) => {
  const group = await Group.findOne({ _id: req.params.groupId, createdBy: req.user._id });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

  group.expenses = group.expenses.filter(e => e._id.toString() !== req.params.expenseId);
  await group.save();
  await generateSettlements(group);

  res.status(200).json({ success: true, message: '🗑️ Expense removed.', balances: calculateBalances(group) });
};

// @desc    Get settlements for a group
const getSettlements = async (req, res) => {
  const settlements = await Settlement.find({ group: req.params.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, settlements });
};

// @desc    Mark settlement as settled
const settleDebt = async (req, res) => {
  const settlement = await Settlement.findByIdAndUpdate(
    req.params.settlementId,
    { status: 'settled', settledAt: new Date(), paymentMethod: req.body.paymentMethod },
    { new: true }
  );
  if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found.' });
  res.status(200).json({ success: true, message: '✅ Marked as settled!', settlement });
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculateBalances(group) {
  const balances = {};

  group.members.forEach(m => { balances[m.name] = 0; });

  group.expenses.forEach(exp => {
    exp.splits.forEach(split => {
      if (split.memberName !== exp.paidByName) {
        balances[split.memberName] = (balances[split.memberName] || 0) - split.amount;
        balances[exp.paidByName] = (balances[exp.paidByName] || 0) + split.amount;
      }
    });
  });

  return Object.entries(balances).map(([name, balance]) => ({
    name,
    balance: parseFloat(balance.toFixed(2)),
    owes: balance < 0,
    owed: balance > 0
  }));
}

async function generateSettlements(group) {
  // Delete existing pending settlements
  await Settlement.deleteMany({ group: group._id, status: 'pending' });

  const balances = calculateBalances(group);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amount > 0.01) {
      const debtorMember = group.members.find(m => m.name === debtor.name);
      const creditorMember = group.members.find(m => m.name === creditor.name);

      settlements.push({
        group: group._id,
        from: { userId: debtorMember?.user, name: debtor.name },
        to: { userId: creditorMember?.user, name: creditor.name },
        amount: parseFloat(amount.toFixed(2)),
        status: 'pending'
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  if (settlements.length > 0) {
    await Settlement.insertMany(settlements);
  }
}

module.exports = {
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addGroupExpense, deleteGroupExpense, getSettlements, settleDebt
};
