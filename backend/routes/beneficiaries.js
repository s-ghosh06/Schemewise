// ============================================================
// SCHEMEWISE — Beneficiaries Routes
// GET  /api/beneficiaries/all
// POST /api/beneficiaries/add
// POST /api/beneficiaries/enroll
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET all beneficiaries ────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        b.*,
        COUNT(e.enrollment_id) AS enrollment_count
      FROM beneficiaries b
      LEFT JOIN enrollments e ON b.beneficiary_id = e.beneficiary_id
      GROUP BY b.beneficiary_id
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching beneficiaries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch beneficiaries' });
  }
});

// ── POST add beneficiary ─────────────────────────────────────
router.post('/add', async (req, res) => {
  const { full_name, aadhaar_number, income, beneficiary_type } = req.body;

  if (!full_name || !aadhaar_number) {
    return res.status(400).json({ success: false, message: 'Name and Aadhaar number are required' });
  }

  // Validate Aadhaar: 12 digits
  if (!/^\d{12}$/.test(aadhaar_number)) {
    return res.status(400).json({ success: false, message: 'Aadhaar number must be exactly 12 digits' });
  }

  try {
    // Check for duplicate Aadhaar
    const [existing] = await db.execute(
      'SELECT beneficiary_id FROM beneficiaries WHERE aadhaar_number = ?',
      [aadhaar_number]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Beneficiary with this Aadhaar number already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO beneficiaries (full_name, aadhaar_number, income, beneficiary_type) VALUES (?, ?, ?, ?)',
      [full_name, aadhaar_number, income || 0, beneficiary_type || 'BPL']
    );

    // Audit log
    await db.execute(
      'INSERT INTO audit_logs (action_description) VALUES (?)',
      [`Beneficiary added: ${full_name} (Aadhaar: ${aadhaar_number})`]
    );

    res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      beneficiary_id: result.insertId
    });

  } catch (err) {
    console.error('Error adding beneficiary:', err);
    res.status(500).json({ success: false, message: 'Failed to add beneficiary' });
  }
});

// ── POST enroll beneficiary into scheme ──────────────────────
router.post('/enroll', async (req, res) => {
  const { beneficiary_id, scheme_id } = req.body;

  if (!beneficiary_id || !scheme_id) {
    return res.status(400).json({ success: false, message: 'beneficiary_id and scheme_id are required' });
  }

  try {
    // Check if already enrolled
    const [existing] = await db.execute(
      'SELECT enrollment_id FROM enrollments WHERE beneficiary_id = ? AND scheme_id = ?',
      [beneficiary_id, scheme_id]
    );

    if (existing.length > 0) {
      // Generate duplicate alert
      await db.execute(
        'INSERT INTO alerts (beneficiary_id, scheme_id, alert_type) VALUES (?, ?, ?)',
        [beneficiary_id, scheme_id, 'duplicate_enrollment']
      );
      return res.status(409).json({ success: false, message: 'Beneficiary is already enrolled in this scheme. Alert generated.' });
    }

    // Validate beneficiary and scheme exist
    const [ben] = await db.execute('SELECT * FROM beneficiaries WHERE beneficiary_id = ?', [beneficiary_id]);
    const [sch] = await db.execute('SELECT * FROM schemes WHERE scheme_id = ? AND is_active = 1', [scheme_id]);

    if (ben.length === 0) return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    if (sch.length === 0) return res.status(404).json({ success: false, message: 'Scheme not found or inactive' });

    // Income mismatch check: BPL scheme with APL income > 150000
    if (ben[0].income > 150000 && ben[0].beneficiary_type === 'BPL') {
      await db.execute(
        'INSERT INTO alerts (beneficiary_id, scheme_id, alert_type) VALUES (?, ?, ?)',
        [beneficiary_id, scheme_id, 'income_mismatch']
      );
    }

    await db.execute(
      'INSERT INTO enrollments (beneficiary_id, scheme_id, enrollment_date) VALUES (?, ?, CURDATE())',
      [beneficiary_id, scheme_id]
    );

    // Audit log
    await db.execute(
      'INSERT INTO audit_logs (action_description) VALUES (?)',
      [`Enrollment: beneficiary_id=${beneficiary_id} enrolled in scheme_id=${scheme_id}`]
    );

    res.status(201).json({ success: true, message: 'Enrollment successful' });

  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ success: false, message: 'Enrollment failed' });
  }
});

module.exports = router;