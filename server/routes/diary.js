const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const TRAGIC_QUOTES = [
  "\"The heart was made to be broken.\" — Oscar Wilde",
  "\"I didn't want to wake up. I was having a much better time asleep.\" — Sylvia Plath",
  "\"Tears are words the mouth can't speak nor can the heart bear.\" — Joshua Wisenbaker",
  "\"Sometimes memories sneak out of my eye and roll down my cheeks.\"",
  "\"We loved with a love that was more than love.\" — Edgar Allan Poe",
  "\"Heavy hearts, like heavy clouds in the sky, are best relieved by the letting of a little water.\" — Christopher Morley",
  "\"Grief is just love with nowhere to go.\"",
  "\"The scariest thing about distance is that you don't know whether they'll miss you or forget you.\" — Nicholas Sparks",
  "\"There is a distinct, awful pain that comes with loving someone more than they love you.\"",
  "\"In the silence of the night, every forgotten word becomes an echo.\""
];

// Get all personal diary entries for authenticated user (strictly private)
router.get('/', requireAuth, (req, res) => {
  try {
    const { mood } = req.query;
    let query = 'SELECT * FROM diaries WHERE user_id = ?';
    const params = [req.user.id];

    if (mood && mood !== 'All') {
      query += ' AND mood = ?';
      params.push(mood);
    }

    query += ' ORDER BY created_at DESC';
    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (err) {
    console.error('get diary error:', err);
    res.status(500).json({ error: 'Failed to retrieve diary entries' });
  }
});

// Get random tragic quote
router.get('/quote', (req, res) => {
  const quote = TRAGIC_QUOTES[Math.floor(Math.random() * TRAGIC_QUOTES.length)];
  res.json({ quote });
});

// Get single diary entry
router.get('/:id', requireAuth, (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve entry' });
  }
});

// Create tragic diary entry
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, content, mood, tragic_quote, theme_style } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Entry title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Journal content cannot be empty' });
    }

    const assignedQuote = tragic_quote || TRAGIC_QUOTES[Math.floor(Math.random() * TRAGIC_QUOTES.length)];

    const result = db.prepare(`
      INSERT INTO diaries (user_id, title, content, mood, tragic_quote, theme_style)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      content.trim(),
      mood || 'Melancholy',
      assignedQuote,
      theme_style || 'parchment-rain'
    );

    const created = db.prepare('SELECT * FROM diaries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('create diary entry error:', err);
    res.status(500).json({ error: 'Failed to record diary entry' });
  }
});

// Update diary entry
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { title, content, mood, tragic_quote, theme_style } = req.body;
    const existing = db.prepare('SELECT id FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }

    db.prepare(`
      UPDATE diaries 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          mood = COALESCE(?, mood),
          tragic_quote = COALESCE(?, tragic_quote),
          theme_style = COALESCE(?, theme_style),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      content ? content.trim() : null,
      mood || null,
      tragic_quote || null,
      theme_style || null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM diaries WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update diary entry' });
  }
});

// Delete diary entry permanently
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM diaries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Entry not found or unauthorized' });
    }
    res.json({ success: true, message: 'Diary entry permanently removed from your vault.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

module.exports = router;
