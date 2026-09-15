const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { run, get, all } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, `vault-${uniqueSuffix}${sanitizedExt}`);
  }
});

// File filter: accept images and videos only
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only photos and videos are permitted in the vault.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB limit per file
  }
});

/**
 * POST /api/vault/upload
 * Multi-part form-data: file, type ('photo'|'video'), caption, memoryDate, tags, unlockDate
 */
router.post('/upload', requireAuth, upload.single('mediaFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file was uploaded.' });
    }

    const { caption, memoryDate, tags, unlockDate } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');
    const type = isVideo ? 'video' : 'photo';
    const effectiveDate = memoryDate || new Date().toISOString().split('T')[0];

    const result = await run(`
      INSERT INTO vault_items (
        user_id, type, file_path, original_name, file_size, mime_type, caption, memory_date, tags, unlock_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      type,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      caption || '',
      effectiveDate,
      tags || '',
      unlockDate || null
    ]);

    const newItem = await get('SELECT * FROM vault_items WHERE id = ?', [result.id]);

    return res.status(201).json({
      message: 'Memory permanently sealed in your Vault.',
      item: newItem
    });
  } catch (err) {
    console.error('Upload error:', err);
    // Cleanup orphaned file if DB insert failed
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ error: err.message || 'Error preserving media file.' });
  }
});

/**
 * GET /api/vault/items
 * Fetches items belonging strictly to the authenticated user
 * Query params: type (all|photo|video), tag, search
 */
router.get('/items', requireAuth, async (req, res) => {
  try {
    const { type, tag, search } = req.query;
    let sql = `SELECT * FROM vault_items WHERE user_id = ?`;
    const params = [req.user.id];

    if (type && type !== 'all') {
      sql += ` AND type = ?`;
      params.push(type);
    }

    if (tag) {
      sql += ` AND tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    if (search) {
      sql += ` AND (caption LIKE ? OR original_name LIKE ? OR tags LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY memory_date DESC, created_at DESC`;

    const items = await all(sql, params);

    // Process time capsule lock status
    const now = new Date();
    const processedItems = items.map(item => {
      const isLocked = item.unlock_date && new Date(item.unlock_date) > now;
      return {
        ...item,
        is_locked: !!isLocked,
        // If locked, we don't display the full media until unlocked
        media_url: `/api/vault/media/${item.id}`
      };
    });

    return res.json({ items: processedItems });
  } catch (err) {
    console.error('Fetch items error:', err);
    return res.status(500).json({ error: 'Failed to retrieve vault items.' });
  }
});

/**
 * GET /api/vault/media/:id
 * High security: Stream file ONLY if the authenticated user owns this vault item!
 */
router.get('/media/:id', requireAuth, async (req, res) => {
  try {
    const item = await get(
      `SELECT * FROM vault_items WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!item) {
      return res.status(404).json({ error: 'Media file not found or unauthorized.' });
    }

    // Check if sealed time capsule
    if (item.unlock_date && new Date(item.unlock_date) > new Date()) {
      return res.status(403).json({
        error: `This memory is sealed in a Time Capsule until ${item.unlock_date}.`,
        unlock_date: item.unlock_date
      });
    }

    const filePath = path.join(uploadsDir, item.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical media file missing on server.' });
    }

    // Support HTTP Range requests for smooth video scrubbing & instant photo loading
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range && item.type === 'video') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': item.mime_type,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': item.mime_type,
        'Cache-Control': 'private, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Media stream error:', err);
    return res.status(500).json({ error: 'Error streaming media.' });
  }
});

/**
 * DELETE /api/vault/items/:id
 * Permanently removes the item and associated file upon explicit user action
 */
router.delete('/items/:id', requireAuth, async (req, res) => {
  try {
    const item = await get(
      `SELECT * FROM vault_items WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!item) {
      return res.status(404).json({ error: 'Item not found or unauthorized.' });
    }

    // Delete record from DB
    await run(`DELETE FROM vault_items WHERE id = ? AND user_id = ?`, [item.id, req.user.id]);

    // Delete physical file
    const filePath = path.join(uploadsDir, item.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Notice: Failed to unlink file:', filePath);
      });
    }

    return res.json({ message: 'Memory permanently deleted as requested.' });
  } catch (err) {
    console.error('Delete item error:', err);
    return res.status(500).json({ error: 'Failed to delete vault item.' });
  }
});

module.exports = router;
