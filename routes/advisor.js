const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, isAdvisor, isAdvisorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all pending course selections for advisor's students
router.get('/pending-selections', authenticateToken, isAdvisorOrAdmin, async (req, res) => {
  try {
    let query = `
      SELECT cs.*, c.course_code, c.course_name, c.credits, c.department, 
             c.schedule_days, c.schedule_time, c.instructor, c.semester, c.year,
             c.max_capacity, c.current_enrollment,
             u.first_name as student_first_name, u.last_name as student_last_name,
             u.student_id, u.email as student_email
      FROM course_selections cs
      JOIN courses c ON cs.course_id = c.id
      JOIN users u ON cs.student_id = u.id
      WHERE cs.status = 'pending'
    `;

    const params = [];
    
    // If user is advisor (not admin), only show their assigned students
    if (req.user.role === 'advisor') {
      query += ` AND EXISTS (
        SELECT 1 FROM advisor_assignments aa 
        WHERE aa.student_id = cs.student_id AND aa.advisor_id = $1
      )`;
      params.push(req.user.id);
    }

    query += ' ORDER BY cs.selected_at ASC';

    const result = await pool.query(query, params);

    res.json({ selections: result.rows });
  } catch (error) {
    console.error('Error fetching pending selections:', error);
    res.status(500).json({ message: 'Server error fetching pending selections' });
  }
});

// Approve or reject course selection
router.put('/selections/:id/review', authenticateToken, isAdvisorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }

    // Get selection details
    const selectionResult = await pool.query(
      `SELECT cs.*, c.course_code, c.course_name, c.max_capacity, c.current_enrollment,
              u.first_name, u.last_name
       FROM course_selections cs
       JOIN courses c ON cs.course_id = c.id
       JOIN users u ON cs.student_id = u.id
       WHERE cs.id = $1`,
      [id]
    );

    if (selectionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Selection not found' });
    }

    const selection = selectionResult.rows[0];

    // If advisor role, check if they're assigned to this student
    if (req.user.role === 'advisor') {
      const assignmentCheck = await pool.query(
        'SELECT 1 FROM advisor_assignments WHERE student_id = $1 AND advisor_id = $2',
        [selection.student_id, req.user.id]
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to review this student\'s selections' });
      }
    }

    // Check if course is full for approval
    if (status === 'approved' && selection.current_enrollment >= selection.max_capacity) {
      return res.status(400).json({ 
        message: 'Cannot approve - course is at maximum capacity. Consider waitlisting.' 
      });
    }

    // Update selection
    const updateResult = await pool.query(
      `UPDATE course_selections 
       SET status = $1, advisor_id = $2, advisor_comments = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, req.user.id, comments, id]
    );

    // If approved, increment course enrollment
    if (status === 'approved') {
      await pool.query(
        'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
        [selection.course_id]
      );
    }

    // Create notification for student
    const notificationTitle = status === 'approved' ? 'Course Selection Approved' : 'Course Selection Rejected';
    const notificationMessage = status === 'approved' 
      ? `Your selection for ${selection.course_code} - ${selection.course_name} has been approved.`
      : `Your selection for ${selection.course_code} - ${selection.course_name} has been rejected. ${comments ? 'Reason: ' + comments : ''}`;

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [selection.student_id, notificationTitle, notificationMessage, 'course_review']
    );

    res.json({
      message: `Selection ${status} successfully`,
      selection: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error reviewing selection:', error);
    res.status(500).json({ message: 'Server error reviewing selection' });
  }
});

// Get advisor's assigned students
router.get('/students', authenticateToken, isAdvisor, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.student_id, 
              u.department, u.year_level, aa.assigned_at
       FROM advisor_assignments aa
       JOIN users u ON aa.student_id = u.id
       WHERE aa.advisor_id = $1
       ORDER BY u.last_name, u.first_name`,
      [req.user.id]
    );

    res.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// Get specific student's course selections
router.get('/students/:studentId/selections', authenticateToken, isAdvisorOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;

    // If advisor role, check if they're assigned to this student
    if (req.user.role === 'advisor') {
      const assignmentCheck = await pool.query(
        'SELECT 1 FROM advisor_assignments WHERE student_id = $1 AND advisor_id = $2',
        [studentId, req.user.id]
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized to view this student\'s selections' });
      }
    }

    const result = await pool.query(
      `SELECT cs.*, c.course_code, c.course_name, c.credits, c.department, 
              c.schedule_days, c.schedule_time, c.instructor, c.semester, c.year,
              u.first_name as advisor_first_name, u.last_name as advisor_last_name
       FROM course_selections cs
       JOIN courses c ON cs.course_id = c.id
       LEFT JOIN users u ON cs.advisor_id = u.id
       WHERE cs.student_id = $1
       ORDER BY cs.priority, cs.selected_at`,
      [studentId]
    );

    res.json({ selections: result.rows });
  } catch (error) {
    console.error('Error fetching student selections:', error);
    res.status(500).json({ message: 'Server error fetching student selections' });
  }
});

