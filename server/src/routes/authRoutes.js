const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to generate JWT token (valid for 30 days)
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * POST /api/auth/register
 * Body: { name, email, phone, dob, password, confirmPassword }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, dob, password, confirmPassword } = req.body;

    // Validate presence of all required fields
    if (!name || !email || !phone || !dob || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields (Name, Email, Phone, Date of Birth, Password, Confirm Password) are required.' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    const existingUser = await get('SELECT id FROM users WHERE email = ? OR phone = ?', [trimmedEmail, trimmedPhone]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email or phone number already exists.' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into SQLite database
    const result = await run(
      `INSERT INTO users (name, email, phone, dob, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [trimmedName, trimmedEmail, trimmedPhone, dob, passwordHash]
    );

    const newUser = {
      id: result.id,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      dob: dob
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Registration successful. Welcome to your private Memory Vault.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { identifier (email or phone), name, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, name, password } = req.body;

    if (!identifier || !name || !password) {
      return res.status(400).json({ error: 'Identifier (Email or Phone), Name, and Password are all required.' });
    }

    const trimmedIdentifier = identifier.trim();
    const trimmedName = name.trim();

    // Query user by email OR phone number
    const user = await get(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?`,
      [trimmedIdentifier, trimmedIdentifier]
    );

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email or phone number.' });
    }

    // Verify Name matches account holder (case-insensitive)
    if (user.name.toLowerCase() !== trimmedName.toLowerCase()) {
      return res.status(401).json({ error: 'The provided name does not match the account record.' });
    }

    // Verify Password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      createdAt: user.created_at
    };

    const token = generateToken(safeUser);

    return res.json({
      message: 'Login successful. Welcome back.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile and vault statistics
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await get(
      `SELECT id, name, email, phone, dob, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch user statistics
    const stats = await get(`
      SELECT 
        (SELECT COUNT(*) FROM vault_items WHERE user_id = ? AND type = 'photo') as photoCount,
        (SELECT COUNT(*) FROM vault_items WHERE user_id = ? AND type = 'video') as videoCount,
        (SELECT COUNT(*) FROM diary_entries WHERE user_id = ?) as diaryCount
    `, [user.id, user.id, user.id]);

    return res.json({
      user,
      stats: {
        photos: stats.photoCount || 0,
        videos: stats.videoCount || 0,
        diaries: stats.diaryCount || 0
      }
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ error: 'Server error retrieving profile.' });
  }
});

module.exports = router;
