const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get resumes' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, file_url, is_primary = false } = req.body;
    const result = await db.query(
      `INSERT INTO resumes (user_id, title, content, file_url, is_primary)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, content || {}, file_url, is_primary]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, file_url, is_primary } = req.body;
    const result = await db.query(
      `UPDATE resumes SET title = COALESCE($1, title), content = COALESCE($2, content),
       file_url = COALESCE($3, file_url), is_primary = COALESCE($4, is_primary),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [title, content, file_url, is_primary, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

router.put('/:id/primary', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE resumes SET is_primary = FALSE WHERE user_id = $1', [req.user.id]);
    const result = await db.query(
      'UPDATE resumes SET is_primary = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set primary resume' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json({ message: 'Resume deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