// Get advisor statistics
router.get('/statistics', authenticateToken, isAdvisorOrAdmin, async (req, res) => {
  try {
    let baseQuery = '';
    let params = [];

    if (req.user.role === 'advisor') {
      baseQuery = `
        AND EXISTS (
          SELECT 1 FROM advisor_assignments aa 
          WHERE aa.student_id = cs.student_id AND aa.advisor_id = $1
        )
      `;
      params.push(req.user.id);
    }

    // Get pending selections count
    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM course_selections cs WHERE cs.status = 'pending' ${baseQuery}`,
      params
    );

    // Get approved selections count
    const approvedResult = await pool.query(
      `SELECT COUNT(*) as count FROM course_selections cs WHERE cs.status = 'approved' ${baseQuery}`,
      params
    );

    // Get rejected selections count
    const rejectedResult = await pool.query(
      `SELECT COUNT(*) as count FROM course_selections cs WHERE cs.status = 'rejected' ${baseQuery}`,
      params
    );

    // Get assigned students count (for advisors only)
    let assignedStudentsCount = 0;
    if (req.user.role === 'advisor') {
      const studentsResult = await pool.query(
        'SELECT COUNT(*) as count FROM advisor_assignments WHERE advisor_id = $1',
        [req.user.id]
      );
      assignedStudentsCount = parseInt(studentsResult.rows[0].count);
    }

    res.json({
      statistics: {
        pendingSelections: parseInt(pendingResult.rows[0].count),
        approvedSelections: parseInt(approvedResult.rows[0].count),
        rejectedSelections: parseInt(rejectedResult.rows[0].count),
        assignedStudents: assignedStudentsCount
      }
    });
  } catch (error) {
    console.error('Error fetching advisor statistics:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// Bulk approve/reject selections
router.put('/selections/bulk-review', authenticateToken, isAdvisorOrAdmin, async (req, res) => {
  try {
    const { selectionIds, status, comments } = req.body;

    if (!selectionIds || !Array.isArray(selectionIds) || selectionIds.length === 0) {
      return res.status(400).json({ message: 'Selection IDs array is required' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const selectionId of selectionIds) {
        // Get selection details
        const selectionResult = await client.query(
          `SELECT cs.*, c.course_code, c.course_name, c.max_capacity, c.current_enrollment
           FROM course_selections cs
           JOIN courses c ON cs.course_id = c.id
           WHERE cs.id = $1`,
          [selectionId]
        );

        if (selectionResult.rows.length === 0) continue;

        const selection = selectionResult.rows[0];

        // Check authorization for advisors
        if (req.user.role === 'advisor') {
          const assignmentCheck = await client.query(
            'SELECT 1 FROM advisor_assignments WHERE student_id = $1 AND advisor_id = $2',
            [selection.student_id, req.user.id]
          );

          if (assignmentCheck.rows.length === 0) continue;
        }

        // Skip if course is full and trying to approve
        if (status === 'approved' && selection.current_enrollment >= selection.max_capacity) {
          continue;
        }

        // Update selection
        await client.query(
          `UPDATE course_selections 
           SET status = $1, advisor_id = $2, advisor_comments = $3, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [status, req.user.id, comments, selectionId]
        );

        // If approved, increment course enrollment
        if (status === 'approved') {
          await client.query(
            'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
            [selection.course_id]
          );
        }

        // Create notification
        const notificationTitle = status === 'approved' ? 'Course Selection Approved' : 'Course Selection Rejected';
        const notificationMessage = status === 'approved' 
          ? `Your selection for ${selection.course_code} - ${selection.course_name} has been approved.`
          : `Your selection for ${selection.course_code} - ${selection.course_name} has been rejected. ${comments ? 'Reason: ' + comments : ''}`;

        await client.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [selection.student_id, notificationTitle, notificationMessage, 'course_review']
        );
      }

      await client.query('COMMIT');

      res.json({ message: `Bulk ${status} completed successfully` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in bulk review:', error);
    res.status(500).json({ message: 'Server error in bulk review' });
  }
});

module.exports = router;
