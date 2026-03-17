# 🇮🇳 SCHEMEWISE — Government Scheme Monitoring System

> A full-stack web application for monitoring, managing, and analysing government welfare schemes — built with Node.js, MySQL, and an AI-powered Python microservice.

---

## 📌 About the Project

SCHEMEWISE is a role-based government welfare scheme monitoring portal that enables administrators to manage beneficiaries, track enrollments, detect compliance issues, and leverage machine learning for smart scheme recommendations and fraud detection. Citizens can access a public portal to view active schemes and system statistics.

This project was built entirely from scratch — backend, frontend, database, and ML microservice — as a full-stack demonstration of real-world government portal architecture.

---

## 🖥️ Live Demo Credentials

| Role | Username | Password | Redirects To |
|------|----------|----------|--------------|
| Admin | `admin` | `admin123` | Admin Dashboard |
| Admin | `officer1` | `officer123` | Admin Dashboard |
| Public | `citizen1` | `public123` | Public Portal |

---

## ✨ Features

### 🔐 Authentication & Role-Based Access
- JWT-based login system
- Role-based routing — Admin and Public portals are completely separate
- Session management via localStorage

### 📊 Admin Dashboard
- Real-time stats — Total Beneficiaries, Active Schemes, Duplicate Alerts, Active Enrollments
- Doughnut chart for Scheme Distribution
- Bar chart for Beneficiary Enrollment by Scheme
- Dark / Light mode toggle that persists across sessions
- Live notification bell with compliance alerts
- One-click dashboard refresh

### 👥 Beneficiary Management
- Add new beneficiaries with Aadhaar number, income, and category (BPL/APL/AAY)
- Enroll beneficiaries into welfare schemes
- Search and filter beneficiary table
- View enrollment count per beneficiary

### 📋 Welfare Schemes
- View all 8 active government schemes
- Category tagging (Housing, Health, Agriculture, Education, etc.)
- Enrollment count per scheme

### ⚠️ Compliance Alerts
- Auto-generated alerts for duplicate enrollment, income mismatch, and eligibility failure
- Ministry guideline banner (72-hour review requirement)
- Searchable alert table with Aadhaar and scheme details

### 📝 Audit Log
- Complete system activity trail
- Timestamp and user attribution for every action

### 🌐 Public Portal
- Scheme statistics overview
- Active schemes table with enrollment counts
- Recent activity log
- No login required for basic stats

---

## 🤖 Scheme Analysis (ML Module)

A separate Python Flask microservice runs on port 5001 and powers the AI features:

### 🎯 Scheme Recommendation Engine
- Selects any beneficiary from the database
- Scores all 8 schemes by compatibility (0–99% match)
- Uses income fit and beneficiary type weighting
- Shows colour-coded progress bars (green/amber/red)
- Tags already-enrolled schemes with a blue badge
- Explains reason for each score

### 🚨 Fraud & Anomaly Detection
- Runs Isolation Forest (unsupervised ML) on all beneficiaries
- Rule-based checks: BPL with high income, APL with very low income, 4+ scheme enrollments
- Confidence score per alert
- ML-flagged badge on anomaly-detected records
- Severity levels: High / Medium / Low

### 🔮 Eligibility Predictor
- Enter any income + beneficiary type + scheme
- Random Forest classifier trained on synthetic scheme data
- Returns eligible/not eligible with confidence % and probability breakdown

### 📊 All-Scheme Eligibility Check
- Enter income and type once
- Instantly checks eligibility across all 8 schemes
- Shows eligible/ineligible count summary

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.x |
| Backend | Node.js, Express.js |
| Authentication | JSON Web Tokens (JWT) |
| Database | MySQL 8.0 |
| DB Driver | mysql2 |
| ML Service | Python 3, Flask, Flask-CORS |
| ML Libraries | scikit-learn, NumPy, pandas |
| Fonts | IBM Plex Sans, Source Serif 4, IBM Plex Mono |

---

## 📁 Project Structure

