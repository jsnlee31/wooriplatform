const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY posted_at DESC');
    res.json({ jobs: result.rows });
  } catch (error) {
    res.json({ jobs: [] });
  }
});

router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE COALESCE(is_active, TRUE) = TRUE ORDER BY posted_at DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

router.get('/bookmarks', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.* FROM job_bookmarks jb JOIN jobs j ON j.id = jb.job_id WHERE jb.user_id = $1 ORDER BY jb.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { company_name, title_ko, title_en, description_ko, description_en, category, employment_type, location, salary_range, requirements, benefits, contact_info, external_url, deadline } = req.body;
    const result = await db.query(
      `INSERT INTO jobs (company_name, title_ko, title_en, description_ko, description_en, category, employment_type, location, salary_range, requirements, benefits, contact_info, external_url, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [company_name, title_ko, title_en, description_ko, description_en, category, employment_type, location, salary_range, requirements, benefits, contact_info, external_url, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      company_name,
      title_ko,
      title_en,
      description_ko,
      description_en,
      category,
      employment_type,
      location,
      salary_range,
      requirements,
      benefits,
      contact_info,
      external_url,
      deadline,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE jobs SET
        company_name = COALESCE($1, company_name),
        title_ko = COALESCE($2, title_ko),
        title_en = COALESCE($3, title_en),
        description_ko = COALESCE($4, description_ko),
        description_en = COALESCE($5, description_en),
        category = COALESCE($6, category),
        employment_type = COALESCE($7, employment_type),
        location = COALESCE($8, location),
        salary_range = COALESCE($9, salary_range),
        requirements = COALESCE($10, requirements),
        benefits = COALESCE($11, benefits),
        contact_info = COALESCE($12, contact_info),
        external_url = COALESCE($13, external_url),
        deadline = COALESCE($14, deadline),
        is_active = COALESCE($15, is_active)
       WHERE id = $16
       RETURNING *`,
      [
        company_name, title_ko, title_en, description_ko, description_en,
        category, employment_type, location, salary_range, requirements,
        benefits, contact_info, external_url, deadline, is_active, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE jobs SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

router.post('/:id/bookmark', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `INSERT INTO job_bookmarks (user_id, job_id) VALUES ($1, $2)
       ON CONFLICT (user_id, job_id) DO NOTHING RETURNING *`,
      [req.user.id, req.params.id]
    );
    res.status(201).json(result.rows[0] || { bookmarked: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark job' });
  }
});

router.delete('/:id/bookmark', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM job_bookmarks WHERE user_id = $1 AND job_id = $2', [req.user.id, req.params.id]);
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

router.post('/:id/apply', authenticate, async (req, res) => {
  try {
    const { resume_id, cover_letter } = req.body;
    const result = await db.query(
      'INSERT INTO job_applications (user_id, job_id, resume_id, cover_letter) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, req.params.id, resume_id, cover_letter]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply' });
  }
});

module.exports = router;
