const cron = require('node-cron');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const StudentFee = require('../models/StudentFee');
const Notification = require('../models/Notification');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const {
  sendSubscriptionReminderEmail,
  sendMonthlySummaryEmail
} = require('./emailService');

const setupCronJobs = () => {
  // ── Daily: Check subscription renewals at 9:00 AM ──────────────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Cron: Checking subscription renewals...');
    try {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

      const upcomingSubs = await Subscription.find({
        status: 'active',
        nextRenewalDate: { $lte: threeDaysFromNow, $gte: new Date() }
      }).populate('user', 'name email');

      for (const sub of upcomingSubs) {
        if (!sub.user) continue;

        // Check if notification already sent today
        const existingNotif = await Notification.findOne({
          user: sub.user._id,
          type: 'subscription_renewal',
          'metadata.subscriptionId': sub._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotif) {
          const daysUntil = Math.ceil((new Date(sub.nextRenewalDate) - new Date()) / (1000 * 60 * 60 * 24));
          await Notification.create({
            user: sub.user._id,
            title: `🔔 ${sub.name} Renewal in ${daysUntil} Day${daysUntil === 1 ? '' : 's'}`,
            message: `Your ${sub.name} subscription (₹${sub.amount}) renews on ${new Date(sub.nextRenewalDate).toLocaleDateString('en-IN')}.`,
            type: 'subscription_renewal',
            priority: daysUntil <= 1 ? 'high' : 'medium',
            actionUrl: '/subscriptions',
            metadata: { subscriptionId: sub._id }
          });

          // Send email reminder
          if (daysUntil <= sub.reminderDays) {
            try { await sendSubscriptionReminderEmail(sub.user, sub); } catch (_) {}
          }
        }
      }
      console.log(`✅ Cron: Processed ${upcomingSubs.length} subscriptions`);
    } catch (err) {
      console.error('❌ Cron subscription check failed:', err.message);
    }
  });

  // ── Daily: Check overdue fees at 10:00 AM ──────────────────────────────
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Cron: Checking overdue fees...');
    try {
      const overdueFees = await StudentFee.find({
        dueDate: { $lt: new Date() },
        status: { $in: ['pending', 'partially_paid'] }
      }).populate('user', 'name email');

      for (const fee of overdueFees) {
        if (!fee.user) continue;

        // Update status to overdue
        fee.status = 'overdue';
        await fee.save({ validateBeforeSave: false });

        const existingNotif = await Notification.findOne({
          user: fee.user._id,
          type: 'fee_due',
          'metadata.feeId': fee._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotif) {
          const dueAmount = fee.totalAmount - fee.paidAmount;
          await Notification.create({
            user: fee.user._id,
            title: `🚨 Fee Overdue: ${fee.title}`,
            message: `Your ${fee.feeType} of ₹${dueAmount.toFixed(0)} was due on ${new Date(fee.dueDate).toLocaleDateString('en-IN')}. Please pay immediately.`,
            type: 'fee_due',
            priority: 'critical',
            actionUrl: '/student-fees',
            metadata: { feeId: fee._id }
          });
        }
      }
      console.log(`✅ Cron: Processed ${overdueFees.length} overdue fees`);
    } catch (err) {
      console.error('❌ Cron fee check failed:', err.message);
    }
  });

  // ── Monthly: Send monthly summary on 1st of every month at 8:00 AM ──────
  cron.schedule('0 8 1 * *', async () => {
    console.log('⏰ Cron: Sending monthly summaries...');
    try {
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

      const users = await User.find({ role: 'user', isActive: true }).select('name email');

      for (const user of users) {
        try {
          const [expResult, incResult, topCategory] = await Promise.all([
            Expense.aggregate([
              { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Income.aggregate([
              { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
              { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: '$category', total: { $sum: '$amount' } } },
              { $sort: { total: -1 } },
              { $limit: 1 }
            ])
          ]);

          const totalExpenses = expResult[0]?.total || 0;
          const totalIncome = incResult[0]?.total || 0;

          if (totalExpenses === 0 && totalIncome === 0) continue; // No activity

          const summary = {
            totalIncome,
            totalExpenses,
            totalSavings: totalIncome - totalExpenses,
            topCategory: topCategory[0]?._id || null,
            month: prevMonth,
            year: prevYear
          };

          await Notification.create({
            user: user._id,
            title: '📊 Monthly Summary Ready',
            message: `Your summary for ${startDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}: Income ₹${totalIncome.toFixed(0)}, Expenses ₹${totalExpenses.toFixed(0)}, Savings ₹${(totalIncome - totalExpenses).toFixed(0)}.`,
            type: 'monthly_summary',
            priority: 'low',
            actionUrl: '/analytics'
          });

          await sendMonthlySummaryEmail(user, summary);
        } catch (_) { /* skip individual user errors */ }
      }

      console.log(`✅ Cron: Monthly summaries sent to ${users.length} users`);
    } catch (err) {
      console.error('❌ Cron monthly summary failed:', err.message);
    }
  });

  console.log('✅ Cron jobs initialized');
};

module.exports = { setupCronJobs };
