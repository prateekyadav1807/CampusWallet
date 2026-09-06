const Subscription = require('../models/Subscription');

const getSubscriptions = async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const subscriptions = await Subscription.find(filter).sort({ nextRenewalDate: 1 });

  // Calculate monthly cost
  const monthlyCost = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const multipliers = { monthly: 1, quarterly: 1 / 3, 'half-yearly': 1 / 6, yearly: 1 / 12 };
      return sum + s.amount * (multipliers[s.billingCycle] || 1);
    }, 0);

  res.status(200).json({
    success: true,
    count: subscriptions.length,
    monthlyCost: parseFloat(monthlyCost.toFixed(2)),
    subscriptions
  });
};

const getSubscription = async (req, res) => {
  const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
  res.status(200).json({ success: true, subscription: sub });
};

const createSubscription = async (req, res) => {
  const subscription = await Subscription.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, message: '📺 Subscription added successfully.', subscription });
};

const updateSubscription = async (req, res) => {
  const subscription = await Subscription.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found.' });
  res.status(200).json({ success: true, message: '✅ Subscription updated.', subscription });
};

const deleteSubscription = async (req, res) => {
  const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found.' });
  res.status(200).json({ success: true, message: '🗑️ Subscription deleted.' });
};

// Get upcoming renewals (within next N days)
const getUpcomingRenewals = async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const renewals = await Subscription.find({
    user: req.user._id,
    status: 'active',
    nextRenewalDate: { $lte: futureDate, $gte: new Date() }
  }).sort({ nextRenewalDate: 1 });

  res.status(200).json({ success: true, count: renewals.length, renewals });
};

module.exports = { getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription, getUpcomingRenewals };
