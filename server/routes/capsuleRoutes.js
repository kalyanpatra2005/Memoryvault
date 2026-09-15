const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// Get all time capsules for the current user
router.get('/', (req, res) => {
  try {
    const capsules = db.prepare(`
      SELECT * FROM capsules 
      WHERE user_id = ? 
      ORDER BY unlock_date ASC
    `).all(req.user.id);

    const now = new Date().toISOString();
    const parsed = capsules.map(c => {
      const isReadyToUnlock = new Date(c.unlock_date) <= new Date();
      return {
        ...c,
        media_urls: c.media_urls ? JSON.parse(c.media_urls) : [],
        is_ready: isReadyToUnlock,
        // If not ready and not already opened, hide sensitive contents from preview for dramatic suspense
        message: (isReadyToUnlock || c.is_opened) ? c.message : '🔒 Sealed into the future. Content hidden until unlock date arrives.',
      };
    });

    res.json({ capsules: parsed });
  } catch (err) {
    console.error('Fetch capsules error:', err);
    res.status(500).json({ error: 'Failed to retrieve time capsules.' });
  }
});

// Create a new sealed time capsule
router.post('/', (req, res) => {
  try {
    const { title, message, unlock_date, media_urls } = req.body;

    if (!title || !message || !unlock_date) {
      return res.status(400).json({ error: 'Title, message, and future unlock date are required.' });
    }

    const unlockTime = new Date(unlock_date);
    if (isNaN(unlockTime.getTime())) {
      return res.status(400).json({ error: 'Invalid unlock date provided.' });
    }

    const serializedMedia = media_urls ? JSON.stringify(media_urls) : JSON.stringify([]);

    const stmt = db.prepare(`
      INSERT INTO capsules (user_id, title, message, media_urls, unlock_date, is_opened)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const result = stmt.run(req.user.id, title.trim(), message, serializedMedia, unlockTime.toISOString());
    const newCapsule = db.prepare('SELECT * FROM capsules WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Time capsule sealed and cast into the future.',
      capsule: {
        ...newCapsule,
        media_urls: JSON.parse(newCapsule.media_urls || '[]')
      }
    });
  } catch (err) {
    console.error('Create capsule error:', err);
    res.status(500).json({ error: 'Failed to seal time capsule.' });
  }
});

// Open/break seal on an unlocked capsule
router.put('/:id/open', (req, res) => {
  try {
    const capsule = db.prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!capsule) {
      return res.status(404).json({ error: 'Time capsule not found.' });
    }

    const isReady = new Date(capsule.unlock_date) <= new Date();
    if (!isReady) {
      return res.status(400).json({ error: 'The hour has not yet come. This capsule is still locked in time.' });
    }

    db.prepare('UPDATE capsules SET is_opened = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id);

    res.json({
      message: 'The seal is broken. The memory has returned.',
      capsule: {
        ...updated,
        media_urls: JSON.parse(updated.media_urls || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unseal capsule.' });
  }
});

// Delete time capsule
router.delete('/:id', (req, res) => {
  try {
    const capsule = db.prepare('SELECT id FROM capsules WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found or access denied.' });
    }

    db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Time capsule dissolved from timeline.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete capsule.' });
  }
});

module.exports = router;
