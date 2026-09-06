const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

// Base HTML email template
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TrackWise</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f1a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 20px; overflow: hidden; border: 1px solid rgba(139,92,246,0.3); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%); padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 800; color: white; letter-spacing: 2px; }
    .header p { color: rgba(255,255,255,0.85); margin-top: 6px; font-size: 14px; }
    .logo-emoji { font-size: 40px; display: block; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .content h2 { font-size: 22px; color: #a78bfa; margin-bottom: 16px; }
    .content p { color: #cbd5e1; line-height: 1.7; margin-bottom: 14px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 20px 0; transition: all 0.3s; }
    .btn:hover { opacity: 0.9; }
    .info-box { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-box p { color: #a78bfa; margin: 0; font-size: 13px; }
    .divider { height: 1px; background: rgba(139,92,246,0.2); margin: 24px 0; }
    .footer { background: rgba(0,0,0,0.3); padding: 24px 30px; text-align: center; }
    .footer p { color: #64748b; font-size: 12px; line-height: 1.6; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-emoji">💰</span>
      <h1>TrackWise</h1>
      <p>Track Smart. Spend Wise.</p>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TrackWise. All rights reserved.</p>
      <p>This email was sent to you because you have an account with TrackWise.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  const content = `
    <h2>🎉 Welcome to TrackWise, ${user.name}!</h2>
    <p>We're thrilled to have you on board. TrackWise is your all-in-one platform to manage your student expenses, track income, plan budgets, and make smart financial decisions.</p>
    <div class="info-box">
      <p>🎯 <strong>What you can do:</strong></p>
      <p>• Track daily expenses by category</p>
      <p>• Monitor income and calculate savings</p>
      <p>• Set monthly budgets and get alerts</p>
      <p>• Split expenses with flatmates</p>
      <p>• Track semester fees and subscriptions</p>
    </div>
    <p>Get started by setting up your first monthly budget and logging your expenses.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">🚀 Go to Dashboard</a>
    <div class="divider"></div>
    <p style="font-size:13px; color:#64748b;">Need help? Reply to this email or visit our support page.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TrackWise <noreply@trackwise.app>',
    to: user.email,
    subject: '🎉 Welcome to TrackWise – Track Smart. Spend Wise.',
    html: baseTemplate(content)
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetUrl) => {
  const transporter = createTransporter();
  const content = `
    <h2>🔐 Reset Your Password</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>We received a request to reset the password for your TrackWise account. Click the button below to set a new password.</p>
    <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
    <div class="info-box">
      <p>⏰ This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your account is safe.</p>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px; color:#64748b;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="font-size:12px; color:#7c3aed; word-break:break-all;">${resetUrl}</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TrackWise <noreply@trackwise.app>',
    to: user.email,
    subject: '🔐 Password Reset Request – TrackWise',
    html: baseTemplate(content)
  });
};

// Send budget alert email
const sendBudgetAlertEmail = async (user, data) => {
  const transporter = createTransporter();
  const content = `
    <h2>⚠️ Budget Alert</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>You've used <strong>${data.percentage}%</strong> of your monthly budget of <strong>₹${data.totalBudget}</strong>.</p>
    <div class="info-box">
      <p>💸 Total Spent: <strong>₹${data.totalSpent}</strong></p>
      <p>💰 Remaining: <strong>₹${data.remaining}</strong></p>
      <p>📅 Daily Limit: <strong>₹${data.dailyLimit}</strong></p>
    </div>
    <p>Review your spending to stay within your budget for this month.</p>
    <a href="${process.env.FRONTEND_URL}/budget" class="btn">📊 View Budget</a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TrackWise <noreply@trackwise.app>',
    to: user.email,
    subject: `⚠️ Budget Alert – You've used ${data.percentage}% of your budget`,
    html: baseTemplate(content)
  });
};

// Send subscription renewal reminder
const sendSubscriptionReminderEmail = async (user, subscription) => {
  const transporter = createTransporter();
  const renewalDate = new Date(subscription.nextRenewalDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const content = `
    <h2>🔔 Subscription Renewal Reminder</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your <strong>${subscription.name}</strong> subscription is due for renewal soon.</p>
    <div class="info-box">
      <p>📺 Subscription: <strong>${subscription.name}</strong></p>
      <p>💰 Amount: <strong>₹${subscription.amount}</strong></p>
      <p>📅 Renewal Date: <strong>${renewalDate}</strong></p>
      <p>🔄 Billing Cycle: <strong>${subscription.billingCycle}</strong></p>
    </div>
    <p>Make sure you have sufficient balance before the renewal date.</p>
    <a href="${process.env.FRONTEND_URL}/subscriptions" class="btn">📋 Manage Subscriptions</a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TrackWise <noreply@trackwise.app>',
    to: user.email,
    subject: `🔔 ${subscription.name} renews on ${renewalDate}`,
    html: baseTemplate(content)
  });
};

// Send monthly summary email
const sendMonthlySummaryEmail = async (user, summary) => {
  const transporter = createTransporter();
  const monthName = new Date(summary.year, summary.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const savingsRate = summary.totalIncome > 0
    ? ((summary.totalSavings / summary.totalIncome) * 100).toFixed(1)
    : 0;

  const content = `
    <h2>📊 Monthly Summary – ${monthName}</h2>
    <p>Hi <strong>${user.name}</strong>, here's your financial summary for ${monthName}:</p>
    <div class="info-box">
      <p>💚 Total Income: <strong>₹${summary.totalIncome.toLocaleString('en-IN')}</strong></p>
      <p>🔴 Total Expenses: <strong>₹${summary.totalExpenses.toLocaleString('en-IN')}</strong></p>
      <p>💙 Total Savings: <strong>₹${summary.totalSavings.toLocaleString('en-IN')}</strong></p>
      <p>📈 Savings Rate: <strong>${savingsRate}%</strong></p>
    </div>
    ${summary.topCategory ? `<p>🏆 Your biggest expense category was <strong>${summary.topCategory}</strong>.</p>` : ''}
    <a href="${process.env.FRONTEND_URL}/analytics" class="btn">📈 View Full Analytics</a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'TrackWise <noreply@trackwise.app>',
    to: user.email,
    subject: `📊 Your TrackWise Monthly Summary – ${monthName}`,
    html: baseTemplate(content)
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBudgetAlertEmail,
  sendSubscriptionReminderEmail,
  sendMonthlySummaryEmail
};
