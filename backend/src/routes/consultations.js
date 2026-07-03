const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// ─── Get user's consultations ────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.name_ko as consultant_name, u.department as consultant_department
      FROM consultations c
      LEFT JOIN users u ON c.consultant_id = u.id
      WHERE c.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY c.scheduled_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ error: 'Failed to get consultations' });
  }
});

// ─── Get all consultations (admin/consultant) ────────────────────────────────
router.get('/all', authenticate, authorize('admin', 'instructor', 'hr_manager'), async (req, res) => {
  try {
    const { status, consultant_id, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*,
             u.name_ko as user_name, u.email as user_email,
             cu.name_ko as consultant_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users cu ON c.consultant_id = cu.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (consultant_id) {
      query += ` AND c.consultant_id = $${paramIndex++}`;
      params.push(consultant_id);
    }
    if (date) {
      query += ` AND DATE(c.scheduled_at) = $${paramIndex++}`;
      params.push(date);
    }

    query += ` ORDER BY c.scheduled_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all consultations error:', error);
    res.status(500).json({ error: 'Failed to get consultations' });
  }
});

// ─── Get available consultants ───────────────────────────────────────────────
router.get('/consultants', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name_ko, u.name_en, u.department, u.position, u.profile_image,
              COUNT(c.id) FILTER (WHERE c.status = '완료') as completed_consultations
       FROM users u
       LEFT JOIN consultations c ON c.consultant_id = u.id
       WHERE u.role IN ('instructor', 'hr_manager') AND u.status = 'active'
       GROUP BY u.id
       ORDER BY u.name_ko`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get consultants error:', error);
    res.status(500).json({ error: 'Failed to get consultants' });
  }
});

// ─── Admin: Consultation statistics matrix ───────────────────────────────────
router.get('/admin/stats', authenticate, authorize('admin', 'hr_manager'), async (req, res) => {
  try {
    const matrix = await db.query(
      `SELECT
         cu.id as consultant_id,
         cu.name_ko as consultant_name,
         cu.department,
         COUNT(c.id) as total,
         COUNT(c.id) FILTER (WHERE c.status = '완료') as completed,
         COUNT(c.id) FILTER (WHERE c.status = '예약됨') as scheduled,
         COUNT(c.id) FILTER (WHERE c.status = '취소') as cancelled,
         COUNT(c.id) FILTER (WHERE c.status = '노쇼') as no_show,
         COUNT(c.id) FILTER (WHERE c.method = '온라인') as online_count,
         COUNT(c.id) FILTER (WHERE c.method = '오프라인') as offline_count,
         COUNT(c.id) FILTER (WHERE c.method = '전화') as call_count
       FROM users cu
       LEFT JOIN consultations c ON c.consultant_id = cu.id
       WHERE cu.role IN ('instructor', 'hr_manager') AND cu.status = 'active'
       GROUP BY cu.id, cu.name_ko, cu.department
       ORDER BY total DESC`
    );

    const summary = await db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = '완료') as completed,
         COUNT(*) FILTER (WHERE status = '예약됨') as scheduled,
         COUNT(*) FILTER (WHERE status = '취소') as cancelled
       FROM consultations`
    );

    res.json({ matrix: matrix.rows, summary: summary.rows[0] });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ─── Admin: Get consultations for a specific consultant ──────────────────────
router.get('/admin/by-consultant/:consultantId', authenticate, authorize('admin', 'hr_manager'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*,
              u.name_ko as user_name, u.email as user_email,
              cu.name_ko as consultant_name
       FROM consultations c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN users cu ON c.consultant_id = cu.id
       WHERE c.consultant_id = $1
       ORDER BY c.scheduled_at DESC`,
      [req.params.consultantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get consultant consultations error:', error);
    res.status(500).json({ error: 'Failed to get consultations' });
  }
});

// ─── Get consultant availability ─────────────────────────────────────────────
router.get('/availability/:consultantId', authenticate, async (req, res) => {
  try {
    const { consultantId } = req.params;
    const { date_from, date_to } = req.query;

    let query = `
      SELECT ca.*, u.name_ko as consultant_name
      FROM consultant_availability ca
      JOIN users u ON ca.consultant_id = u.id
      WHERE ca.consultant_id = $1 AND ca.is_booked = FALSE
    `;
    const params = [consultantId];
    let paramIndex = 2;

    if (date_from) {
      query += ` AND ca.available_date >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND ca.available_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ` ORDER BY ca.available_date, ca.start_time`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// ─── Publish availability slots (consultant only) ────────────────────────────
router.post('/availability', authenticate, authorize('instructor', 'hr_manager', 'admin'), async (req, res) => {
  try {
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Slots array is required' });
    }

    const results = [];
    for (const slot of slots) {
      const existing = await db.query(
        `SELECT id FROM consultant_availability
         WHERE consultant_id = $1 AND available_date = $2 AND start_time = $3`,
        [req.user.id, slot.date, slot.start_time]
      );

      if (existing.rows.length === 0) {
        const result = await db.query(
          `INSERT INTO consultant_availability (consultant_id, available_date, start_time, end_time)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [req.user.id, slot.date, slot.start_time, slot.end_time]
        );
        results.push(result.rows[0]);
      }
    }

    res.status(201).json(results);
  } catch (error) {
    console.error('Publish availability error:', error);
    res.status(500).json({ error: 'Failed to publish availability' });
  }
});