```
SCHEMEWISE/
├── frontend/
│   ├── login.html          ← Login portal
│   ├── admin.html          ← Admin dashboard
│   ├── index.html          ← Public portal
│   ├── ml.html             ← Scheme Analysis page
│   ├── css/
│   │   └── style.css       ← Global stylesheet
│   ├── js/
│   │   ├── auth.js         ← Login, logout, toast utilities
│   │   ├── admin.js        ← Admin dashboard logic
│   │   ├── dashboard.js    ← Public portal logic
│   │   ├── beneficiaries.js← Beneficiary CRUD
│   │   └── ml.js           ← Scheme Analysis logic
│   └── images/
│       └── emblem.png      ← Government of India emblem
├── backend/
│   ├── server.js           ← Express server entry point
│   ├── db.js               ← MySQL connection pool
│   ├── .env                ← Environment variables
│   ├── package.json
│   └── routes/
│       ├── auth.js         ← POST /api/auth/login
│       ├── beneficiaries.js← GET/POST /api/beneficiaries
│       ├── schemes.js      ← GET /api/schemes
│       ├── dashboard.js    ← GET /api/dashboard/stats
│       ├── alerts.js       ← GET /api/alerts
│       ├── audit.js        ← GET /api/audit
│       └── ml.js           ← ML proxy routes
├── ml/
│   ├── app.py              ← Flask ML microservice
│   └── requirements.txt    ← Python dependencies
└── database/
    └── schemewise_db.sql   ← Full schema + seed data
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL 8.0
- Python 3.10+

### Step 1 — Clone the repository
```bash
git clone https://github.com/yourusername/schemewise.git
cd schemewise
```

### Step 2 — Set up the database
```bash
mysql -u root -p < database/schemewise_db.sql
```

### Step 3 — Configure environment
Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=schemewise_db
JWT_SECRET=schemewise_secret_key
```

### Step 4 — Install Node dependencies
```bash
cd backend
npm install
```

### Step 5 — Install Python dependencies
```bash
cd ../ml
pip install -r requirements.txt
```

---

## 🚀 Running the Application

You need **two terminal windows** open simultaneously:

**Terminal 1 — ML Service:**
```bash
cd SCHEMEWISE/ml
python app.py
```
Expected output:
```
ML Service starting on http://localhost:5001
* Running on http://127.0.0.1:5001
```

**Terminal 2 — Node Server:**
```bash
cd SCHEMEWISE/backend
npm start
```
Expected output:
```
✅ MySQL connected successfully
🚀 SCHEMEWISE Server running at http://localhost:5000
```

**Then open your browser:**
```
http://localhost:5000
```

---

## 🗃️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | System users with role (admin/public) |
| `schemes` | Government welfare schemes |
| `beneficiaries` | Registered beneficiaries with Aadhaar and income |
| `enrollments` | Beneficiary-scheme enrollment records |
| `alerts` | Compliance and fraud alerts |
| `audit_logs` | System activity trail |

**Seed data included:** 3 users, 8 schemes, 10 beneficiaries, 15 enrollments, 5 alerts, 8 audit logs.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user, return JWT |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/beneficiaries/all` | All beneficiaries |
| POST | `/api/beneficiaries/add` | Add new beneficiary |
| POST | `/api/beneficiaries/enroll` | Enroll in scheme |
| GET | `/api/schemes/all` | All schemes |
| GET | `/api/schemes/distribution` | Chart data |
| GET | `/api/schemes/enrollment` | Enrollment chart data |
| GET | `/api/alerts/all` | All compliance alerts |
| GET | `/api/audit/all` | Audit log |
| GET | `/api/ml/recommend/:id` | Scheme recommendations for beneficiary |
| GET | `/api/ml/fraud` | Run fraud detection |
| POST | `/api/ml/predict` | Predict eligibility for one scheme |
| POST | `/api/ml/predict-all` | Check eligibility across all schemes |
| GET | `/api/ml/health` | ML service health check |

---

## 🧠 ML Architecture

```
Browser (ml.html)
      ↓  calls /api/ml/fraud
Node.js Server (backend/routes/ml.js)
      ↓  proxies to http://localhost:5001/fraud-detect
Python Flask (ml/app.py)
      ↓  runs Isolation Forest + rule-based checks
Node.js sends results back
      ↓
Browser displays alerts with confidence scores
```

The ML service is completely decoupled from the main Node.js server. This means it can be upgraded, replaced, or scaled independently without touching the core application.

---

## 🎨 Design Highlights

- Indian Government colour palette — Navy, Saffron (#FF9933), India Green (#138808)
- Tricolor accent strip on every page
- Government of India emblem in sidebar and login
- IBM Plex Sans for UI, Source Serif 4 for headings — professional and readable
- Fully responsive layout
- Dark and Light mode with persistent preference across all pages including ML module

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Login Portal | Role-based login with demo credentials |
| Admin Dashboard | Stats, charts, dark mode |
| Beneficiary Management | Add, enroll, search |
| Compliance Alerts | Flagged irregularities |
| Scheme Analysis | ML recommendations and fraud detection |
| Public Portal | Citizen-facing statistics |

---

## 👨‍💻 Author

Built with ❤️ as a full-stack project demonstrating real-world government portal architecture with integrated AI/ML capabilities.

---

## 📄 License

This project is for educational and portfolio purposes.