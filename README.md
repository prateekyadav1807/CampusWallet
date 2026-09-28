# 💰 CampusWallet — Student Expense & Budget Management Platform

A full-stack Student Expense & Budget Management Platform built with React, Node.js, Express.js, and MongoDB.

## 🌐 Live Demo

🔗 https://campus-wallet-pi.vercel.app/

---

## 🚀 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React.js, Vite, Tailwind CSS |
| State Management | Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Reports | PDFKit, ExcelJS |
| Deployment | Vercel, Render |

---

## 🎯 Key Highlights

- MERN Stack Application
- Secure JWT Authentication
- Expense & Budget Management
- Interactive Analytics Dashboard
- Expense Splitting Functionality
- PDF & Excel Report Generation
- Admin Dashboard
- Responsive User Interface

---

## ✨ Features

- 🔐 User Authentication (Login, Register, Forgot Password)
- 💸 Expense & Income Tracking
- 🎯 Monthly Budget Planning
- 📊 Analytics Dashboard
- 👥 Flatmate Expense Splitting
- 📋 PDF & Excel Report Generation
- 🛡️ Admin Dashboard
- 🌙 Dark / Light Mode
- 📱 Responsive Design

---

## 📁 Project Structure

```text
CampusWallet/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        │   ├── auth/
        │   ├── admin/
        │   └── StudentFeatures/
        ├── services/
        ├── store/
        └── utils/
```

---

## ⚡ Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas Account

### Clone Repository

```bash
git clone https://github.com/prateekyadav1807/CampusWallet.git
cd CampusWallet
```

### Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
```

### Run Application

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Backend URL:

```text
http://localhost:5000
```

---

## 🗄️ Database

MongoDB Atlas is used for storing:

- User Information
- Expenses
- Income Records
- Budget Data
- Group Expenses
- Reports

---

## 🔒 Security Features

- JWT Authentication
- Password Hashing using bcryptjs
- Protected Routes
- Environment Variable Configuration

---

## 📄 License

MIT License
