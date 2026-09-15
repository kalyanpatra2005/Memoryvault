const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { requireAuth } = require('./auth');

const authRoutes = require('./routes/authRoutes');
const diaryRoutes = require('./routes/diaryRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const capsuleRoutes = require('./routes/capsuleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Memory Vault Core', timestamp: new Date().toISOString() });
});

// Vault Statistics endpoint (user-specific)
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const photoCount = db.prepare("SELECT COUNT(*) as count FROM media WHERE user_id = ? AND media_type = 'photo'").get(req.user.id).count;
    const videoCount = db.prepare("SELECT COUNT(*) as count FROM media WHERE user_id = ? AND media_type = 'video'").get(req.user.id).count;
    const diaryCount = db.prepare('SELECT COUNT(*) as count FROM diaries WHERE user_id = ?').get(req.user.id).count;
    const capsuleCount = db.prepare('SELECT COUNT(*) as count FROM capsules WHERE user_id = ?').get(req.user.id).count;
    const totalBytes = db.prepare('SELECT COALESCE(SUM(size_bytes), 0) as total FROM media WHERE user_id = ?').get(req.user.id).total;

    // Fetch latest diary snippet
    const latestDiary = db.prepare('SELECT id, title, mood, created_at FROM diaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);

    // Fetch upcoming capsule
    const nextCapsule = db.prepare('SELECT id, title, unlock_date, is_opened FROM capsules WHERE user_id = ? AND is_opened = 0 ORDER BY unlock_date ASC LIMIT 1').get(req.user.id);

    res.json({
      photos: photoCount,
      videos: videoCount,
      diaries: diaryCount,
      capsules: capsuleCount,
      totalBytes,
      latestDiary: latestDiary || null,
      nextCapsule: nextCapsule || null
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/capsules', capsuleRoutes);

// Serve static frontend build if present
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Vault Core server running securely on http://localhost:${PORT}`);
});
