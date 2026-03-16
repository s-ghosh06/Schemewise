// ============================================================
// SCHEMEWISE — ML Routes (proxies to Python Flask on :5001)
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

const ML_URL = 'http://localhost:5001';

async function callML(endpoint, body) {
  const res = await fetch(`${ML_URL}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });
  return res.json();
}

// GET /api/ml/recommend/:id
router.get('/recommend/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM beneficiaries WHERE beneficiary_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'Beneficiary not found' });

    const b = rows[0];
    const [enrollments] = await db.query(
      'SELECT scheme_id FROM enrollments WHERE beneficiary_id = ?',
      [req.params.id]
    );
    const enrolled_scheme_ids = enrollments.map(e => e.scheme_id);

    const mlResult = await callML('/recommend', {
      beneficiary_id:     b.beneficiary_id,
      income:             b.income,
      beneficiary_type:   b.beneficiary_type,
      enrolled_scheme_ids
    });

    res.json({ ...mlResult, beneficiary: b });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ml/fraud
router.get('/fraud', async (req, res) => {
  try {
    const [beneficiaries] = await db.query('SELECT * FROM beneficiaries');
    const [enrollments]   = await db.query('SELECT beneficiary_id, scheme_id FROM enrollments');

    const mlResult = await callML('/fraud-detect', { beneficiaries, enrollments });
    res.json(mlResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ml/predict
router.post('/predict', async (req, res) => {
  try {
    const { income, beneficiary_type, scheme_id } = req.body;
    const mlResult = await callML('/predict-eligibility', { income, beneficiary_type, scheme_id });
    res.json(mlResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ml/predict-all
router.post('/predict-all', async (req, res) => {
  try {
    const { income, beneficiary_type } = req.body;
    const mlResult = await callML('/predict-all', { income, beneficiary_type });
    res.json(mlResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ml/health
router.get('/health', async (req, res) => {
  try {
    const r    = await fetch(`${ML_URL}/health`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ success: false, message: 'ML service offline' });
  }
});

module.exports = router;