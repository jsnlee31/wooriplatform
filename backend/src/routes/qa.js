const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM qa_questions ORDER BY is_pinned DESC, created_at DESC');
    res.json({ questions: result.rows });
  } catch (error) {
    res.json({ questions: [] });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const result = await db.query(
      'INSERT INTO qa_questions (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, content, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.post('/:id/answers', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const result = await db.query(
      'INSERT INTO qa_answers (question_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content]
    );
    await db.query('UPDATE qa_questions SET is_answered = TRUE WHERE id = $1', [req.params.id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

module.exports = router;
