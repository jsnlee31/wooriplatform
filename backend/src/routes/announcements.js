const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM announcements WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY is_pinned DESC, created_at DESC');
    res.json({ announcements: result.rows });
  } catch (error) {
    res.json({ announcements: [] });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get announcement' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title_ko, title_en, content_ko, content_en, type, display_type, is_pinned = false, is_active = true, start_date, end_date, target_roles } = req.body;
    const result = await db.query(
      `INSERT INTO announcements (title_ko, title_en, content_ko, content_en, type, display_type, is_pinned, is_active, start_date, end_date, target_roles, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title_ko, title_en, content_ko, content_en, type, display_type, is_pinned, is_active, start_date, end_date, target_roles, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      title_ko,
      title_en,
      content_ko,
      content_en,
      type,
      display_type,
      is_pinned,
      is_active,
      start_date,
      end_date,
      target_roles,
    } = req.body;

    const result = await db.query(
      `UPDATE announcements SET
        title_ko = COALESCE($1, title_ko),
        title_en = COALESCE($2, title_en),
        content_ko = COALESCE($3, content_ko),
        content_en = COALESCE($4, content_en),
        type = COALESCE($5, type),
        display_type = COALESCE($6, display_type),
        is_pinned = COALESCE($7, is_pinned),
        is_active = COALESCE($8, is_active),
        start_date = COALESCE($9, start_date),
        end_date = COALESCE($10, end_date),
        target_roles = COALESCE($11, target_roles)
       WHERE id = $12
       RETURNING *`,
      [
        title_ko, title_en, content_ko, content_en, type, display_type,
        is_pinned, is_active, start_date, end_date, target_roles, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE announcements SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

router.post('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      `INSERT INTO announcement_reads (user_id, announcement_id)
       VALUES ($1, $2) ON CONFLICT (user_id, announcement_id) DO UPDATE SET read_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
