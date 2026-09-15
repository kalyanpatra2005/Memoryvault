const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all public memories shared by any user
router.get('/posts', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let currentUserId = 0;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {
        // Not logged in or expired token, still allow viewing public posts
      }
    }

    const posts = db.prepare(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.category,
        m.media_type,
        m.media_url,
        m.memory_date,
        m.created_at,
        u.id AS author_id,
        u.name AS author_name,
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id) AS likes_count,
        (SELECT COUNT(*) FROM reactions r WHERE r.memory_id = m.id AND r.user_id = ?) AS user_liked
      FROM memories m
      JOIN users u ON u.id = m.user_id
      WHERE m.is_public = 1
      ORDER BY m.created_at DESC
    `).all(currentUserId);

    res.json(posts);
  } catch (err) {
    console.error('get public posts error:', err);
    res.status(500).json({ error: 'Failed to load public community posts' });
  }
});

// Toggle reaction / heart on a public post
router.post('/posts/:id/like', requireAuth, (req, res) => {
  try {
    const memoryId = req.params.id;
    const memory = db.prepare('SELECT id, is_public FROM memories WHERE id = ?').get(memoryId);

    if (!memory) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (memory.is_public !== 1) {
      return res.status(403).json({ error: 'Cannot react to a private memory' });
    }

    const existing = db.prepare('SELECT id FROM reactions WHERE memory_id = ? AND user_id = ?').get(memoryId, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
      const count = db.prepare('SELECT COUNT(*) AS count FROM reactions WHERE memory_id = ?').get(memoryId).count;
      return res.json({ liked: false, likesCount: count });
    } else {
      db.prepare('INSERT INTO reactions (memory_id, user_id, reaction_type) VALUES (?, ?, ?)').run(memoryId, req.user.id, 'heart');
      const count = db.prepare('SELECT COUNT(*) AS count FROM reactions WHERE memory_id = ?').get(memoryId).count;
      return res.json({ liked: true, likesCount: count });
    }
  } catch (err) {
    console.error('toggle like error:', err);
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

// Toggle a memory's public status
router.post('/toggle-share/:id', requireAuth, (req, res) => {
  try {
    const memory = db.prepare('SELECT id, user_id, is_public FROM memories WHERE id = ?').get(req.params.id);
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    if (memory.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the memory owner can alter public visibility' });
    }

    const newStatus = memory.is_public === 1 ? 0 : 1;
    db.prepare('UPDATE memories SET is_public = ? WHERE id = ?').run(newStatus, req.params.id);

    res.json({
      success: true,
      isPublic: newStatus === 1,
      message: newStatus === 1 
        ? 'Memory is now visible to the public community!' 
        : 'Memory is now private to your personal vault.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

module.exports = router;
