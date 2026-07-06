const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const isAdmin = (user) => ['admin'].includes(user.role);

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (category) {
      params.push(category);
      where += ` AND c.category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (c.title_ko ILIKE $${params.length} OR c.title_en ILIKE $${params.length})`;
    }

    const result = await db.query(
      `SELECT c.*, u.name_ko as instructor_name, u.email as instructor_email
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );

    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Get courses error:', error);
    res.json({ courses: [] });
  }
});

router.get('/enrollments', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ce.*, c.title_ko, c.title_en, c.thumbnail_url
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.user_id = $1
       ORDER BY ce.last_accessed_at DESC NULLS LAST, ce.started_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name_ko as instructor_name, u.email as instructor_email
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await db.query('UPDATE courses SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

router.post('/', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const {
      title_ko,
      title_en,
      description_ko,
      description_en,
      category,
      type = 'video',
      duration_minutes,
      thumbnail_url,
      video_url,
      document_url,
      file_size,
      is_featured = false,
      instructor_id,
    } = req.body;

    const ownerId = isAdmin(req.user) && instructor_id ? instructor_id : req.user.id;

    const result = await db.query(
      `INSERT INTO courses (
        title_ko, title_en, description_ko, description_en, category, type,
        duration_minutes, thumbnail_url, video_url, document_url, file_size,
        is_featured, instructor_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title_ko, title_en, description_ko, description_en, category, type,
        duration_minutes, thumbnail_url, video_url, document_url, file_size,
        is_featured, ownerId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const course = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [req.params.id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!isAdmin(req.user) && course.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the lecturer owner or admin can edit this class' });
    }

    const {
      title_ko, title_en, description_ko, description_en, category, type,
      duration_minutes, thumbnail_url, video_url, document_url, file_size,
      is_featured, instructor_id,
    } = req.body;

    const result = await db.query(
      `UPDATE courses SET
        title_ko = COALESCE($1, title_ko),
        title_en = COALESCE($2, title_en),
        description_ko = COALESCE($3, description_ko),
        description_en = COALESCE($4, description_en),
        category = COALESCE($5, category),
        type = COALESCE($6, type),
        duration_minutes = COALESCE($7, duration_minutes),
        thumbnail_url = COALESCE($8, thumbnail_url),
        video_url = COALESCE($9, video_url),
        document_url = COALESCE($10, document_url),
        file_size = COALESCE($11, file_size),
        is_featured = COALESCE($12, is_featured),
        instructor_id = COALESCE($13, instructor_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        title_ko, title_en, description_ko, description_en, category, type,
        duration_minutes, thumbnail_url, video_url, document_url, file_size,
        is_featured, isAdmin(req.user) ? instructor_id : undefined, req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM courses WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `INSERT INTO course_enrollments (user_id, course_id, last_accessed_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET last_accessed_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

router.put('/:id/progress', authenticate, async (req, res) => {
  try {
    const { progress_percent = 0, is_completed = false } = req.body;
    const result = await db.query(
      `INSERT INTO course_enrollments (user_id, course_id, progress_percent, is_completed, last_accessed_at, completed_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END)
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET progress_percent = $3, is_completed = $4, last_accessed_at = CURRENT_TIMESTAMP,
         completed_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE course_enrollments.completed_at END
       RETURNING *`,
      [req.user.id, req.params.id, progress_percent, is_completed]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
