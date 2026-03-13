// ============================================================
// SCHEMEWISE — Schemes Routes
// GET /api/schemes/all
// GET /api/schemes/distribution
// GET /api/schemes/enrollment
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET all schemes ──────────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*, COUNT(e.enrollment_id) AS enrolled_count
      FROM schemes s
      LEFT JOIN enrollments e ON s.scheme_id = e.scheme_id AND e.status = 'active'
      GROUP BY s.scheme_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch schemes' });
  }
});

// ── GET scheme distribution (for pie chart) ──────────────────
router.get('/distribution', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.scheme_name, s.category, COUNT(e.enrollment_id) AS count
      FROM schemes s
      LEFT JOIN enrollments e ON s.scheme_id = e.scheme_id
      GROUP BY s.scheme_id
      ORDER BY count DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch distribution' });
  }
});

// ── GET enrollment by scheme (for bar chart) ─────────────────
router.get('/enrollment', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.scheme_name, s.category,
             COUNT(e.enrollment_id) AS total_enrolled,
             SUM(CASE WHEN e.status='active' THEN 1 ELSE 0 END) AS active_enrolled
      FROM schemes s
      LEFT JOIN enrollments e ON s.scheme_id = e.scheme_id
      GROUP BY s.scheme_id
      ORDER BY total_enrolled DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch enrollment data' });
  }
});

module.exports = router;