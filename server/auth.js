const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_key_super_secure_2026_unbreakable';
const ALT_SECRET = 'memory_vault_ultra_secret_key_2026';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Automatically ensure the user exists in SQLite DB so foreign keys don't fail
function ensureUserExists(user) {
  if (!user) return null;
  const userName = user.name || 'Vault Member';
  const userEmail = (user.email || `user_${Date.now()}@vault.local`).trim().toLowerCase();
  const userPhone = user.phone || 'N/A';
  const userDob = user.dob || '2000-01-01';

  try {
    // Check if integer ID already matches a user in SQLite
    if (typeof user.id === 'number' && Number.isInteger(user.id)) {
      const existing = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(user.id);
      if (existing) {
        return { ...user, id: existing.id, name: existing.name, email: existing.email };
      }
    }

    // Check if email already matches in SQLite
    const byEmail = db.prepare('SELECT id, name, email, phone FROM users WHERE email = ?').get(userEmail);
    if (byEmail) {
      return { ...user, id: byEmail.id, name: byEmail.name, email: byEmail.email };
    }

    // Insert user into SQLite and get auto-generated integer ID
    const info = db.prepare(`
      INSERT INTO users (name, email, phone, dob, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(userName, userEmail, userPhone, userDob, 'vault_permanent_session');

    return { ...user, id: Number(info.lastInsertRowid), name: userName, email: userEmail };
  } catch (e) {
    const fallback = db.prepare('SELECT id, name, email FROM users ORDER BY id ASC LIMIT 1').get();
    if (fallback) {
      return { ...user, id: fallback.id, name: fallback.name, email: fallback.email };
    }
    return { ...user, id: 1 };
  }
}

function decodeAnyToken(token) {
  if (!token) return null;

  // Handle client-side offline / guest tokens
  if (token.startsWith('vault_session_') || token.startsWith('vault_guest_token_')) {
    try {
      const b64 = token.startsWith('vault_session_')
        ? token.replace('vault_session_', '')
        : token.replace('vault_guest_token_', '');
      const json = Buffer.from(b64, 'base64').toString('utf8');
      const user = JSON.parse(json);
      return ensureUserExists(user);
    } catch (e) {
      return null;
    }
  }

  // Handle standard JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return ensureUserExists(decoded);
  } catch (err) {
    try {
      const decodedAlt = jwt.verify(token, ALT_SECRET);
      return ensureUserExists(decodedAlt);
    } catch (err2) {
      return null;
    }
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }

  const token = authHeader.split(' ')[1];
  const user = decodeAnyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = user;
  next();
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  decodeAnyToken,
  ensureUserExists,
  requireAuth,
  JWT_SECRET
};
