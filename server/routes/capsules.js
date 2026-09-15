const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get user's time capsules
router.get('/', requireAuth, (req, res) => {
  try {
    const capsules = db.prepare(`
      SELECT * FROM time_capsules 
      WHERE user_id = ? 
      ORDER BY unlock_date ASC
    `).all(req.user.id);

    const now = Date.now();
    const processed = capsules.map(c => {
      const unlockTime = new Date(c.unlock_date).getTime();
      const isLocked = now < unlockTime;
      return {
        ...c,
        isLocked,
        // High security seal: mask message if still locked
        message: isLocked ? '🔒 [Sealed in Time Capsule - Opens on scheduled date]' : c.message,
        media_url: isLocked ? null : c.media_url,
        remainingMs: Math.max(0, unlockTime - now),
      };
    });

    res.json(processed);
  } catch (err) {
    console.error('get capsules error:', err);
    res.status(500).json({ error: 'Failed to retrieve time capsules' });
  }
});

// Capsule stats
router.get('/stats', requireAuth, (req, res) => {
  try {
    const capsules = db.prepare('SELECT unlock_date FROM time_capsules WHERE user_id = ?').all(req.user.id);
    const now = Date.now();
    let locked = 0;
    let unlocked = 0;
    let openSoon = 0; // within 7 days

    capsules.forEach(c => {
      const target = new Date(c.unlock_date).getTime();
      if (target > now) {
        locked++;
        if (target - now < 7 * 24 * 60 * 60 * 1000) {
          openSoon++;
        }
      } else {
        unlocked++;
      }
    });

    res.json({
      total: capsules.length,
      locked,
      unlocked,
      openSoon,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute capsule stats' });
  }
});

// Create time capsule
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, message, unlock_date, media_url, media_type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Capsule title is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Capsule letter/message is required' });
    }
    if (!unlock_date) {
      return res.status(400).json({ error: 'Unlock date is required' });
    }

    const result = db.prepare(`
      INSERT INTO time_capsules (user_id, title, message, unlock_date, media_url, media_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      message.trim(),
      unlock_date,
      media_url || null,
      media_type || 'none'
    );

    const created = db.prepare('SELECT * FROM time_capsules WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('create capsule error:', err);
    res.status(500).json({ error: 'Failed to create time capsule' });
  }
});

// Delete time capsule
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM time_capsules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Capsule not found or unauthorized' });
    }
    res.json({ success: true, message: 'Time capsule deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete capsule' });
  }
});

module.exports = router;
