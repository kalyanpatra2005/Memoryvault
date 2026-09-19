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
        phone TEXT NOT NULL,
        dob TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_email TEXT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        media_type TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        caption TEXT,
        data_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

      ALTER TABLE media ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE diaries ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE capsules ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
    `);
    tablesInitialized = true;
    console.log('✓ Cloud Database tables ready with user_email and permanent settings support.');
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
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, phone, dob, password, confirmPassword } = req.body;
    if (!name || !email || !phone || !dob || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
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
            id: existUser.id,
            name: existUser.name,
            email: existUser.email,
            phone: existUser.phone,
            dob: existUser.dob,
            created_at: existUser.created_at
          };
          const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
          return res.json({ message: 'Welcome back! Vault unlocked.', token, user: safe });
        }
        return res.status(400).json({ error: 'An account with this email already exists. Please log in with your master password.' });
      }

      // Check existing phone
      const allUsers = await activePool.query('SELECT id, phone FROM users');
      const phoneExist = allUsers.rows.find(u => phonesMatch(u.phone, cleanPhone));
      if (phoneExist) {
        return res.status(400).json({ error: 'An account with this phone number already exists.' });
      }

      const insert = await activePool.query(
        'INSERT INTO users (name, email, phone, dob, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, dob, created_at',
        [cleanName, cleanEmail, cleanPhone, dob, hash]
      );
      const user = insert.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ message: 'Vault created in Cloud Database.', token, user });
    } else {
      // MemStore fallback
      const exist = memStore.users.find(u => u.email.toLowerCase() === cleanEmail || phonesMatch(u.phone, cleanPhone));
      if (exist) {
        const valid = bcrypt.compareSync(password, exist.password_hash);
        if (valid) {
          const safe = { ...exist };
          delete safe.password_hash;
          const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
          return res.json({ message: 'Welcome back! Vault unlocked.', token, user: safe });
        }
        return res.status(400).json({ error: 'An account with this email already exists. Please log in with your master password.' });
      }
      const user = {
        id: Date.now(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        dob,
        password_hash: hash,
        created_at: new Date().toISOString()
      };
      memStore.users.push(user);
      const safe = { ...user };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ message: 'Vault created.', token, user: safe });
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and Password are required.' });
    }
    const cleanId = identifier.trim().toLowerCase();
    const activePool = getPool();

    if (activePool) {
      const q = await activePool.query('SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2', [cleanId, identifier.trim()]);
      let user = q.rows[0];
      if (!user) {
        const all = await activePool.query('SELECT * FROM users');
        user = all.rows.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
      }
      if (!user) {
        return res.status(401).json({ error: 'No account found with this email or phone number.' });
      }
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect master password.' });
      }
      const safe = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        created_at: user.created_at
      };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ message: 'Vault unlocked.', token, user: safe });
    } else {
      const user = memStore.users.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
      if (!user) {
        return res.status(401).json({ error: 'No account found with this email or phone number.' });
      }
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect master password.' });
      }
      const safe = { ...user };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ message: 'Vault unlocked.', token, user: safe });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  try {
    const { identifier, dob, newPassword } = req.body;
    if (!identifier || !dob || !newPassword) {
      return res.status(400).json({ error: 'Identifier, Date of Birth, and New Password required.' });
    }
    const cleanId = identifier.trim().toLowerCase();
    const newHash = bcrypt.hashSync(newPassword, 10);
    const activePool = getPool();

    if (activePool) {
      const all = await activePool.query('SELECT * FROM users');
      const user = all.rows.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
      if (!user) return res.status(404).json({ error: 'No account found with this email or phone number.' });
      if (user.dob && user.dob.trim() !== dob.trim()) {
        return res.status(401).json({ error: 'Date of Birth does not match account records.' });
      }
      await activePool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      const safe = { id: user.id, name: user.name, email: user.email, phone: user.phone, dob: user.dob };
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ message: 'Password reset successfully.', token, user: safe });
    } else {
      const user = memStore.users.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
      if (!user) return res.status(404).json({ error: 'No account found with this email or phone number.' });
      if (user.dob && user.dob.trim() !== dob.trim()) {
        return res.status(401).json({ error: 'Date of Birth does not match account records.' });
      }
      user.password_hash = newHash;
      const safe = { ...user };
      delete safe.password_hash;
      const token = jwt.sign({ id: safe.id, email: safe.email, name: safe.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ message: 'Password reset successfully.', token, user: safe });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const activePool = getPool();
    const userEmail = (req.user.email || '').trim().toLowerCase();
    if (activePool) {
      const q = await activePool.query(
        'SELECT id, name, email, phone, dob, settings, created_at FROM users WHERE id = $1 OR (email IS NOT NULL AND LOWER(email) = $2)',
        [req.user.id || 0, userEmail]
      );
      if (q.rows.length > 0) return res.json({ user: q.rows[0] });
    }
    
    let user = memStore.users.find(u => u.id === req.user.id || (u.email && u.email.toLowerCase() === userEmail));
    if (!user) {
      user = {
        id: req.user.id,
        name: req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'Honored Keeper'),
        email: req.user.email || 'user@memoryvault.local',
        phone: req.user.phone || '',
        settings: {},
        created_at: new Date().toISOString()
      };
      memStore.users.push(user);
    }
    const safe = { ...user };
    delete safe.password_hash;
    return res.json({ user: safe });
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
