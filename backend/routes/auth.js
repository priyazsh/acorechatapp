const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

function validateRegister({ name, email, password }) {
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  return errors;
}

function validateLogin({ email, password }) {
  const errors = [];
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  return errors;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const validationErrors = validateRegister({ name, email, password });
    if (validationErrors.length) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ errors: ['Email already registered'] });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashed]
    );

    const user = { id: result.insertId, name: name.trim() };
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: email.trim().toLowerCase() },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ['Server error'] });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const validationErrors = validateLogin({ email, password });
    if (validationErrors.length) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!rows.length) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const token = generateToken({ id: user.id, name: user.name });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        online_status: user.online_status,
        last_seen: user.last_seen,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ['Server error'] });
  }
});

module.exports = router;
