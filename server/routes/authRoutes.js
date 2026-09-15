const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken, requireAuth } = require('../auth');

// Register endpoint
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, dob, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !dob || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required: Name, Email, Phone Number, Date of Birth, Password, and Confirm Password.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(cleanEmail, cleanPhone);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone number already exists.' });
    }

    const password_hash = hashPassword(password);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, dob, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(cleanName, cleanEmail, cleanPhone, dob, password_hash);
    const newUser = db.prepare('SELECT id, name, email, phone, dob, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully. Welcome to your Private Memory Vault.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

// Login endpoint (accepts email or phone number, along with name and password)
router.post('/login', (req, res) => {
  try {
    const { identifier, name, password } = req.body;

    if (!identifier || !name || !password) {
      return res.status(400).json({ error: 'Please provide your Email or Phone Number, Name, and Password.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanName = name.trim().toLowerCase();

    // Query by email OR phone
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR phone = ?)
    `).get(cleanIdentifier, identifier.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Name verification (case-insensitive)
    if (user.name.toLowerCase() !== cleanName) {
      return res.status(401).json({ error: 'Account name does not match the credentials provided.' });
    }

    // Password verification
    const isValid = comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Access denied.' });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      created_at: user.created_at
    };

    return res.json({
      message: 'Access granted to Private Vault.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Current user profile
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, dob, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

module.exports = router;
