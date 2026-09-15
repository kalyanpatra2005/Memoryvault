const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Configure permanent storage for photos and videos
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `vault-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // up to 100MB for high-res photos and video clips
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov|ogg|m4v/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only photo and video files are supported (jpeg, png, gif, webp, mp4, webm, mov).'));
  },
});

// Upload media endpoint
router.post('/upload', requireAuth, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided.' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'photo';
    const mediaUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      mediaUrl,
      mediaType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

// Get all memories for authenticated user (strictly private to user)
router.get('/', requireAuth, (req, res) => {
  try {
    const { category, type, search } = req.query;
    let query = `
      SELECT m.*, 
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id) AS likes_count,
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id AND r.user_id = ?) AS user_liked
      FROM memories m 
      WHERE m.user_id = ?
    `;
    const params = [req.user.id, req.user.id];

    if (category && category !== 'All') {
      query += ' AND m.category = ?';
      params.push(category);
    }

    if (type && type !== 'all') {
      query += ' AND m.media_type = ?';
      params.push(type);
    }

    if (search && search.trim()) {
      query += ' AND (m.title LIKE ? OR m.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY m.created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('get memories error:', err);
    res.status(500).json({ error: 'Failed to load memories' });
  }
});

// Get user memory stats
router.get('/stats', requireAuth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) AS count FROM memories WHERE user_id = ?').get(req.user.id);
    const photos = db.prepare("SELECT COUNT(*) AS count FROM memories WHERE user_id = ? AND media_type = 'photo'").get(req.user.id);
    const videos = db.prepare("SELECT COUNT(*) AS count FROM memories WHERE user_id = ? AND media_type = 'video'").get(req.user.id);
    const publicCount = db.prepare('SELECT COUNT(*) AS count FROM memories WHERE user_id = ? AND is_public = 1').get(req.user.id);

    res.json({
      total: total.count,
      photos: photos.count,
      videos: videos.count,
      publicShared: publicCount.count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memory stats' });
  }
});

// Get single memory
router.get('/:id', requireAuth, (req, res) => {
  try {
    const memory = db.prepare(`
      SELECT m.*, u.name AS author_name,
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id) AS likes_count,
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id AND r.user_id = ?) AS user_liked
      FROM memories m
      JOIN users u ON u.id = m.user_id
      WHERE m.id = ?
    `).get(req.user.id, req.params.id);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // High privacy: user must be owner OR memory must be public
    if (memory.user_id !== req.user.id && memory.is_public !== 1) {
      return res.status(403).json({ error: 'Access denied. This memory is private to its creator.' });
    }

    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

// Create memory
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, description, category, media_type, media_url, memory_date, is_public } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Memory title is required' });
    }

    const result = db.prepare(`
      INSERT INTO memories (user_id, title, description, category, media_type, media_url, memory_date, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      description || '',
      category || 'Personal',
      media_type || 'photo',
      media_url || null,
      memory_date || new Date().toISOString().split('T')[0],
      is_public ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('create memory error:', err);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Update memory (e.g. toggle public / edit notes)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { title, description, category, is_public, memory_date } = req.body;
    const existing = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);

    if (!existing) return res.status(404).json({ error: 'Memory not found' });
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own memories' });
    }

    db.prepare(`
      UPDATE memories 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          is_public = COALESCE(?, is_public),
          memory_date = COALESCE(?, memory_date)
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description : null,
      category || null,
      is_public !== undefined ? (is_public ? 1 : 0) : null,
      memory_date || null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Delete memory permanently (only when user explicitly deletes)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    if (memory.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this memory' });
    }

    // Optionally delete media file from disk if desired
    if (memory.media_url && memory.media_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', memory.media_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('file unlink error:', e); }
      }
    }

    db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Memory permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

module.exports = router;
