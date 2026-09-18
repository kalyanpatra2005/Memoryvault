const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_eternal_key_2026';
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool = null;
if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    console.log('✓ PostgreSQL pool created.');
  } catch (e) {
    console.error('Failed to create PostgreSQL pool:', e);
  }
}

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
  if (!pool || tablesInitialized) return;
  try {
    await pool.query(`
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
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        media_urls TEXT,
        unlock_date TIMESTAMP NOT NULL,
        is_opened INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesInitialized = true;
    console.log('✓ Cloud Database tables ready.');
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
  if (pool && !tablesInitialized) {
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
  res.json({
    status: 'ok',
    service: 'Memory Vault Serverless Cloud Engine',
    hasDatabase: !!pool,
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

    if (pool) {
      // Check existing email
      const exist = await pool.query('SELECT id, phone FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (exist.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      // Check existing phone
      const allUsers = await pool.query('SELECT id, phone FROM users');
      const phoneExist = allUsers.rows.find(u => phonesMatch(u.phone, cleanPhone));
      if (phoneExist) {
        return res.status(400).json({ error: 'An account with this phone number already exists.' });
      }

      const insert = await pool.query(
        'INSERT INTO users (name, email, phone, dob, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, dob, created_at',
        [cleanName, cleanEmail, cleanPhone, dob, hash]
      );
      const user = insert.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ message: 'Vault created in Cloud Database.', token, user });
    } else {
      // MemStore fallback
      const exist = memStore.users.find(u => u.email.toLowerCase() === cleanEmail || phonesMatch(u.phone, cleanPhone));
      if (exist) return res.status(400).json({ error: 'An account with this email already exists.' });
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
      const token = jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' });
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

    if (pool) {
      const all = await pool.query('SELECT * FROM users');
      const user = all.rows.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
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
      const token = jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' });
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
      const token = jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' });
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

    if (pool) {
      const all = await pool.query('SELECT * FROM users');
      const user = all.rows.find(u => u.email.toLowerCase() === cleanId || phonesMatch(u.phone, identifier));
      if (!user) return res.status(404).json({ error: 'No account found with this email or phone number.' });
      if (user.dob && user.dob.trim() !== dob.trim()) {
        return res.status(401).json({ error: 'Date of Birth does not match account records.' });
      }
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      const safe = { id: user.id, name: user.name, email: user.email, phone: user.phone, dob: user.dob };
      const token = jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' });
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
      const token = jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ message: 'Password reset successfully.', token, user: safe });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    if (pool) {
      const q = await pool.query('SELECT id, name, email, phone, dob, created_at FROM users WHERE id = $1', [req.user.id]);
      if (q.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ user: q.rows[0] });
    } else {
      const user = memStore.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const safe = { ...user };
      delete safe.password_hash;
      return res.json({ user: safe });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= MEDIA (PHOTOS & VIDEOS) =================
router.get('/media', requireAuth, async (req, res) => {
  try {
    let rows = [];
    if (pool) {
      const q = await pool.query('SELECT * FROM media WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      rows = q.rows;
    } else {
      rows = memStore.media.filter(m => m.user_id === req.user.id);
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
    const insertedMedia = [];

    // 1. If uploaded via multipart FormData with files
    if (req.files && req.files.length > 0) {
      const caption = req.body.caption || '';
      for (const file of req.files) {
        const isVideo = file.mimetype.toLowerCase().startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)/i.test(file.originalname);
        const mediaType = isVideo ? 'video' : 'photo';
        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const filename = Date.now() + '_' + file.originalname;

        if (pool) {
          const q = await pool.query(
            'INSERT INTO media (user_id, filename, original_name, media_type, mime_type, size_bytes, caption, data_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.user.id, filename, file.originalname, mediaType, file.mimetype, file.size, caption, dataUrl]
          );
          insertedMedia.push(q.rows[0]);
        } else {
          const item = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user_id: req.user.id,
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

    if (pool) {
      const q = await pool.query(
        'INSERT INTO media (user_id, filename, original_name, media_type, mime_type, size_bytes, caption, data_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [req.user.id, filename, original_name || filename, media_type || 'photo', mime_type || 'image/jpeg', size_bytes || 0, caption || '', data_url || '']
      );
      return res.status(201).json({ message: 'Media saved in cloud vault.', item: q.rows[0], media: [q.rows[0]] });
    } else {
      const item = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        user_id: req.user.id,
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

    let item = null;
    if (pool) {
      const q = await pool.query('SELECT * FROM media WHERE id = $1', [req.params.id]);
      item = q.rows[0];
    } else {
      item = memStore.media.find(m => m.id == req.params.id);
    }

    if (!item) return res.status(404).send('Media not found');
    if (item.user_id !== user.id) return res.status(403).send('Forbidden: Not your memory');

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
    if (pool) {
      await pool.query('DELETE FROM media WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    } else {
      memStore.media = memStore.media.filter(m => !(m.id == req.params.id && m.user_id === req.user.id));
    }
    return res.json({ message: 'Media deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= DIARIES =================
router.get('/diary', requireAuth, async (req, res) => {
  try {
    if (pool) {
      const q = await pool.query('SELECT * FROM diaries WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      return res.json({ entries: q.rows });
    } else {
      const entries = memStore.diaries.filter(d => d.user_id === req.user.id);
      return res.json({ entries });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/diary', requireAuth, async (req, res) => {
  try {
    const { title, content, mood, image_url, weather } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required.' });
    }
    if (pool) {
      const q = await pool.query(
        'INSERT INTO diaries (user_id, title, content, mood, image_url, weather) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.id, title, content, mood || 'Nostalgia', image_url || '', weather || 'Quiet']
      );
      return res.status(201).json({ message: 'Diary entry written to vault.', entry: q.rows[0] });
    } else {
      const entry = {
        id: Date.now(),
        user_id: req.user.id,
        title,
        content,
        mood: mood || 'Nostalgia',
        image_url: image_url || '',
        weather: weather || 'Quiet',
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

router.delete('/diary/:id', requireAuth, async (req, res) => {
  try {
    if (pool) {
      await pool.query('DELETE FROM diaries WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    } else {
      memStore.diaries = memStore.diaries.filter(d => !(d.id == req.params.id && d.user_id === req.user.id));
    }
    return res.json({ message: 'Diary deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= TIME CAPSULES =================
router.get('/capsules', requireAuth, async (req, res) => {
  try {
    if (pool) {
      const q = await pool.query('SELECT * FROM capsules WHERE user_id = $1 ORDER BY unlock_date ASC', [req.user.id]);
      return res.json({ capsules: q.rows });
    } else {
      const capsules = memStore.capsules.filter(c => c.user_id === req.user.id);
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
    if (pool) {
      const q = await pool.query(
        'INSERT INTO capsules (user_id, title, message, media_urls, unlock_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.user.id, title, message, media_urls || '', unlock_date]
      );
      return res.status(201).json({ message: 'Time capsule sealed.', capsule: q.rows[0] });
    } else {
      const capsule = {
        id: Date.now(),
        user_id: req.user.id,
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
    if (pool) {
      const q = await pool.query(
        'UPDATE capsules SET is_opened = 1 WHERE id = $1 AND user_id = $2 RETURNING *',
        [req.params.id, req.user.id]
      );
      return res.json({ message: 'Capsule opened.', capsule: q.rows[0] });
    } else {
      const c = memStore.capsules.find(item => item.id == req.params.id && item.user_id === req.user.id);
      if (c) c.is_opened = 1;
      return res.json({ message: 'Capsule opened.', capsule: c });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/capsules/:id', requireAuth, async (req, res) => {
  try {
    if (pool) {
      await pool.query('DELETE FROM capsules WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    } else {
      memStore.capsules = memStore.capsules.filter(c => !(c.id == req.params.id && c.user_id === req.user.id));
    }
    return res.json({ message: 'Capsule deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ================= STATS =================
router.get('/stats', requireAuth, async (req, res) => {
  try {
    let mediaCount = 0;
    let videoCount = 0;
    let diaryCount = 0;
    let capsuleCount = 0;
    let totalBytes = 0;

    if (pool) {
      const m = await pool.query('SELECT * FROM media WHERE user_id = $1', [req.user.id]);
      for (const item of m.rows) {
        totalBytes += Number(item.size_bytes || 0);
        if (item.media_type === 'video') videoCount++;
        else mediaCount++;
      }
      const d = await pool.query('SELECT COUNT(*) as count FROM diaries WHERE user_id = $1', [req.user.id]);
      diaryCount = Number(d.rows[0].count || 0);
      const c = await pool.query('SELECT COUNT(*) as count FROM capsules WHERE user_id = $1', [req.user.id]);
      capsuleCount = Number(c.rows[0].count || 0);
    } else {
      const m = memStore.media.filter(item => item.user_id === req.user.id);
      for (const item of m) {
        totalBytes += Number(item.size_bytes || 0);
        if (item.media_type === 'video') videoCount++;
        else mediaCount++;
      }
      diaryCount = memStore.diaries.filter(item => item.user_id === req.user.id).length;
      capsuleCount = memStore.capsules.filter(item => item.user_id === req.user.id).length;
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
