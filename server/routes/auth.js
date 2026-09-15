const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Generate and Send 6-digit OTP (Screen 4)
router.post('/send-otp', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Phone number or email is required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    db.prepare('DELETE FROM otps WHERE identifier = ?').run(cleanIdentifier);
    db.prepare(`
      INSERT INTO otps (identifier, code, expires_at, verified)
      VALUES (?, ?, ?, 0)
    `).run(cleanIdentifier, code, expiresAt);

    res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${identifier}.`,
      demoCode: code,
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
  }
});

// Verify 6-digit OTP (Screen 4)
router.post('/verify-otp', (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and OTP code are required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const record = db.prepare(`
      SELECT * FROM otps 
      WHERE identifier = ? AND code = ?
      ORDER BY id DESC LIMIT 1
    `).get(cleanIdentifier, cleanCode);

    if (!record) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    if (Date.now() > record.expires_at) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    db.prepare('UPDATE otps SET verified = 1 WHERE id = ?').run(record.id);

    res.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Register (Direct or with OTP)
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, dob, password, confirmPassword } = req.body;

    // Field validations
    if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email address is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ error: 'Phone number is required' });
    if (!dob || !dob.trim()) return res.status(400).json({ error: 'Date of birth is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    // Check existing email
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Check existing phone
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
    if (existingPhone) {
      return res.status(409).json({ error: 'An account with this phone number already exists' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, dob, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanName, cleanEmail, cleanPhone, dob, passwordHash);

    const userId = result.lastInsertRowid;

    const user = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      dob,
      hasVaultPin: false,
    };

    const token = jwt.sign({ id: userId, email: cleanEmail, name: cleanName }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to your Memory Vault.',
      token,
      user,
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { identifier, name, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or Phone number is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanName = name ? name.trim().toLowerCase() : null;

    // Look up by email or phone
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? OR phone = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email or phone number' });
    }

    // If name was provided, verify name matches
    if (cleanName && !user.name.toLowerCase().includes(cleanName) && !cleanName.includes(user.name.toLowerCase())) {
      return res.status(401).json({ error: 'Name does not match our records for this account' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        hasVaultPin: Boolean(user.vault_pin),
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user profile
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, dob, vault_pin, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      hasVaultPin: Boolean(user.vault_pin),
      createdAt: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile (Screen 17)
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, dob } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, phone = COALESCE(?, phone), dob = COALESCE(?, dob)
      WHERE id = ?
    `).run(name.trim(), phone?.trim() || null, dob || null, req.user.id);

    const updated = db.prepare('SELECT id, name, email, phone, dob, vault_pin FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        dob: updated.dob,
        hasVaultPin: Boolean(updated.vault_pin),
      }
    });
  } catch (err) {
    console.error('update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password (Screen 17)
router.post('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Vault PIN setup / verification
router.post('/vault-pin/set', requireAuth, (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: 'Vault PIN must be at least 4 digits' });
    }

    const pinHash = bcrypt.hashSync(pin.toString(), 8);
    db.prepare('UPDATE users SET vault_pin = ? WHERE id = ?').run(pinHash, req.user.id);

    res.json({ success: true, message: 'Vault Security PIN set successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to configure Vault PIN' });
  }
});

router.post('/vault-pin/verify', requireAuth, (req, res) => {
  try {
    const { pin } = req.body;
    const user = db.prepare('SELECT vault_pin FROM users WHERE id = ?').get(req.user.id);

    if (!user || !user.vault_pin) {
      return res.json({ success: true, unlocked: true });
    }

    const isValid = bcrypt.compareSync(pin.toString(), user.vault_pin);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect Vault PIN' });
    }

    res.json({ success: true, unlocked: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify Vault PIN' });
  }
});

module.exports = router;
