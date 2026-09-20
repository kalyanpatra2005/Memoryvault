const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_eternal_key_2026';

const FALLBACK_CLOUD_DB = 'postgresql://neondb_owner:npg_o5FQYERByN1t@ep-rapid-grass-b4mn4kxc-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool = null;
function getPool() {
  const conn = 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    FALLBACK_CLOUD_DB;
  if (!pool && conn) {
    try {
      pool = new Pool({
        connectionString: conn,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client:', err ? err.message : err);
      });
      console.log('✓ PostgreSQL pool connected to cloud database.');
    } catch (e) {
      console.error('Failed to create PostgreSQL pool:', e);
    }
  }
  return pool;
}
getPool();

// In-memory fallback if no database is connected yet
const memStore = {
  users: [],
  media: [],
  diaries: [],
  capsules: []
};

// Initialize Cloud Database Tables
let tablesInitialized = false;
async function initDb() {
  const p = getPool();
  if (!p || tablesInitialized) return;
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT DEFAULT '',
        dob TEXT DEFAULT '',
        password_hash TEXT NOT NULL,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        email TEXT,
        avatar_url TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT,
        title TEXT NOT NULL,
        description TEXT,
        memory_date DATE DEFAULT CURRENT_DATE,
        category TEXT DEFAULT 'Personal',
        location TEXT,
        tags TEXT[] DEFAULT '{}',
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS diary_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT,
        title TEXT,
        content TEXT NOT NULL,
        entry_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS time_capsules (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT,
        title TEXT NOT NULL,
        message TEXT,
        target_date TIMESTAMP WITH TIME ZONE NOT NULL,
        image_path TEXT,
        status TEXT DEFAULT 'locked',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        user_email TEXT,
        filename TEXT,
        original_name TEXT,
        media_type TEXT,
        mime_type TEXT,
        size_bytes BIGINT,
        caption TEXT,
        data_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        memory_id TEXT,
        diary_id TEXT,
        file_path TEXT,
        file_type TEXT,
        file_name TEXT
      );

      CREATE TABLE IF NOT EXISTS diaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_email TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT DEFAULT 'Nostalgia',
        image_url TEXT,
        weather TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS capsules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_email TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        media_urls TEXT,
        unlock_date TIMESTAMP NOT NULL,
        is_opened INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
      ALTER TABLE media ALTER COLUMN id DROP DEFAULT;
      ALTER TABLE media ALTER COLUMN id TYPE TEXT USING id::text;
      ALTER TABLE media ALTER COLUMN user_id TYPE TEXT USING user_id::text;
      ALTER TABLE media ALTER COLUMN filename DROP NOT NULL;
      ALTER TABLE media ALTER COLUMN original_name DROP NOT NULL;
      ALTER TABLE media ALTER COLUMN media_type DROP NOT NULL;
      ALTER TABLE media ALTER COLUMN mime_type DROP NOT NULL;
      ALTER TABLE media ALTER COLUMN size_bytes DROP NOT NULL;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS memory_id TEXT;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS diary_id TEXT;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS file_path TEXT;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS file_type TEXT;
      ALTER TABLE media ADD COLUMN IF NOT EXISTS file_name TEXT;
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS user_email TEXT;

      CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
      CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON time_capsules(user_id);
      CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
      CREATE INDEX IF NOT EXISTS idx_media_file_path ON media(file_path);
    `);
    tablesInitialized = true;
    console.log('✓ Cloud Database tables verified and synchronized.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for direct file uploads on Vercel Serverless
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB limit
});

// Middleware to ensure DB tables exist
app.use(async (req, res, next) => {
  if (getPool() && !tablesInitialized) {
    await initDb();
  }
  next();
});

// Auth Middleware
function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

// Helpers
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
  if (s1.length >= 10 && s2.length >= 10) {
    return s1.slice(-10) === s2.slice(-10);
  }
  return false;
}

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  const activePool = getPool();
  res.json({
    status: 'ok',
    service: 'Memory Vault Serverless Cloud Engine',
    hasDatabase: !!activePool,
    timestamp: new Date().toISOString()
  });
});

// ================= AUTH =================
const handleRegister = async (req, res) => {
  try {
    const { name, email, phone, dob, password, confirmPassword, options, fullName } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanName = (name || fullName || options?.data?.full_name || cleanEmail.split('@')[0] || 'Vault Keeper').trim();
    const cleanPhone = (phone || '').trim();
    const cleanDob = (dob || '').trim();
    const settings = options?.data?.settings || req.body.settings || {
      theme: 'dark',
      fontStyle: 'serif',
      memoryView: 'grid',
      autoLock: 'never',
      defaultCategory: 'Personal',
      soundEnabled: true
    };
    const hash = bcrypt.hashSync(password, 10);

    const activePool = getPool();
    if (activePool) {
      // Check existing email
      const exist = await activePool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (exist.rows.length > 0) {
        const existUser = exist.rows[0];
        const valid = bcrypt.compareSync(password, existUser.password_hash);
        if (valid) {
          const safe = {
            id: String(existUser.id),
            name: existUser.name,
            email: existUser.email,
            phone: existUser.phone,
            dob: existUser.dob,
            settings: existUser.settings || settings,
            user_metadata: {
              full_name: existUser.name,
              settings: existUser.settings || settings
            },
            created_at: existUser.created_at
          };
          const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
          return res.json({
            message: 'Welcome back! Vault unlocked.',
            token,
            access_token: token,
            user: safe,
            session: { access_token: token, token, user: safe }
          });
        }
        return res.status(400).json({ error: 'An account with this email already exists. Please log in with your master password.' });
      }

      // Check existing phone if phone was provided
      if (cleanPhone) {
        const allUsers = await activePool.query('SELECT id, phone FROM users WHERE phone IS NOT NULL AND phone != \'\'');
        const phoneExist = allUsers.rows.find(u => phonesMatch(u.phone, cleanPhone));
        if (phoneExist) {
          return res.status(400).json({ error: 'An account with this phone number already exists.' });
        }
      }

      const insert = await activePool.query(
        'INSERT INTO users (name, email, phone, dob, password_hash, settings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, dob, settings, created_at',
        [cleanName, cleanEmail, cleanPhone, cleanDob, hash, JSON.stringify(settings)]
      );
      const user = insert.rows[0];
      const userIdStr = String(user.id);

      // Also create/upsert profile in profiles table
      await activePool.query(
        `INSERT INTO profiles (id, full_name, email, settings) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, settings = EXCLUDED.settings`,
        [userIdStr, cleanName, cleanEmail, JSON.stringify(settings)]
      );

      const safe = {
        id: userIdStr,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        settings: user.settings || settings,
        user_metadata: {
          full_name: user.name,
          settings: user.settings || settings
        },
        created_at: user.created_at
      };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({
        message: 'Vault created in Cloud Database.',
        token,
        access_token: token,
        user: safe,
        session: { access_token: token, token, user: safe }
      });
    } else {
      // MemStore fallback
      const exist = memStore.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (exist) {
        const valid = bcrypt.compareSync(password, exist.password_hash);
        if (valid) {
          const safe = { ...exist, id: String(exist.id), user_metadata: { full_name: exist.name, settings: exist.settings || settings } };
          delete safe.password_hash;
          const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
          return res.json({ message: 'Welcome back! Vault unlocked.', token, access_token: token, user: safe, session: { access_token: token, token, user: safe } });
        }
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      const user = {
        id: String(Date.now()),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        dob: cleanDob,
        password_hash: hash,
        settings,
        created_at: new Date().toISOString()
      };
      memStore.users.push(user);
      const safe = { ...user, user_metadata: { full_name: user.name, settings } };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ message: 'Vault created.', token, access_token: token, user: safe, session: { access_token: token, token, user: safe } });
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};

router.post('/auth/register', handleRegister);
router.post('/auth/signup', handleRegister);

router.post('/auth/login', async (req, res) => {
  try {
    const rawInput = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const password = req.body.password;
    if (!rawInput || !password) {
      return res.status(400).json({ error: 'Email/Phone and Password are required.' });
    }
    const cleanEmail = rawInput.toLowerCase();
    const cleanPhone = rawInput.replace(/\D/g, '');
    const activePool = getPool();

    if (activePool) {
      let user = null;
      if (cleanEmail.includes('@')) {
        const q = await activePool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        user = q.rows[0];
      } else if (cleanPhone && cleanPhone.length >= 7) {
        const all = await activePool.query('SELECT * FROM users WHERE phone IS NOT NULL AND phone != \'\'');
        user = all.rows.find(u => phonesMatch(u.phone, cleanPhone));
      }
      if (!user) {
        const all = await activePool.query('SELECT * FROM users');
        user = all.rows.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || phonesMatch(u.phone, rawInput));
      }
      if (!user) {
        return res.status(401).json({ error: 'No account found with this email or phone number.' });
      }
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect master password.' });
      }

      // Fetch profile settings
      let userSettings = user.settings || {};
      const profQ = await activePool.query('SELECT settings FROM profiles WHERE id = $1', [String(user.id)]);
      if (profQ.rows.length > 0 && profQ.rows[0].settings) {
        userSettings = { ...userSettings, ...profQ.rows[0].settings };
      }

      const safe = {
        id: String(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        settings: userSettings,
        user_metadata: {
          full_name: user.name,
          settings: userSettings
        },
        created_at: user.created_at
      };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        message: 'Vault unlocked.',
        token,
        access_token: token,
        user: safe,
        session: { access_token: token, token, user: safe }
      });
    } else {
      const user = memStore.users.find(u => u.email.toLowerCase() === cleanEmail || phonesMatch(u.phone, rawInput));
      if (!user) {
        return res.status(401).json({ error: 'No account found with this email or phone number.' });
      }
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect master password.' });
      }
      const safe = { ...user, id: String(user.id), user_metadata: { full_name: user.name, settings: user.settings || {} } };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        message: 'Vault unlocked.',
        token,
        access_token: token,
        user: safe,
        session: { access_token: token, token, user: safe }
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

function phonesMatch(p1, p2) {
  if (!p1 || !p2) return false;
  const digits1 = String(p1).replace(/[^0-9]/g, '');
  const digits2 = String(p2).replace(/[^0-9]/g, '');
  if (!digits1 || !digits2) return false;
  if (digits1.length < 7 || digits2.length < 7) return false;
  return Boolean(digits1 === digits2 || digits1.endsWith(digits2) || digits2.endsWith(digits1));
}

function dobsMatch(d1, d2) {
  if (!d1 || !d2) return false;
  const s1 = String(d1).trim();
  const s2 = String(d2).trim();
  if (s1 === s2) return true;
  const digits1 = s1.replace(/[^0-9]/g, '');
  const digits2 = s2.replace(/[^0-9]/g, '');
  if (digits1 === digits2 && digits1.length >= 6) return true;
  const date1 = new Date(s1);
  const date2 = new Date(s2);
  if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  }
  return false;
}

router.post('/auth/reset-password', async (req, res) => {
  try {
    const { identifier, dob, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'Please enter your email and new password.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    const rawId = identifier.trim();
    const cleanEmail = rawId.toLowerCase();
    const newHash = bcrypt.hashSync(newPassword, 10);
    const activePool = getPool();

    if (activePool) {
      let user = null;
      if (cleanEmail.includes('@')) {
        const q = await activePool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        user = q.rows[0];
      }
      if (!user) {
        const all = await activePool.query('SELECT * FROM users');
        user = all.rows.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || phonesMatch(u.phone, rawId));
      }
      if (!user) return res.status(404).json({ error: 'No account found with this email address.' });
      
      // If the account has a registered Date of Birth, verify it
      if (user.dob && user.dob.trim()) {
        if (!dob || !dobsMatch(user.dob, dob)) {
          return res.status(401).json({ error: 'Date of Birth does not match the account records.' });
        }
      }

      await activePool.query('UPDATE users SET password_hash = $1 WHERE id = $2 OR LOWER(email) = $3', [newHash, user.id, cleanEmail]);
      const safe = { id: String(user.id), name: user.name, email: user.email, phone: user.phone, dob: user.dob };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ 
        message: 'Password reset successfully.', 
        token, 
        access_token: token,
        user: safe, 
        session: { access_token: token, token, user: safe } 
      });
    } else {
      const user = memStore.users.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || phonesMatch(u.phone, rawId));
      if (!user) return res.status(404).json({ error: 'No account found with this email address.' });
      if (user.dob && user.dob.trim()) {
        if (!dob || !dobsMatch(user.dob, dob)) {
          return res.status(401).json({ error: 'Date of Birth does not match the account records.' });
        }
      }
      user.password_hash = newHash;
      const safe = { ...user, id: String(user.id) };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ 
        message: 'Password reset successfully.', 
        token, 
        access_token: token,
        user: safe, 
        session: { access_token: token, token, user: safe } 
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/auth/update-user', requireAuth, async (req, res) => {
  try {
    const { password, data } = req.body;
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        await activePool.query('UPDATE users SET password_hash = $1 WHERE id = $2 OR LOWER(email) = $3', [hash, userId, userEmail]);
      }
      if (data?.settings) {
        await activePool.query(
          'UPDATE users SET settings = $1 WHERE id = $2 OR LOWER(email) = $3',
          [JSON.stringify(data.settings), userId, userEmail]
        );
        await activePool.query(
          `INSERT INTO profiles (id, email, settings) VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP`,
          [userId, userEmail, JSON.stringify(data.settings)]
        );
      }
      if (data?.full_name) {
        await activePool.query('UPDATE users SET name = $1 WHERE id = $2 OR LOWER(email) = $3', [data.full_name, userId, userEmail]);
        await activePool.query(
          `INSERT INTO profiles (id, full_name, email) VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = CURRENT_TIMESTAMP`,
          [userId, data.full_name, userEmail]
        );
      }

      const q = await activePool.query('SELECT id, name, email, phone, dob, settings, created_at FROM users WHERE id = $1 OR LOWER(email) = $2', [userId, userEmail]);
      const user = q.rows[0];
      const safe = {
        id: String(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        settings: user.settings || {},
        user_metadata: {
          full_name: user.name,
          settings: user.settings || {}
        },
        created_at: user.created_at
      };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ data: { user: safe }, user: safe, token });
    } else {
      const user = memStore.users.find(u => String(u.id) === userId || (u.email && u.email.toLowerCase() === userEmail));
      if (user) {
        if (password) user.password_hash = bcrypt.hashSync(password, 10);
        if (data?.settings) user.settings = { ...(user.settings || {}), ...data.settings };
        if (data?.full_name) user.name = data.full_name;
      }
      const safe = { ...user, id: String(user?.id), user_metadata: { full_name: user?.name, settings: user?.settings || {} } };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ data: { user: safe }, user: safe, token });
    }
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const handleGetMe = async (req, res) => {
  try {
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();
    if (activePool) {
      const q = await activePool.query(
        'SELECT id, name, email, phone, dob, settings, created_at FROM users WHERE id = $1 OR (email IS NOT NULL AND LOWER(email) = $2)',
        [userId, userEmail]
      );
      if (q.rows.length > 0) {
        const u = q.rows[0];
        // Fetch profile settings if available
        let finalSettings = u.settings || {};
        const profQ = await activePool.query('SELECT settings FROM profiles WHERE id = $1', [String(u.id)]);
        if (profQ.rows.length > 0 && profQ.rows[0].settings) {
          finalSettings = { ...finalSettings, ...profQ.rows[0].settings };
        }
        const safe = {
          id: String(u.id),
          name: u.name,
          email: u.email,
          phone: u.phone,
          dob: u.dob,
          settings: finalSettings,
          user_metadata: {
            full_name: u.name,
            settings: finalSettings
          },
          created_at: u.created_at
        };
        return res.json({ user: safe, data: { user: safe } });
      }
    }

    let user = memStore.users.find(u => String(u.id) === userId || (u.email && u.email.toLowerCase() === userEmail));
    if (!user) {
      user = {
        id: userId,
        name: req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'Honored Keeper'),
        email: req.user.email || 'user@memoryvault.local',
        phone: req.user.phone || '',
        settings: {},
        created_at: new Date().toISOString()
      };
      memStore.users.push(user);
    }
    const safe = {
      ...user,
      id: String(user.id),
      user_metadata: {
        full_name: user.name,
        settings: user.settings || {}
      }
    };
    delete safe.password_hash;
    return res.json({ user: safe, data: { user: safe } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.get('/auth/me', requireAuth, handleGetMe);
router.get('/auth/user', requireAuth, handleGetMe);

// ================= CLOUD POSTGREST-COMPATIBLE DATABASE API =================
const ALLOWED_DB_TABLES = [
  'memories',
  'diary_entries',
  'media',
  'time_capsules',
  'profiles',
  'diaries',
  'capsules'
];

const VALID_COLUMNS = {
  memories: ['id', 'user_id', 'user_email', 'title', 'description', 'memory_date', 'category', 'location', 'tags', 'is_favorite', 'created_at', 'updated_at'],
  diary_entries: ['id', 'user_id', 'user_email', 'title', 'content', 'entry_date', 'created_at', 'updated_at'],
  media: ['id', 'user_id', 'user_email', 'memory_id', 'diary_id', 'file_path', 'file_type', 'file_name', 'filename', 'original_name', 'media_type', 'mime_type', 'size_bytes', 'caption', 'data_url', 'created_at'],
  time_capsules: ['id', 'user_id', 'user_email', 'title', 'message', 'target_date', 'image_path', 'status', 'created_at', 'updated_at'],
  profiles: ['id', 'full_name', 'email', 'avatar_url', 'settings', 'created_at', 'updated_at'],
  diaries: ['id', 'user_id', 'user_email', 'title', 'content', 'mood', 'image_url', 'weather', 'created_at', 'updated_at'],
  capsules: ['id', 'user_id', 'user_email', 'title', 'message', 'media_urls', 'unlock_date', 'is_opened', 'created_at']
};

router.get('/db/:table', requireAuth, async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_DB_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid or restricted table: ' + table });
  }

  try {
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();

    // RLS User Isolation Clause
    let whereClauses = [];
    let params = [];

    if (table === 'profiles') {
      params.push(userId);
      whereClauses.push(`id = $${params.length}`);
    } else {
      params.push(userId);
      const p1 = params.length;
      params.push(userEmail);
      const p2 = params.length;
      whereClauses.push(`(user_id = $${p1} OR (user_email IS NOT NULL AND LOWER(user_email) = $${p2}))`);
    }

    // Parse eq_* filters
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('eq_')) {
        const col = key.substring(3);
        const validCols = VALID_COLUMNS[table] || [];
        if (validCols.includes(col)) {
          // If the filter is user_id or user_email, it is already enforced by the isolation clause
          if (col !== 'user_id' && col !== 'user_email') {
            params.push(req.query[key]);
            whereClauses.push(`${col} = $${params.length}`);
          }
        }
      }
    }

    let sql = `SELECT * FROM ${table}`;
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Order By
    const orderBy = req.query.order_by;
    const validCols = VALID_COLUMNS[table] || [];
    if (orderBy && validCols.includes(orderBy)) {
      const orderAsc = req.query.order_asc === 'true' || req.query.order_asc === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${orderBy} ${orderAsc}`;
    } else if (validCols.includes('created_at')) {
      sql += ' ORDER BY created_at DESC';
    }

    // Limit
    const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 1000);
    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    if (activePool) {
      const result = await activePool.query(sql, params);
      return res.json({ data: result.rows, error: null });
    } else {
      return res.json({ data: [], error: null });
    }
  } catch (err) {
    console.error(`Error querying /db/${table}:`, err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

router.post('/db/:table', requireAuth, async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_DB_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid or restricted table: ' + table });
  }

  try {
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const validCols = VALID_COLUMNS[table] || [];

    const insertedRows = [];

    if (activePool) {
      for (const raw of records) {
        const item = { ...raw };
        if (table === 'profiles') {
          if (!item.id) item.id = userId;
          item.email = item.email || userEmail;
        } else {
          item.user_id = userId;
          item.user_email = userEmail;
          if (!item.id) {
            item.id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
          }
        }

        if (table === 'media') {
          item.filename = item.filename || item.file_name || 'media';
          item.file_name = item.file_name || item.filename || 'media';
          item.original_name = item.original_name || item.file_name || 'media';
          item.media_type = item.media_type || item.file_type || 'photo';
          item.file_type = item.file_type || item.media_type || 'photo';

          if (item.file_path) {
            const existingMedia = await activePool.query(
              "SELECT * FROM media WHERE file_path = $1 ORDER BY (CASE WHEN data_url IS NOT NULL AND data_url != '' THEN 1 ELSE 0 END) DESC LIMIT 1",
              [item.file_path]
            );
            if (existingMedia.rows.length > 0) {
              const existingRow = existingMedia.rows[0];
              if (!item.data_url && existingRow.data_url) {
                item.data_url = existingRow.data_url;
              }
              if (item.memory_id && !existingRow.memory_id) {
                await activePool.query('UPDATE media SET memory_id = $1 WHERE id = $2', [item.memory_id, existingRow.id]);
              }
              if (item.diary_id && !existingRow.diary_id) {
                await activePool.query('UPDATE media SET diary_id = $1 WHERE id = $2', [item.diary_id, existingRow.id]);
              }
            }
          }
        }

        const keys = Object.keys(item).filter(k => validCols.includes(k) && item[k] !== undefined);
        if (keys.length === 0) continue;

        const placeholders = keys.map((_, idx) => `$${idx + 1}`);
        const values = keys.map(k => item[k]);

        // Support ON CONFLICT for id
        const nonIdKeys = keys.filter(k => k !== 'id');
        let onConflict = 'ON CONFLICT (id) DO NOTHING';
        if (nonIdKeys.length > 0) {
          const updateSet = nonIdKeys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
          onConflict = `ON CONFLICT (id) DO UPDATE SET ${updateSet}`;
        }

        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) ${onConflict} RETURNING *`;
        const q = await activePool.query(sql, values);
        if (q.rows.length > 0) {
          insertedRows.push(q.rows[0]);
        } else {
          insertedRows.push(item);
        }
      }
      return res.status(201).json({ data: insertedRows, error: null });
    } else {
      return res.status(201).json({ data: records, error: null });
    }
  } catch (err) {
    console.error(`Error inserting into /db/${table}:`, err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

router.put('/db/:table', requireAuth, async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_DB_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid or restricted table: ' + table });
  }

  try {
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();
    const updates = req.body;
    const validCols = VALID_COLUMNS[table] || [];

    const targetId = req.query.eq_id || req.query.id;
    if (!targetId && table !== 'profiles') {
      return res.status(400).json({ error: 'Record ID required for update' });
    }

    const keys = Object.keys(updates).filter(k => validCols.includes(k) && k !== 'id' && k !== 'user_id' && updates[k] !== undefined);
    if (keys.length === 0) {
      return res.json({ data: [], error: null });
    }

    const setClauses = [];
    const values = [];

    keys.forEach(k => {
      values.push(updates[k]);
      setClauses.push(`${k} = $${values.length}`);
    });

    if (validCols.includes('updated_at') && !keys.includes('updated_at')) {
      setClauses.push('updated_at = CURRENT_TIMESTAMP');
    }

    let whereSql = '';
    if (table === 'profiles') {
      values.push(userId);
      whereSql = `id = $${values.length}`;
    } else {
      values.push(targetId);
      const pId = values.length;
      values.push(userId);
      const pUser = values.length;
      values.push(userEmail);
      const pEmail = values.length;
      whereSql = `id = $${pId} AND (user_id = $${pUser} OR (user_email IS NOT NULL AND LOWER(user_email) = $${pEmail}))`;
    }

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereSql} RETURNING *`;
    if (activePool) {
      const q = await activePool.query(sql, values);
      return res.json({ data: q.rows, error: null });
    } else {
      return res.json({ data: [updates], error: null });
    }
  } catch (err) {
    console.error(`Error updating /db/${table}:`, err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

router.delete('/db/:table', requireAuth, async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_DB_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid or restricted table: ' + table });
  }

  try {
    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();
    const validCols = VALID_COLUMNS[table] || [];

    const whereClauses = [];
    const params = [];

    // Ownership check
    params.push(userId);
    const p1 = params.length;
    params.push(userEmail);
    const p2 = params.length;
    whereClauses.push(`(user_id = $${p1} OR (user_email IS NOT NULL AND LOWER(user_email) = $${p2}))`);

    for (const key of Object.keys(req.query)) {
      if (key.startsWith('eq_')) {
        const col = key.substring(3);
        if (validCols.includes(col)) {
          params.push(req.query[key]);
          whereClauses.push(`${col} = $${params.length}`);
        }
      }
    }

    if (whereClauses.length <= 1 && !req.query.id && !req.query.eq_id) {
      return res.status(400).json({ error: 'Specific filter required for deletion.' });
    }

    const sql = `DELETE FROM ${table} WHERE ` + whereClauses.join(' AND ');
    if (activePool) {
      await activePool.query(sql, params);
      return res.json({ data: true, error: null });
    } else {
      return res.json({ data: true, error: null });
    }
  } catch (err) {
    console.error(`Error deleting from /db/${table}:`, err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ================= CLOUD STORAGE API =================
router.post('/storage/upload', requireAuth, async (req, res) => {
  try {
    const { path, data_url, file_name, mime_type, size_bytes, file_type, memory_id, diary_id } = req.body;
    if (!path || !data_url) {
      return res.status(400).json({ error: 'Path and data_url required' });
    }

    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').trim().toLowerCase();

    // Verify user path isolation
    let cleanPath = path;
    if (!cleanPath.startsWith(userId + '/')) {
      cleanPath = `${userId}/${cleanPath}`;
    }

    const activePool = getPool();
    const mediaId = 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    if (activePool) {
      const existing = await activePool.query(
        'SELECT id FROM media WHERE file_path = $1 LIMIT 1',
        [cleanPath]
      );
      if (existing.rows.length > 0) {
        await activePool.query(
          `UPDATE media SET 
             data_url = $1, 
             file_name = COALESCE($2, file_name), 
             filename = COALESCE($2, filename), 
             mime_type = COALESCE($3, mime_type), 
             size_bytes = COALESCE($4, size_bytes),
             memory_id = COALESCE($5, memory_id),
             diary_id = COALESCE($6, diary_id)
           WHERE id = $7`,
          [data_url, file_name, mime_type, size_bytes, memory_id || null, diary_id || null, existing.rows[0].id]
        );
        return res.status(201).json({ data: { path: cleanPath, id: existing.rows[0].id }, error: null });
      }

      await activePool.query(
        `INSERT INTO media (id, user_id, user_email, file_path, file_name, filename, original_name, mime_type, size_bytes, media_type, file_type, data_url, memory_id, diary_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          mediaId,
          userId,
          userEmail,
          cleanPath,
          file_name || 'media',
          file_name || 'media',
          file_name || 'media',
          mime_type || 'image/jpeg',
          size_bytes || 0,
          file_type || 'photo',
          file_type || 'photo',
          data_url,
          memory_id || null,
          diary_id || null
        ]
      );
      return res.status(201).json({ data: { path: cleanPath, id: mediaId }, error: null });
    } else {
      return res.status(201).json({ data: { path: cleanPath, id: mediaId }, error: null });
    }
  } catch (err) {
    console.error('Storage upload error:', err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
});

router.get('/storage/signed-url', requireAuth, async (req, res) => {
  try {
    const path = req.query.path;
    if (!path) return res.status(400).json({ error: 'Path required' });

    const expiresIn = Number(req.query.expiresIn) || 3600;
    const signedToken = jwt.sign(
      {
        userId: String(req.user.id),
        email: req.user.email,
        path,
        storage: true
      },
      JWT_SECRET,
      { expiresIn: `${expiresIn}s` }
    );

    const signedUrl = `/api/storage/file?path=${encodeURIComponent(path)}&token=${signedToken}`;
    return res.json({ data: { signedUrl }, error: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const handleStorageFile = async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).send('Unauthorized: Token required');
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).send('Invalid or expired token');
    }

    let filePath = req.query.path || (req.params.encodedPath ? decodeURIComponent(req.params.encodedPath) : '');
    if (!filePath) {
      return res.status(400).send('File path required');
    }

    const activePool = getPool();
    if (!activePool) {
      return res.status(404).send('Database connection unavailable');
    }

    const q = await activePool.query(
      `SELECT * FROM media 
       WHERE file_path = $1 OR file_name = $1 OR original_name = $1 
       ORDER BY (CASE WHEN data_url IS NOT NULL AND data_url != '' THEN 1 ELSE 0 END) DESC, id DESC 
       LIMIT 1`,
      [filePath]
    );

    const item = q.rows[0];
    if (!item) {
      return res.status(404).send('Media file not found');
    }

    // Strict Ownership & Isolation Check
    const tokenUserId = String(decodedUser.userId || decodedUser.id);
    const tokenUserEmail = (decodedUser.email || '').toLowerCase();
    const itemUserId = String(item.user_id);
    const itemEmail = (item.user_email || '').toLowerCase();

    const isOwner =
      itemUserId === tokenUserId ||
      (itemEmail && tokenUserEmail && itemEmail === tokenUserEmail) ||
      filePath.startsWith(`${tokenUserId}/`);

    if (!isOwner) {
      return res.status(403).send('Forbidden: Not your memory');
    }

    if (item.data_url && item.data_url.startsWith('data:')) {
      const matches = item.data_url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': buffer.length,
          'Cache-Control': 'private, max-age=86400'
        });
        return res.end(buffer);
      }
      return res.redirect(item.data_url);
    }

    return res.status(404).send('Media binary data not found');
  } catch (err) {
    console.error('Storage file serve error:', err);
    return res.status(500).send('Error retrieving media file');
  }
};

router.get('/storage/file', handleStorageFile);
router.get('/storage/file/:encodedPath', handleStorageFile);

router.post('/storage/remove', requireAuth, async (req, res) => {
  try {
    const { paths } = req.body;
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.json({ data: true, error: null });
    }

    const activePool = getPool();
    const userId = String(req.user.id);
    const userEmail = (req.user.email || '').toLowerCase();

    if (activePool) {
      await activePool.query(
        `DELETE FROM media WHERE file_path = ANY($1) AND (user_id = $2 OR (user_email IS NOT NULL AND LOWER(user_email) = $3))`,
        [paths, userId, userEmail]
      );
    }
    return res.json({ data: true, error: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= USER SETTINGS PERMANENT STORAGE =================
router.get('/user/settings', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userEmail = (req.user.email || '').trim().toLowerCase();
    if (activePool) {
      const q = await activePool.query(
        'SELECT settings FROM users WHERE id = $1 OR (email IS NOT NULL AND LOWER(email) = $2)',
        [req.user.id || 0, userEmail]
      );
      if (q.rows.length > 0) {
        return res.json({ settings: q.rows[0].settings || {} });
      }
    }
    const memUser = memStore.users.find(u => u.id === req.user.id || (u.email && u.email.toLowerCase() === userEmail));
    return res.json({ settings: memUser?.settings || {} });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/user/settings', requireAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }
    const activePool = getPool();
    const userEmail = (req.user.email || '').trim().toLowerCase();
    if (activePool) {
      await activePool.query(
        'UPDATE users SET settings = $1 WHERE id = $2 OR (email IS NOT NULL AND LOWER(email) = $3)',
        [JSON.stringify(settings), req.user.id || 0, userEmail]
      );
      return res.json({ success: true, settings });
    }
    const memUser = memStore.users.find(u => u.id === req.user.id || (u.email && u.email.toLowerCase() === userEmail));
    if (memUser) {
      memUser.settings = { ...(memUser.settings || {}), ...settings };
    }
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= MEDIA (PHOTOS & VIDEOS) =================
router.get('/media', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();
    let rows = [];

    if (activePool) {
      const q = await activePool.query(
        'SELECT * FROM media WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) ORDER BY created_at DESC',
        [userId, userEmail]
      );
      rows = q.rows;
    } else {
      rows = memStore.media.filter(m => m.user_id === req.user.id || (m.user_email && m.user_email.toLowerCase() === userEmail));
    }

    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
    const items = rows.map(item => ({
      ...item,
      media_url: item.data_url || `/api/media/stream/${item.id}?token=${token}`
    }));

    return res.json({ media: items, items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload media: Supports multipart FormData ('files') and JSON ({ data_url })
router.post('/media/upload', requireAuth, upload.array('files', 15), async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();
    const insertedMedia = [];

    // 1. If uploaded via multipart FormData with files
    if (req.files && req.files.length > 0) {
      const caption = req.body.caption || '';
      for (const file of req.files) {
        const isVideo = file.mimetype.toLowerCase().startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)/i.test(file.originalname);
        const mediaType = isVideo ? 'video' : 'photo';
        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const filename = Date.now() + '_' + file.originalname;

        if (activePool) {
          const exist = await activePool.query(
            'SELECT * FROM media WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) AND (original_name = $3 OR filename = $3) AND size_bytes = $4',
            [userId, userEmail, file.originalname, file.size]
          );
          if (exist.rows.length > 0) {
            insertedMedia.push(exist.rows[0]);
            continue;
          }

          const q = await activePool.query(
            'INSERT INTO media (user_id, user_email, filename, original_name, media_type, mime_type, size_bytes, caption, data_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [userId, userEmail, filename, file.originalname, mediaType, file.mimetype, file.size, caption, dataUrl]
          );
          insertedMedia.push(q.rows[0]);
        } else {
          const exist = memStore.media.find(
            m => (m.user_id === req.user.id || (m.user_email && m.user_email.toLowerCase() === userEmail)) &&
                 (m.original_name === file.originalname || m.filename === file.originalname) &&
                 m.size_bytes === file.size
          );
          if (exist) {
            insertedMedia.push(exist);
            continue;
          }

          const item = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user_id: req.user.id,
            user_email: userEmail,
            filename,
            original_name: file.originalname,
            media_type: mediaType,
            mime_type: file.mimetype,
            size_bytes: file.size,
            caption,
            data_url: dataUrl,
            created_at: new Date().toISOString()
          };
          memStore.media.push(item);
          insertedMedia.push(item);
        }
      }

      return res.status(201).json({
        message: `${insertedMedia.length} memory item(s) permanently vaulted.`,
        media: insertedMedia,
        item: insertedMedia[0]
      });
    }

    // 2. If uploaded via JSON body
    const { original_name, media_type, mime_type, size_bytes, caption, data_url } = req.body;
    const filename = Date.now() + '_' + (original_name || 'vault_media');

    if (activePool) {
      const exist = await activePool.query(
        'SELECT * FROM media WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) AND (original_name = $3 OR filename = $3) AND size_bytes = $4',
        [userId, userEmail, original_name || '', size_bytes || 0]
      );
      if (exist.rows.length > 0) {
        return res.json({ message: 'Media already vaulted.', item: exist.rows[0], media: [exist.rows[0]] });
      }

      const q = await activePool.query(
        'INSERT INTO media (user_id, user_email, filename, original_name, media_type, mime_type, size_bytes, caption, data_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [userId, userEmail, filename, original_name || filename, media_type || 'photo', mime_type || 'image/jpeg', size_bytes || 0, caption || '', data_url || '']
      );
      return res.status(201).json({ message: 'Media saved in cloud vault.', item: q.rows[0], media: [q.rows[0]] });
    } else {
      const exist = memStore.media.find(
        m => (m.user_id === req.user.id || (m.user_email && m.user_email.toLowerCase() === userEmail)) &&
             (m.original_name === (original_name || filename)) &&
             m.size_bytes === (size_bytes || 0)
      );
      if (exist) {
        return res.json({ message: 'Media already vaulted.', item: exist, media: [exist] });
      }

      const item = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        user_id: req.user.id,
        user_email: userEmail,
        filename,
        original_name: original_name || filename,
        media_type: media_type || 'photo',
        mime_type: mime_type || 'image/jpeg',
        size_bytes: size_bytes || 0,
        caption: caption || '',
        data_url: data_url || '',
        created_at: new Date().toISOString()
      };
      memStore.media.push(item);
      return res.status(201).json({ message: 'Media saved.', item, media: [item] });
    }
  } catch (err) {
    console.error('Media upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Binary streaming endpoint
router.get('/media/stream/:id', async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).send('Unauthorized');
    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).send('Invalid session token');
    }

    const activePool = getPool();
    let item = null;
    if (activePool) {
      const q = await activePool.query('SELECT * FROM media WHERE id = $1', [req.params.id]);
      item = q.rows[0];
    } else {
      item = memStore.media.find(m => m.id == req.params.id);
    }

    if (!item) return res.status(404).send('Media not found');
    const matchesUserOwner = 
      item.user_id === user.id || 
      (item.user_email && user.email && item.user_email.toLowerCase() === user.email.toLowerCase());

    if (!matchesUserOwner) return res.status(403).send('Forbidden: Not your memory');

    if (item.data_url && item.data_url.startsWith('data:')) {
      const matches = item.data_url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': buffer.length,
          'Cache-Control': 'private, max-age=86400'
        });
        return res.end(buffer);
      }
      return res.redirect(item.data_url);
    }

    return res.status(404).send('Media data not available');
  } catch (err) {
    return res.status(500).send('Stream error');
  }
});

router.delete('/media/:id', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      await activePool.query(
        'DELETE FROM media WHERE id = $1 AND (user_id = $2 OR (user_email IS NOT NULL AND LOWER(user_email) = $3))',
        [req.params.id, userId, userEmail]
      );
    } else {
      memStore.media = memStore.media.filter(
        m => !(m.id == req.params.id && (m.user_id === req.user.id || (m.user_email && m.user_email.toLowerCase() === userEmail)))
      );
    }
    return res.json({ message: 'Media deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= DIARIES =================
router.get('/diary', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const q = await activePool.query(
        'SELECT * FROM diaries WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) ORDER BY created_at DESC',
        [userId, userEmail]
      );
      return res.json({ entries: q.rows });
    } else {
      const entries = memStore.diaries.filter(
        d => d.user_id === req.user.id || (d.user_email && d.user_email.toLowerCase() === userEmail)
      );
      return res.json({ entries });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/diary', requireAuth, async (req, res) => {
  try {
    const { title, content, mood, image_url, weather, entry_date } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content required.' });
    }
    const cleanTitle = (title && title.trim()) ? title.trim() : 'Daily Reflection';
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const exist = await activePool.query(
        'SELECT * FROM diaries WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) AND title = $3 AND content = $4',
        [userId, userEmail, cleanTitle, content]
      );
      if (exist.rows.length > 0) {
        return res.json({ message: 'Diary entry already vaulted.', entry: exist.rows[0] });
      }

      const q = await activePool.query(
        'INSERT INTO diaries (user_id, user_email, title, content, mood, image_url, weather) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, userEmail, cleanTitle, content, mood || 'Nostalgia', image_url || '', weather || 'Quiet']
      );
      return res.status(201).json({ message: 'Diary entry written to vault.', entry: q.rows[0] });
    } else {
      const exist = memStore.diaries.find(
        d => (d.user_id === req.user.id || (d.user_email && d.user_email.toLowerCase() === userEmail)) &&
             d.title === cleanTitle && d.content === content
      );
      if (exist) {
        return res.json({ message: 'Diary entry already vaulted.', entry: exist });
      }

      const entry = {
        id: Date.now(),
        user_id: req.user.id,
        user_email: userEmail,
        title: cleanTitle,
        content,
        mood: mood || 'Nostalgia',
        image_url: image_url || '',
        weather: weather || 'Quiet',
        entry_date: entry_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memStore.diaries.push(entry);
      return res.status(201).json({ message: 'Diary entry written.', entry });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/diary/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, mood, image_url, weather } = req.body;
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const q = await activePool.query(
        'UPDATE diaries SET title = COALESCE($1, title), content = COALESCE($2, content), mood = COALESCE($3, mood), image_url = COALESCE($4, image_url), weather = COALESCE($5, weather), updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND (user_id = $7 OR (user_email IS NOT NULL AND LOWER(user_email) = $8)) RETURNING *',
        [title || null, content || null, mood || null, image_url || null, weather || null, req.params.id, userId, userEmail]
      );
      return res.json({ message: 'Diary entry updated.', entry: q.rows[0] });
    } else {
      const entry = memStore.diaries.find(
        d => d.id == req.params.id && (d.user_id === req.user.id || (d.user_email && d.user_email.toLowerCase() === userEmail))
      );
      if (entry) {
        if (title !== undefined) entry.title = title;
        if (content !== undefined) entry.content = content;
        if (mood !== undefined) entry.mood = mood;
        if (image_url !== undefined) entry.image_url = image_url;
        if (weather !== undefined) entry.weather = weather;
        entry.updated_at = new Date().toISOString();
      }
      return res.json({ message: 'Diary entry updated.', entry });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/diary/:id', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      await activePool.query(
        'DELETE FROM diaries WHERE id = $1 AND (user_id = $2 OR (user_email IS NOT NULL AND LOWER(user_email) = $3))',
        [req.params.id, userId, userEmail]
      );
    } else {
      memStore.diaries = memStore.diaries.filter(
        d => !(d.id == req.params.id && (d.user_id === req.user.id || (d.user_email && d.user_email.toLowerCase() === userEmail)))
      );
    }
    return res.json({ message: 'Diary deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= TIME CAPSULES =================
router.get('/capsules', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const q = await activePool.query(
        'SELECT * FROM capsules WHERE (user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)) ORDER BY unlock_date ASC',
        [userId, userEmail]
      );
      return res.json({ capsules: q.rows });
    } else {
      const capsules = memStore.capsules.filter(
        c => c.user_id === req.user.id || (c.user_email && c.user_email.toLowerCase() === userEmail)
      );
      return res.json({ capsules });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/capsules', requireAuth, async (req, res) => {
  try {
    const { title, message, media_urls, unlock_date } = req.body;
    if (!title || !message || !unlock_date) {
      return res.status(400).json({ error: 'Title, message, and unlock date required.' });
    }
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const q = await activePool.query(
        'INSERT INTO capsules (user_id, user_email, title, message, media_urls, unlock_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, userEmail, title, message, media_urls || '', unlock_date]
      );
      return res.status(201).json({ message: 'Time capsule sealed.', capsule: q.rows[0] });
    } else {
      const capsule = {
        id: Date.now(),
        user_id: req.user.id,
        user_email: userEmail,
        title,
        message,
        media_urls: media_urls || '',
        unlock_date,
        is_opened: 0,
        created_at: new Date().toISOString()
      };
      memStore.capsules.push(capsule);
      return res.status(201).json({ message: 'Time capsule sealed.', capsule });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/capsules/:id/open', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      const q = await activePool.query(
        'UPDATE capsules SET is_opened = 1 WHERE id = $1 AND (user_id = $2 OR (user_email IS NOT NULL AND LOWER(user_email) = $3)) RETURNING *',
        [req.params.id, userId, userEmail]
      );
      return res.json({ message: 'Capsule opened.', capsule: q.rows[0] });
    } else {
      const c = memStore.capsules.find(
        item => item.id == req.params.id && (item.user_id === req.user.id || (item.user_email && item.user_email.toLowerCase() === userEmail))
      );
      if (c) c.is_opened = 1;
      return res.json({ message: 'Capsule opened.', capsule: c });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/capsules/:id', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    if (activePool) {
      await activePool.query(
        'DELETE FROM capsules WHERE id = $1 AND (user_id = $2 OR (user_email IS NOT NULL AND LOWER(user_email) = $3))',
        [req.params.id, userId, userEmail]
      );
    } else {
      memStore.capsules = memStore.capsules.filter(
        c => !(c.id == req.params.id && (c.user_id === req.user.id || (c.user_email && c.user_email.toLowerCase() === userEmail)))
      );
    }
    return res.json({ message: 'Capsule deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= STATS =================
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userId = Number(req.user.id) || 0;
    const userEmail = (req.user.email || '').trim().toLowerCase();

    let mediaCount = 0;
    let videoCount = 0;
    let diaryCount = 0;
    let capsuleCount = 0;
    let totalBytes = 0;

    if (activePool) {
      const m = await activePool.query(
        'SELECT * FROM media WHERE user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)',
        [userId, userEmail]
      );
      for (const item of m.rows) {
        totalBytes += Number(item.size_bytes || 0);
        if (item.media_type === 'video') videoCount++;
        else mediaCount++;
      }
      const d = await activePool.query(
        'SELECT COUNT(*) as count FROM diaries WHERE user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)',
        [userId, userEmail]
      );
      diaryCount = Number(d.rows[0].count || 0);
      const c = await activePool.query(
        'SELECT COUNT(*) as count FROM capsules WHERE user_id = $1 OR (user_email IS NOT NULL AND LOWER(user_email) = $2)',
        [userId, userEmail]
      );
      capsuleCount = Number(c.rows[0].count || 0);
    } else {
      const m = memStore.media.filter(item => item.user_id === req.user.id || (item.user_email && item.user_email.toLowerCase() === userEmail));
      for (const item of m) {
        totalBytes += Number(item.size_bytes || 0);
        if (item.media_type === 'video') videoCount++;
        else mediaCount++;
      }
      diaryCount = memStore.diaries.filter(item => item.user_id === req.user.id || (item.user_email && item.user_email.toLowerCase() === userEmail)).length;
      capsuleCount = memStore.capsules.filter(item => item.user_id === req.user.id || (item.user_email && item.user_email.toLowerCase() === userEmail)).length;
    }

    res.json({
      photos: mediaCount,
      videos: videoCount,
      diaries: diaryCount,
      capsules: capsuleCount,
      totalBytes
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mount router on BOTH /api and / so that any path format works seamlessly
app.use('/api', router);
app.use('/', router);

module.exports = app;
