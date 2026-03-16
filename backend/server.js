// ============================================================
// SCHEMEWISE — Main Express Server
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/schemes',       require('./routes/schemes'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/alerts',        require('./routes/alerts'));
app.use('/api/audit',         require('./routes/audit'));
app.use('/api/ml',            require('./routes/ml'));

// ── Serve frontend HTML pages ────────────────────────────────
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/admin',     (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/ml',        (req, res) => res.sendFile(path.join(__dirname, '../frontend/ml.html')));

// ── Static files (CSS, JS, images) — AFTER page routes ──────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SCHEMEWISE Server running at http://localhost:${PORT}`);
  console.log(`📂 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Login page: http://localhost:${PORT}/`);
  console.log(`🤖 ML Insights: http://localhost:${PORT}/ml\n`);
});