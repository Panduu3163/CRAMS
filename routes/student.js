const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, isStudent } = require('../middleware/auth');

const router = express.Router();

// Get student's course selections
router.get('/selections', authenticateToken, isStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cs.*, c.course_code, c.course_name, c.credits, c.department, 
              c.schedule_days, c.schedule_time, c.instructor, c.semester, c.year,
              u.first_name as advisor_first_name, u.last_name as advisor_last_name
       FROM course_selections cs
       JOIN courses c ON cs.course_id = c.id
       LEFT JOIN users u ON cs.advisor_id = u.id
       WHERE cs.student_id = $1
       ORDER BY cs.priority, cs.selected_at`,
      [req.user.id]
    );

    res.json({ selections: result.rows });
  } catch (error) {
    console.error('Error fetching student selections:', error);
    res.status(500).json({ message: 'Server error fetching selections' });
  }
});

// Select a course
router.post('/select-course', authenticateToken, isStudent, async (req, res) => {
  try {
    const { courseId, priority } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Check if course exists and is active
    const courseResult = await pool.query(
      'SELECT id, course_code, course_name, max_capacity, current_enrollment FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found or inactive' });
    }

    const course = courseResult.rows[0];

    // Check if student already selected this course
    const existingSelection = await pool.query(
      'SELECT id FROM course_selections WHERE student_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (existingSelection.rows.length > 0) {
      return res.status(400).json({ message: 'Course already selected' });
    }

    // Insert course selection
    const result = await pool.query(
      `INSERT INTO course_selections (student_id, course_id, priority)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, courseId, priority || 1]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        'Course Selection Submitted',
        `Your selection for ${course.course_code} - ${course.course_name} has been submitted for advisor review.`,
        'course_selection'
      ]
    );

    res.status(201).json({
      message: 'Course selected successfully',
      selection: result.rows[0]
    });
  } catch (error) {
    console.error('Error selecting course:', error);
    res.status(500).json({ message: 'Server error selecting course' });
  }
});

// Remove course selection
router.delete('/selections/:id', authenticateToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM course_selections WHERE id = $1 AND student_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Selection not found' });
    }

    res.json({ message: 'Course selection removed successfully' });
  } catch (error) {
    console.error('Error removing selection:', error);
    res.status(500).json({ message: 'Server error removing selection' });
  }
});

// Update selection priority
router.put('/selections/:id/priority', authenticateToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || priority < 1) {
      return res.status(400).json({ message: 'Valid priority is required' });
    }

    const result = await pool.query(
      'UPDATE course_selections SET priority = $1 WHERE id = $2 AND student_id = $3 RETURNING *',
      [priority, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Selection not found' });
    }

    res.json({
      message: 'Priority updated successfully',
      selection: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ message: 'Server error updating priority' });
  }
});

// Get student's notifications
router.get('/notifications', authenticateToken, isStudent, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// Get student's schedule
router.get('/schedule', authenticateToken, isStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.course_code, c.course_name, c.credits, c.schedule_days, 
              c.schedule_time, c.instructor, c.department
       FROM course_selections cs
       JOIN courses c ON cs.course_id = c.id
       WHERE cs.student_id = $1 AND cs.status = 'approved'
       ORDER BY c.schedule_days, c.schedule_time`,
      [req.user.id]
    );

    res.json({ schedule: result.rows });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error fetching schedule' });
  }
});

// Get student's advisor
router.get('/advisor', authenticateToken, isStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.department
       FROM advisor_assignments aa
       JOIN users u ON aa.advisor_id = u.id
       WHERE aa.student_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No advisor assigned' });
    }

    res.json({ advisor: result.rows[0] });
  } catch (error) {
    console.error('Error fetching advisor:', error);
    res.status(500).json({ message: 'Server error fetching advisor' });
  }
});

module.exports = router;
