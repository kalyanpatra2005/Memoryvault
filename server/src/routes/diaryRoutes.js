const express = require('express');
const { run, get, all } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/diary
 * Creates a new tragic personal diary entry
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, mood, paper_style, entry_date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Diary title and written thoughts are required.' });
    }

    const effectiveDate = entry_date || new Date().toISOString().split('T')[0];

    const result = await run(`
      INSERT INTO diary_entries (
        user_id, title, content, mood, paper_style, entry_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      title.trim(),
      content,
      mood || 'Melancholy',
      paper_style || 'aged-parchment',
      effectiveDate
    ]);

    const entry = await get('SELECT * FROM diary_entries WHERE id = ?', [result.id]);

    return res.status(201).json({
      message: 'Thoughts etched into your permanent tragic diary.',
      entry
    });
  } catch (err) {
    console.error('Create diary error:', err);
    return res.status(500).json({ error: 'Failed to preserve diary entry.' });
  }
});

/**
 * GET /api/diary
 * Retrieves all diary entries strictly belonging to the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { mood, search } = req.query;
    let sql = `SELECT * FROM diary_entries WHERE user_id = ?`;
    const params = [req.user.id];

    if (mood && mood !== 'All') {
      sql += ` AND mood = ?`;
      params.push(mood);
    }

    if (search) {
      sql += ` AND (title LIKE ? OR content LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }

    sql += ` ORDER BY entry_date DESC, created_at DESC`;

    const entries = await all(sql, params);
    return res.json({ entries });
  } catch (err) {
    console.error('Get diaries error:', err);
    return res.status(500).json({ error: 'Failed to retrieve diary entries.' });
  }
});

/**
 * GET /api/diary/:id
 * Retrieve a single diary entry (guaranteed user isolation)
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const entry = await get(
      `SELECT * FROM diary_entries WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized.' });
    }

    return res.json({ entry });
  } catch (err) {
    console.error('Get single diary error:', err);
    return res.status(500).json({ error: 'Failed to retrieve diary entry.' });
  }
});

/**
 * PUT /api/diary/:id
 * Update an existing diary entry
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, mood, paper_style, entry_date } = req.body;

    const existing = await get(
      `SELECT id FROM diary_entries WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized.' });
    }

    await run(`
      UPDATE diary_entries SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        mood = COALESCE(?, mood),
        paper_style = COALESCE(?, paper_style),
        entry_date = COALESCE(?, entry_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [title, content, mood, paper_style, entry_date, req.params.id, req.user.id]);

    const updated = await get('SELECT * FROM diary_entries WHERE id = ?', [req.params.id]);

    return res.json({
      message: 'Diary entry updated successfully.',
      entry: updated
    });
  } catch (err) {
    console.error('Update diary error:', err);
    return res.status(500).json({ error: 'Failed to update diary entry.' });
  }
});

/**
 * DELETE /api/diary/:id
 * Permanently delete a diary entry
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await get(
      `SELECT id FROM diary_entries WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized.' });
    }

    await run(`DELETE FROM diary_entries WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);

    return res.json({ message: 'Diary entry permanently removed from your vault.' });
  } catch (err) {
    console.error('Delete diary error:', err);
    return res.status(500).json({ error: 'Failed to delete diary entry.' });
  }
});

module.exports = router;
