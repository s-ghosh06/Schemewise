// ============================================================
// SCHEMEWISE — Alerts Routes
// GET /api/alerts/all
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.alert_id,
        a.alert_type,
        a.created_at,
        b.full_name AS beneficiary_name,
        b.aadhaar_number,
        s.scheme_name
      FROM alerts a
      JOIN beneficiaries b ON a.beneficiary_id = b.beneficiary_id
      JOIN schemes s ON a.scheme_id = s.scheme_id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

module.exports = router;