# 💰 TrackWise — Track Smart. Spend Wise.

A production-ready **Student Expense & Budget Management Platform** built with React + Node.js + MongoDB.

---

## 🚀 Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion, Recharts   |
| State      | Redux Toolkit                                           |
| Backend    | Node.js, Express.js                                     |
| Database   | MongoDB Atlas + Mongoose                                |
| Auth       | JWT + bcryptjs                                          |
| Email      | Nodemailer (Gmail SMTP)                                 |
| Reports    | PDFKit + ExcelJS                                        |
| Deployment | Vercel (frontend) + Render (backend)                    |

---

## 📁 Project Structure

```
TrackWise/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route handlers (13 controllers)
│   ├── middleware/       # Auth, error handler, validation, upload
│   ├── models/          # Mongoose schemas (11 models)
│   ├── routes/          # Express routers (14 routes)
│   ├── services/        # Email, insights, reports, cron
│   ├── utils/           # Helper functions
│   ├── uploads/         # User avatars & generated reports
│   ├── .env             # Environment variables
│   └── server.js        # Entry point
│
└── frontend/
    ├── public/          # favicon.svg, manifest, robots.txt
    └── src/
        ├── components/  # Layout (Sidebar/Navbar), UI components
        ├── hooks/       # useApi, useFetch
        ├── pages/       # All page components
        │   ├── auth/    # Login, Register, ForgotPassword, ResetPassword
        │   ├── admin/   # AdminDashboard, AdminUsers
        │   └── StudentFeatures/  # Fees, Subscriptions, PlacementPrep
        ├── services/    # Axios API instance
        ├── store/       # Redux store + slices (auth, theme, notifications)
        └── utils/       # helpers, constants, formatters
```

---

## ⚡ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Gmail account with App Password for email

### 1. Clone & install

```bash
git clone https://github.com/yourname/trackwise.git
cd TrackWise

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy and fill `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/trackwise
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

**Frontend** — copy and fill `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

App opens at **http://localhost:5173**  
API runs at **http://localhost:5000**

---

## 🌐 Deployment

### Backend → Render
1. Push the `backend/` folder to a GitHub repo
2. Create a new **Web Service** on [Render](https://render.com)
3. Build command: `npm install`  
   Start command: `npm start`
4. Add all environment variables from `.env`
5. Note your Render URL (e.g. `https://trackwise-api.onrender.com`)

### Frontend → Vercel
1. Push the `frontend/` folder to GitHub
2. Import on [Vercel](https://vercel.com)
3. Set environment variable:  
   `VITE_API_URL = https://trackwise-api.onrender.com/api`
4. Deploy — Vercel auto-detects Vite

---

## 🗝️ API Reference

| Module            | Base Path              | Methods                          |
|-------------------|------------------------|----------------------------------|
| Auth              | `/api/auth`            | register, login, forgot/reset pw |
| Expenses          | `/api/expenses`        | CRUD + stats                     |
| Income            | `/api/income`          | CRUD + stats                     |
| Budget            | `/api/budgets`         | get, create/update, delete       |
| Subscriptions     | `/api/subscriptions`   | CRUD + upcoming renewals         |
| Student Fees      | `/api/student-fees`    | CRUD                             |
| Placement         | `/api/placement`       | CRUD + category stats            |
| Groups            | `/api/groups`          | CRUD + expenses + settlements    |
| Analytics         | `/api/analytics`       | dashboard, trend, category, savings |
| Insights          | `/api/insights`        | GET (AI-generated)               |
| Notifications     | `/api/notifications`   | list, mark-read, delete          |
| Reports           | `/api/reports`         | generate, download, delete       |
| Admin             | `/api/admin`           | stats, users CRUD                |

---

## ✨ Features

- 🔐 JWT auth with forgot/reset password via email
- 💸 Expense & income tracking with categories, filters, search, pagination
- 🎯 Monthly budget planner with category limits, daily spend limit, alerts
- 📊 Analytics dashboard — 6 Recharts visualisations (area, bar, pie, line, radial)
- 🤖 AI spending insights (dynamic, comparing current vs previous month)
- 🎓 Student fee tracker with payment progress and overdue detection
- 📺 Subscription tracker with renewal reminders
- 🏆 Placement prep expense tracker with outcome/certificate tracking
- 👥 Flatmate expense splitter with automatic settlement calculation
- 📋 PDF & Excel report generation and download
- 🔔 Real-time notification system with cron-based alerts
- 🛡️ Admin panel — platform stats, user management, activity monitoring
- 🌙 Dark / Light mode toggle
- 📱 Fully responsive (mobile, tablet, desktop)
- 🔄 Cron jobs for subscription reminders and monthly summaries

---

## 📄 License

MIT © 2026 TrackWise
