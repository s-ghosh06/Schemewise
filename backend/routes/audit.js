// ============================================================
// SCHEMEWISE — Audit Log Routes
// GET /api/audit/all
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        al.log_id,
        al.action_description,
        al.created_at,
        u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

module.exports = router;