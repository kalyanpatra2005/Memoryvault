const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// All diary routes are protected
router.use(requireAuth);

// Get all diaries for the authenticated user
router.get('/', (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT * FROM diaries 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ entries });
  } catch (err) {
    console.error('Fetch diaries error:', err);
    res.status(500).json({ error: 'Failed to retrieve diary entries.' });
  }
});

// Get a single diary entry
router.get('/:id', (req, res) => {
  try {
    const entry = db.prepare(`
      SELECT * FROM diaries 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized.' });
    }

    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve entry.' });
  }
});

// Create a new diary entry
router.post('/', (req, res) => {
  try {
    const { title, content, mood, image_url, weather } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Diary content cannot be empty.' });
    }

    const entryTitle = (title && title.trim()) ? title.trim() : 'Untitled Memory';
    const entryMood = mood || 'Nostalgia';

    const stmt = db.prepare(`
      INSERT INTO diaries (user_id, title, content, mood, image_url, weather)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(req.user.id, entryTitle, content, entryMood, image_url || null, weather || null);
    const newEntry = db.prepare('SELECT * FROM diaries WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Memory sealed into your eternal diary.',
      entry: newEntry
    });
  } catch (err) {
    console.error('Create diary error:', err);
    res.status(500).json({ error: 'Failed to save diary entry.' });
  }
});

// Update a diary entry
router.put('/:id', (req, res) => {
  try {
    const { title, content, mood, image_url, weather } = req.body;

    const existing = db.prepare('SELECT id FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Diary entry not found or access denied.' });
    }

    const stmt = db.prepare(`
      UPDATE diaries 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          mood = COALESCE(?, mood),
          image_url = COALESCE(?, image_url),
          weather = COALESCE(?, weather),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(title, content, mood, image_url, weather, req.params.id, req.user.id);
    const updated = db.prepare('SELECT * FROM diaries WHERE id = ?').get(req.params.id);

    res.json({ message: 'Diary entry preserved and updated.', entry: updated });
  } catch (err) {
    console.error('Update diary error:', err);
    res.status(500).json({ error: 'Failed to update diary entry.' });
  }
});

// Delete a diary entry
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Diary entry not found or access denied.' });
    }

    db.prepare('DELETE FROM diaries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Diary entry permanently removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete diary entry.' });
  }
});

module.exports = router;
