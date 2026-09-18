const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken, requireAuth } = require('../auth');

// Phone normalization helper
function normalizePhone(p) {
  if (!p) return '';
  return String(p).replace(/\D/g, '');
}

function phonesMatch(p1, p2) {
  if (!p1 || !p2) return false;
  const s1 = normalizePhone(p1);
  const s2 = normalizePhone(p2);
  if (!s1 || !s2) return false;
  if (s1 === s2) return true;
  // Match last 10 digits (e.g. +91 8653429085 matches 8653429085)
  if (s1.length >= 10 && s2.length >= 10) {
    return s1.slice(-10) === s2.slice(-10);
  }
  return false;
}

// Name matching helper (tolerant to case, spacing, punctuation, and first/full name)
function namesMatch(dbName, inputName) {
  if (!dbName || !inputName) return false;
  const n1 = String(dbName).trim().toLowerCase().replace(/[\.\,\_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const n2 = String(inputName).trim().toLowerCase().replace(/[\.\,\_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  const w1 = n1.split(' ').filter(Boolean);
  const w2 = n2.split(' ').filter(Boolean);
  return w1.some(w => w2.includes(w));
}

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

    // Check if user already exists by email or normalized phone
    const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const allUsers = db.prepare('SELECT id, phone FROM users').all();
    const existingPhone = allUsers.find(u => phonesMatch(u.phone, cleanPhone));
    if (existingPhone) {
      return res.status(400).json({ error: 'An account with this phone number already exists.' });
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
    const cleanName = name.trim();

    // 1. Look up user by exact email or phone
    let user = db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR phone = ?)
    `).get(cleanIdentifier, identifier.trim());

    // 2. If not found by exact string, search across all users using normalized phone matching
    if (!user) {
      const allUsers = db.prepare('SELECT * FROM users').all();
      user = allUsers.find(u => {
        return u.email.toLowerCase() === cleanIdentifier || phonesMatch(u.phone, identifier);
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email or phone number.' });
    }

    // Name verification (case, spacing, punctuation, and first-name tolerant)
    if (!namesMatch(user.name, cleanName)) {
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