// ─── Get my availability (for consultant) ────────────────────────────────────
router.get('/my-availability', authenticate, authorize('instructor', 'hr_manager', 'admin'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = `
      SELECT ca.*, c.user_id, u.name_ko as booked_by_name
      FROM consultant_availability ca
      LEFT JOIN consultations c ON ca.consultation_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE ca.consultant_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (date_from) {
      query += ` AND ca.available_date >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND ca.available_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ` ORDER BY ca.available_date, ca.start_time`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get my availability error:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// ─── Delete availability slot ────────────────────────────────────────────────
router.delete('/availability/:id', authenticate, authorize('instructor', 'hr_manager', 'admin'), async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM consultant_availability
       WHERE id = $1 AND consultant_id = $2 AND is_booked = FALSE
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found or already booked' });
    }
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// ─── Book consultation (user picks available slot) ───────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { consultant_id, slot_id, topic, method } = req.body;

    // Find the slot
    const slotResult = await db.query(
      `SELECT * FROM consultant_availability
       WHERE id = $1 AND consultant_id = $2 AND is_booked = FALSE`,
      [slot_id, consultant_id]
    );

    if (slotResult.rows.length === 0) {
      return res.status(400).json({ error: 'Time slot is not available' });
    }

    const slot = slotResult.rows[0];
    const scheduled_at = `${slot.available_date}T${slot.start_time}`;

    const result = await db.query(
      `INSERT INTO consultations (user_id, consultant_id, scheduled_at, duration_minutes, topic, method)
       VALUES ($1, $2, $3, 30, $4, $5)
       RETURNING *`,
      [req.user.id, consultant_id, scheduled_at, topic, method || '온라인']
    );

    // Mark slot as booked
    await db.query(
      `UPDATE consultant_availability SET is_booked = TRUE, consultation_id = $1 WHERE id = $2`,
      [result.rows[0].id, slot_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({ error: 'Failed to book consultation' });
  }
});

// ─── Get consultation detail with records ────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await db.query(
      `SELECT c.*,
              u.name_ko as user_name, u.email as user_email, u.phone as user_phone,
              cu.name_ko as consultant_name, cu.department as consultant_department
       FROM consultations c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN users cu ON c.consultant_id = cu.id
       WHERE c.id = $1`,
      [id]
    );

    if (consultation.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const c = consultation.rows[0];
    const isParticipant = c.user_id === req.user.id || c.consultant_id === req.user.id;
    const isAdmin = ['admin', 'hr_manager'].includes(req.user.role);
    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const records = await db.query(
      `SELECT cr.*, u.name_ko as author_name
       FROM consultation_records cr
       LEFT JOIN users u ON cr.author_id = u.id
       WHERE cr.consultation_id = $1
       ORDER BY cr.created_at ASC`,
      [id]
    );

    res.json({ ...c, records: records.rows });
  } catch (error) {
    console.error('Get consultation detail error:', error);
    res.status(500).json({ error: 'Failed to get consultation detail' });
  }
});

// ─── Update consultation ─────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, summary, notes, method } = req.body;

    const check = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const consultation = check.rows[0];
    const isOwner = consultation.user_id === req.user.id;
    const isConsultant = consultation.consultant_id === req.user.id;
    const isAdmin = ['admin', 'hr_manager'].includes(req.user.role);

    if (!isOwner && !isConsultant && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `UPDATE consultations
       SET status = COALESCE($1, status),
           summary = COALESCE($2, summary),
           notes = COALESCE($3, notes),
           method = COALESCE($4, method),
           completed_at = CASE WHEN $1 = '완료' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $5
       RETURNING *`,
      [status, summary, notes, method, id]
    );

    // If cancelled, free up the availability slot
    if (status === '취소') {
      await db.query(
        `UPDATE consultant_availability SET is_booked = FALSE, consultation_id = NULL WHERE consultation_id = $1`,
        [id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
});

// ─── Cancel consultation ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE consultations SET status = '취소'
       WHERE id = $1 AND user_id = $2 AND status = '예약됨'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found or cannot be cancelled' });
    }

    // Free up slot
    await db.query(
      `UPDATE consultant_availability SET is_booked = FALSE, consultation_id = NULL WHERE consultation_id = $1`,
      [id]
    );

    res.json({ message: 'Consultation cancelled' });
  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({ error: 'Failed to cancel consultation' });
  }
});

// ─── Add consultation record ─────────────────────────────────────────────────
router.post('/:id/records', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { record_type, content, file_url, file_name } = req.body;

    const check = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const c = check.rows[0];
    const isParticipant = c.user_id === req.user.id || c.consultant_id === req.user.id;
    const isAdmin = ['admin', 'hr_manager'].includes(req.user.role);
    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `INSERT INTO consultation_records (consultation_id, author_id, record_type, content, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, req.user.id, record_type || 'text', content, file_url, file_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add record error:', error);
    res.status(500).json({ error: 'Failed to add record' });
  }
});

module.exports = router;
