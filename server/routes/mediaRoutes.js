const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, decodeAnyToken } = require('../auth');

const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_key_super_secure_2026_unbreakable';

// Ensure uploads base folder exists
const uploadsBase = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsBase)) {
  fs.mkdirSync(uploadsBase, { recursive: true });
}

// Multer storage setup: partitioned securely by user directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsBase, String(req.user.id));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit for high quality video/photo
  fileFilter: (req, file, cb) => {
    const allowedImage = /jpeg|jpg|png|gif|webp|bmp|svg/;
    const allowedVideo = /mp4|webm|mov|mkv|avi|quicktime/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();

    const isImage = allowedImage.test(ext) || mime.startsWith('image/');
    const isVideo = allowedVideo.test(ext) || mime.startsWith('video/');

    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload photos or videos only.'));
    }
  }
});

// Middleware that accepts auth via Bearer header or ?token= query parameter (for media tags)
function authenticateMedia(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).send('Unauthorized: Media access requires authentication.');
  }

  const user = decodeAnyToken(token);
  if (!user) {
    return res.status(401).send('Unauthorized: Invalid or expired token.');
  }

  req.user = user;
  next();
}

// Get user's uploaded media files (photos and videos)
router.get('/', requireAuth, (req, res) => {
  try {
    const type = req.query.type; // 'photo', 'video', or undefined for all
    let query = 'SELECT * FROM media WHERE user_id = ?';
    const params = [req.user.id];

    if (type === 'photo' || type === 'video') {
      query += ' AND media_type = ?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC';

    const mediaList = db.prepare(query).all(...params);
    res.json({ media: mediaList });
  } catch (err) {
    console.error('Fetch media error:', err);
    res.status(500).json({ error: 'Failed to retrieve media library.' });
  }
});

// Upload media endpoint (single or multiple)
router.post('/upload', requireAuth, upload.array('files', 15), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload.' });
    }

    const { caption, source } = req.body;
    const mediaSource = source || req.query.source || 'vault';
    const insertedMedia = [];

    const insertStmt = db.prepare(`
      INSERT INTO media (user_id, filename, original_name, file_path, mime_type, media_type, size_bytes, caption, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.originalname);
      const mediaType = isVideo ? 'video' : 'photo';
      const relPath = `${req.user.id}/${file.filename}`;

      const info = insertStmt.run(
        req.user.id,
        file.filename,
        file.originalname,
        relPath,
        file.mimetype,
        mediaType,
        file.size,
        caption || null,
        mediaSource
      );

      const record = db.prepare('SELECT * FROM media WHERE id = ?').get(info.lastInsertRowid);
      insertedMedia.push(record);
    }

    res.status(201).json({
      message: `${insertedMedia.length} memory item(s) permanently vaulted.`,
      media: insertedMedia
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload media: ' + err.message });
  }
});

// Secure media streaming endpoint (Strict Private Access: verifies owner)
router.get('/stream/:id', authenticateMedia, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).send('Media not found.');
    }

    // High security check: Only the user who uploaded can access this media!
    if (item.user_id !== req.user.id) {
      return res.status(403).send('Forbidden: You do not have permission to view this memory.');
    }

    const filePath = path.join(uploadsBase, item.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File missing from storage.');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Support HTTP Range requests for seamless video seek and playback
    if (range && item.media_type === 'video') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': item.mime_type,
      };
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': item.mime_type,
        'Cache-Control': 'private, max-age=86400',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).send('Streaming error.');
  }
});

// Delete media permanently
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Media not found or permission denied.' });
    }

    // Remove from physical disk
    const filePath = path.join(uploadsBase, item.file_path);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete disk file:', e);
      }
    }

    // Remove from database
    db.prepare('DELETE FROM media WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    res.json({ message: 'Memory permanently erased by your command.' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete media item.' });
  }
});

module.exports = router;
