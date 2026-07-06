const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/home', authenticate, async (req, res) => {
  try {
    const [courses, enrollments] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM courses'),
      db.query('SELECT COUNT(*)::int AS count FROM course_enrollments WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({
      user: req.user,
      stats: {
        courses: courses.rows[0].count,
        enrolledCourses: enrollments.rows[0].count,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/stats', authenticate, authorize('admin', 'hr_manager'), async (req, res) => {
  try {
    const [users, courses, enrollments] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM users'),
      db.query('SELECT COUNT(*)::int AS count FROM courses'),
      db.query('SELECT COUNT(*)::int AS count FROM course_enrollments'),
    ]);
    res.json({
      users: users.rows[0].count,
      courses: courses.rows[0].count,
      enrollments: enrollments.rows[0].count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/calendar', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY start_date ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

module.exports = router;
