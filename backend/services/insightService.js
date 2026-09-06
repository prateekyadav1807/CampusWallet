const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

/**
 * Generates dynamic AI-style spending insights for a user
 * by comparing current month vs previous month data
 */
const generateInsights = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.getMonth() + 1;
  const prevYear = prevDate.getFullYear();

  // Date ranges
  const currStart = new Date(currentYear, currentMonth - 1, 1);
  const currEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
  const prevStart = new Date(prevYear, prevMonth - 1, 1);
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);

  const [currExpenses, prevExpenses, currIncome, prevIncome, budget] = await Promise.all([
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: currStart, $lte: currEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Income.aggregate([
      { $match: { user: userId, date: { $gte: currStart, $lte: currEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Income.aggregate([
      { $match: { user: userId, date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Budget.findOne({ user: userId, month: currentMonth, year: currentYear })
  ]);

  const insights = [];

  const currTotal = currExpenses.reduce((s, e) => s + e.total, 0);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.total, 0);
  const currIncomeTotal = currIncome[0]?.total || 0;
  const prevIncomeTotal = prevIncome[0]?.total || 0;

  // ── Overall spending change ──────────────────────────────────────────────
  if (prevTotal > 0 && currTotal > 0) {
    const pct = ((currTotal - prevTotal) / prevTotal) * 100;
    if (pct > 0) {
      insights.push({
        type: 'warning',
        emoji: '📈',
        title: 'Spending Increased',
        message: `Your total spending increased by ${pct.toFixed(1)}% compared to last month (₹${prevTotal.toFixed(0)} → ₹${currTotal.toFixed(0)}).`,
        priority: pct > 30 ? 'high' : 'medium'
      });
    } else {
      insights.push({
        type: 'success',
        emoji: '🎉',
        title: 'Spending Decreased',
        message: `Great job! You spent ${Math.abs(pct).toFixed(1)}% less than last month. You saved ₹${(prevTotal - currTotal).toFixed(0)} more.`,
        priority: 'low'
      });
    }
  } else if (currTotal === 0) {
    insights.push({
      type: 'info',
      emoji: '📝',
      title: 'No Expenses Yet',
      message: 'You haven\'t logged any expenses this month. Start tracking to get personalized insights!',
      priority: 'low'
    });
  }

  // ── Category-level insights ─────────────────────────────────────────────
  currExpenses.forEach(curr => {
    const prev = prevExpenses.find(p => p._id === curr._id);
    if (!prev) {
      if (curr.total > 500) {
        insights.push({
          type: 'info',
          emoji: '🆕',
          title: `New ${curr._id} Spending`,
          message: `You spent ₹${curr.total.toFixed(0)} on ${curr._id} this month — a category you didn't spend on last month.`,
          priority: 'low'
        });
      }
      return;
    }
    const pct = ((curr.total - prev.total) / prev.total) * 100;
    if (pct > 20) {
      insights.push({
        type: 'warning',
        emoji: getCategoryEmoji(curr._id),
        title: `${curr._id} Spending Up`,
        message: `You spent ${pct.toFixed(0)}% more on ${curr._id} this month (₹${prev.total.toFixed(0)} → ₹${curr.total.toFixed(0)}).`,
        priority: pct > 50 ? 'high' : 'medium'
      });
    } else if (pct < -20) {
      insights.push({
        type: 'success',
        emoji: getCategoryEmoji(curr._id),
        title: `${curr._id} Spending Down`,
        message: `Your ${curr._id} spending decreased by ${Math.abs(pct).toFixed(0)}%. You saved ₹${(prev.total - curr.total).toFixed(0)} compared to last month.`,
        priority: 'low'
      });
    }
  });

  // ── Savings rate insight ─────────────────────────────────────────────────
  if (currIncomeTotal > 0) {
    const savingsRate = ((currIncomeTotal - currTotal) / currIncomeTotal) * 100;
    if (savingsRate >= 30) {
      insights.push({
        type: 'success',
        emoji: '💰',
        title: 'Excellent Savings Rate',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income this month. Financial experts recommend 20%+ — you're crushing it!`,
        priority: 'low'
      });
    } else if (savingsRate < 10 && savingsRate > 0) {
      insights.push({
        type: 'warning',
        emoji: '💸',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}% this month. Try to aim for at least 20% to build a financial cushion.`,
        priority: 'medium'
      });
    } else if (savingsRate <= 0) {
      insights.push({
        type: 'danger',
        emoji: '🚨',
        title: 'Overspending Alert',
        message: `Your expenses (₹${currTotal.toFixed(0)}) exceed your income (₹${currIncomeTotal.toFixed(0)}) this month. Review your spending urgently.`,
        priority: 'high'
      });
    }
  }

  // ── Budget utilization ───────────────────────────────────────────────────
  if (budget) {
    const budgetPct = (currTotal / budget.totalBudget) * 100;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayOfMonth = now.getDate();
    const expectedPct = (dayOfMonth / daysInMonth) * 100;

    if (budgetPct > expectedPct + 20) {
      insights.push({
        type: 'warning',
        emoji: '📊',
        title: 'Ahead of Budget Pace',
        message: `You've used ${budgetPct.toFixed(0)}% of your budget but only ${dayOfMonth} of ${daysInMonth} days have passed. Slow down to stay on track.`,
        priority: 'high'
      });
    } else if (budgetPct < expectedPct - 20 && dayOfMonth > 10) {
      insights.push({
        type: 'success',
        emoji: '🎯',
        title: 'Under Budget',
        message: `You're spending well within budget! Only ${budgetPct.toFixed(0)}% used with ${dayOfMonth} days elapsed. Keep it up!`,
        priority: 'low'
      });
    }

    // Saving opportunity
    const remaining = budget.totalBudget - currTotal;
    if (remaining > 1000 && dayOfMonth >= 20) {
      insights.push({
        type: 'info',
        emoji: '💡',
        title: 'Saving Opportunity',
        message: `You have ₹${remaining.toFixed(0)} remaining in your budget. Consider moving the surplus to savings or investments.`,
        priority: 'low'
      });
    }
  }

  // ── Top spending category tip ────────────────────────────────────────────
  if (currExpenses.length > 0) {
    const topCategory = currExpenses.reduce((max, e) => e.total > max.total ? e : max, currExpenses[0]);
    const topPct = currTotal > 0 ? ((topCategory.total / currTotal) * 100).toFixed(0) : 0;
    if (parseFloat(topPct) > 40) {
      insights.push({
        type: 'info',
        emoji: '🏆',
        title: `Top Spending: ${topCategory._id}`,
        message: `${topCategory._id} accounts for ${topPct}% of your total expenses this month (₹${topCategory.total.toFixed(0)}). This is your biggest spending area.`,
        priority: 'medium'
      });
    }
  }

  // ── Income change ────────────────────────────────────────────────────────
  if (prevIncomeTotal > 0 && currIncomeTotal > 0) {
    const incomePct = ((currIncomeTotal - prevIncomeTotal) / prevIncomeTotal) * 100;
    if (incomePct > 10) {
      insights.push({
        type: 'success',
        emoji: '💚',
        title: 'Income Increased',
        message: `Your income grew by ${incomePct.toFixed(1)}% this month (₹${prevIncomeTotal.toFixed(0)} → ₹${currIncomeTotal.toFixed(0)}). Great progress!`,
        priority: 'low'
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return insights.slice(0, 8); // Return top 8 insights
};

const getCategoryEmoji = (category) => {
  const map = {
    Food: '🍔', Rent: '🏠', Travel: '✈️', Shopping: '🛍️',
    Gym: '💪', Bills: '📃', Education: '📚', Entertainment: '🎬',
    Health: '🏥', Miscellaneous: '📦'
  };
  return map[category] || '💸';
};

module.exports = { generateInsights };
