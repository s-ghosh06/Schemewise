// ============================================================
// SCHEMEWISE — Auth Routes
// POST /api/auth/login
// ============================================================

const express = require('express');
const router  = express.Router();
const bcrypt = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'schemewise_secret_key_2024';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const passwordMatch = (password === user.password);
if (!passwordMatch) {
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
}

    // Create JWT token
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log audit
    await db.execute(
      'INSERT INTO audit_logs (action_description, user_id) VALUES (?, ?)',
      [`User login: ${username}`, user.user_id]
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;