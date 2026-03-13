// ============================================================
// SCHEMEWISE — Dashboard Stats Route
// GET /api/dashboard/stats
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [[{ total_beneficiaries }]] = await db.execute(
      'SELECT COUNT(*) AS total_beneficiaries FROM beneficiaries'
    );
    const [[{ active_schemes }]] = await db.execute(
      'SELECT COUNT(*) AS active_schemes FROM schemes WHERE is_active = 1'
    );
    const [[{ duplicate_alerts }]] = await db.execute(
      "SELECT COUNT(*) AS duplicate_alerts FROM alerts WHERE alert_type = 'duplicate_enrollment'"
    );
    const [[{ total_enrollments }]] = await db.execute(
      "SELECT COUNT(*) AS total_enrollments FROM enrollments WHERE status = 'active'"
    );
    const [[{ total_alerts }]] = await db.execute(
      'SELECT COUNT(*) AS total_alerts FROM alerts'
    );
    const [[{ compliance_issues }]] = await db.execute(
      "SELECT COUNT(*) AS compliance_issues FROM alerts WHERE alert_type IN ('income_mismatch','eligibility_failure')"
    );

    res.json({
      success: true,
      data: {
        total_beneficiaries,
        active_schemes,
        duplicate_alerts,
        total_enrollments,
        total_alerts,
        compliance_issues,
        system_status: 'Operational'
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;