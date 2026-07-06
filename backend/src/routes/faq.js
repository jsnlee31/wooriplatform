const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM faq_categories ORDER BY sort_order, name_ko');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

router.post('/categories', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name_ko, name_en, sort_order = 0 } = req.body;
    const result = await db.query(
      'INSERT INTO faq_categories (name_ko, name_en, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name_ko, name_en, sort_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name_ko, name_en, sort_order } = req.body;
    const result = await db.query(
      `UPDATE faq_categories SET
        name_ko = COALESCE($1, name_ko),
        name_en = COALESCE($2, name_en),
        sort_order = COALESCE($3, sort_order)
       WHERE id = $4
       RETURNING *`,
      [name_ko, name_en, sort_order, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM faq_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.*, fc.name_ko as category_name
       FROM faqs f LEFT JOIN faq_categories fc ON fc.id = f.category_id
       WHERE COALESCE(f.is_active, TRUE) = TRUE
       ORDER BY fc.sort_order, f.sort_order, f.created_at DESC`
    );
    res.json({ faqs: result.rows });
  } catch (error) {
    res.json({ faqs: [] });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM faqs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { category_id, question_ko, question_en, answer_ko, answer_en, sort_order = 0, is_active = true } = req.body;
    const result = await db.query(
      `INSERT INTO faqs (category_id, question_ko, question_en, answer_ko, answer_en, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [category_id, question_ko, question_en, answer_ko, answer_en, sort_order, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      category_id,
      question_ko,
      question_en,
      answer_ko,
      answer_en,
      sort_order,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE faqs SET
        category_id = COALESCE($1, category_id),
        question_ko = COALESCE($2, question_ko),
        question_en = COALESCE($3, question_en),
        answer_ko = COALESCE($4, answer_ko),
        answer_en = COALESCE($5, answer_en),
        sort_order = COALESCE($6, sort_order),
        is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [
        category_id, question_ko, question_en, answer_ko, answer_en,
        sort_order, is_active, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE faqs SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

module.exports = router;
