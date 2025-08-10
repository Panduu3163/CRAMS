const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard statistics
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get total users by role
    const usersResult = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       GROUP BY role`
    );

    // Get total courses
    const coursesResult = await pool.query(
      'SELECT COUNT(*) as count FROM courses WHERE is_active = true'
    );

    // Get course selections by status
    const selectionsResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM course_selections 
       GROUP BY status`
    );

    // Get enrollment statistics
    const enrollmentResult = await pool.query(
      `SELECT 
         SUM(current_enrollment) as total_enrolled,
         SUM(max_capacity) as total_capacity,
         COUNT(*) as total_courses
       FROM courses 
       WHERE is_active = true`
    );

    // Get recent activities
    const recentActivitiesResult = await pool.query(
      `SELECT 
         cs.id,
         cs.status,
         cs.selected_at,
         cs.reviewed_at,
         c.course_code,
         c.course_name,
         u1.first_name as student_first_name,
         u1.last_name as student_last_name,
         u2.first_name as advisor_first_name,
         u2.last_name as advisor_last_name
       FROM course_selections cs
       JOIN courses c ON cs.course_id = c.id
       JOIN users u1 ON cs.student_id = u1.id
       LEFT JOIN users u2 ON cs.advisor_id = u2.id
       ORDER BY COALESCE(cs.reviewed_at, cs.selected_at) DESC
       LIMIT 10`
    );

    const userStats = {};
    usersResult.rows.forEach(row => {
      userStats[row.role] = parseInt(row.count);
    });

    const selectionStats = {};
    selectionsResult.rows.forEach(row => {
      selectionStats[row.status] = parseInt(row.count);
    });

    const enrollment = enrollmentResult.rows[0];

    res.json({
      statistics: {
        users: userStats,
        totalCourses: parseInt(coursesResult.rows[0].count),
        selections: selectionStats,
        enrollment: {
          totalEnrolled: parseInt(enrollment.total_enrolled || 0),
          totalCapacity: parseInt(enrollment.total_capacity || 0),
          utilizationRate: enrollment.total_capacity > 0 
            ? ((enrollment.total_enrolled / enrollment.total_capacity) * 100).toFixed(2)
            : 0
        },
        recentActivities: recentActivitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Get all users with pagination and filters
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, department, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, first_name, last_name, role, student_id, department, year_level, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }

    if (search) {
      paramCount++;
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR student_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT id, email, first_name, last_name, role, student_id, department, year_level, created_at FROM users', 'SELECT COUNT(*) FROM users');
    const countResult = await pool.query(countQuery, params);
    const totalUsers = parseInt(countResult.rows[0].count);

    // Add pagination
    paramCount++;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: (page * limit) < totalUsers,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Create new user
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      studentId, 
      department, 
      yearLevel 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        message: 'Email, password, first name, last name, and role are required' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR student_id = $2',
      [email, studentId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        message: 'User with this email or student ID already exists' 
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, student_id, department, year_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, first_name, last_name, role, student_id, department, year_level`,
      [email, hashedPassword, firstName, lastName, role, studentId, department, yearLevel]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, department, yearLevel } = req.body;

    const result = await pool.query(
      `UPDATE users SET 
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         role = COALESCE($3, role),
         department = COALESCE($4, department),
         year_level = COALESCE($5, year_level),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, email, first_name, last_name, role, student_id, department, year_level`,
      [firstName, lastName, role, department, yearLevel, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// Assign advisor to student
router.post('/assign-advisor', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { studentId, advisorId } = req.body;

    if (!studentId || !advisorId) {
      return res.status(400).json({ message: 'Student ID and Advisor ID are required' });
    }

    // Verify student and advisor exist
    const studentResult = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2',
      [studentId, 'student']
    );

    const advisorResult = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2',
      [advisorId, 'advisor']
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (advisorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await pool.query(
      'SELECT id FROM advisor_assignments WHERE student_id = $1 AND advisor_id = $2',
      [studentId, advisorId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ message: 'This advisor is already assigned to this student' });
    }

    // Create assignment
    await pool.query(
      'INSERT INTO advisor_assignments (student_id, advisor_id) VALUES ($1, $2)',
      [studentId, advisorId]
    );

    // Create notification for student
    const student = studentResult.rows[0];
    const advisor = advisorResult.rows[0];

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        studentId,
        'Advisor Assigned',
        `${advisor.first_name} ${advisor.last_name} has been assigned as your academic advisor.`,
        'advisor_assignment'
      ]
    );

    res.status(201).json({
      message: 'Advisor assigned successfully',
      assignment: {
        student: student,
        advisor: advisor
      }
    });
  } catch (error) {
    console.error('Error assigning advisor:', error);
    res.status(500).json({ message: 'Server error assigning advisor' });
  }
});

// Get all advisor assignments
router.get('/advisor-assignments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT aa.id, aa.assigned_at,
              s.id as student_id, s.first_name as student_first_name, s.last_name as student_last_name,
              s.email as student_email, s.student_id as student_number,
              a.id as advisor_id, a.first_name as advisor_first_name, a.last_name as advisor_last_name,
              a.email as advisor_email
       FROM advisor_assignments aa
       JOIN users s ON aa.student_id = s.id
       JOIN users a ON aa.advisor_id = a.id
       ORDER BY aa.assigned_at DESC`
    );

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Error fetching advisor assignments:', error);
    res.status(500).json({ message: 'Server error fetching assignments' });
  }
});

// Remove advisor assignment
router.delete('/advisor-assignments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM advisor_assignments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Advisor assignment removed successfully' });
  } catch (error) {
    console.error('Error removing advisor assignment:', error);
    res.status(500).json({ message: 'Server error removing assignment' });
  }
});

// Get system reports
router.get('/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let report = {};

    switch (type) {
      case 'enrollment':
        // Course enrollment report
        const enrollmentReport = await pool.query(
          `SELECT c.course_code, c.course_name, c.department, c.max_capacity, 
                  c.current_enrollment, c.instructor,
                  (c.current_enrollment::float / c.max_capacity * 100) as utilization_rate
           FROM courses c 
           WHERE c.is_active = true
           ORDER BY utilization_rate DESC`
        );
        report.enrollmentData = enrollmentReport.rows;
        break;

      case 'advisor_activity':
        // Advisor activity report
        const advisorReport = await pool.query(
          `SELECT u.first_name, u.last_name, u.email,
                  COUNT(cs.id) as total_reviews,
                  COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) as approved_count,
                  COUNT(CASE WHEN cs.status = 'rejected' THEN 1 END) as rejected_count,
                  COUNT(aa.student_id) as assigned_students
           FROM users u
           LEFT JOIN course_selections cs ON u.id = cs.advisor_id
           LEFT JOIN advisor_assignments aa ON u.id = aa.advisor_id
           WHERE u.role = 'advisor'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY total_reviews DESC`
        );
        report.advisorData = advisorReport.rows;
        break;

      case 'student_progress':
        // Student progress report
        const progressReport = await pool.query(
          `SELECT u.first_name, u.last_name, u.student_id, u.department, u.year_level,
                  COUNT(cs.id) as total_selections,
                  COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) as approved_courses,
                  COUNT(CASE WHEN cs.status = 'pending' THEN 1 END) as pending_courses,
                  COUNT(CASE WHEN cs.status = 'rejected' THEN 1 END) as rejected_courses
           FROM users u
           LEFT JOIN course_selections cs ON u.id = cs.student_id
           WHERE u.role = 'student'
           GROUP BY u.id, u.first_name, u.last_name, u.student_id, u.department, u.year_level
           ORDER BY u.last_name, u.first_name`
        );
        report.studentData = progressReport.rows;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
});

// Get schedule statistics
router.get('/schedule-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get popular time slots
    const timeSlotStats = await pool.query(
      `SELECT 
         schedule_time,
         COUNT(*) as course_count,
         SUM(current_enrollment) as total_enrolled
       FROM courses 
       WHERE is_active = true AND schedule_time IS NOT NULL
       GROUP BY schedule_time
       ORDER BY course_count DESC
       LIMIT 10`
    );

    // Get department distribution
    const departmentStats = await pool.query(
      `SELECT 
         department,
         COUNT(*) as course_count,
         AVG(current_enrollment::float / max_capacity * 100) as avg_utilization
       FROM courses 
       WHERE is_active = true
       GROUP BY department
       ORDER BY course_count DESC`
    );

    // Get schedule conflicts (courses with overlapping times)
    const conflicts = await pool.query(
      `SELECT 
         c1.id as course1_id,
         c1.course_code as course1_code,
         c1.course_name as course1_name,
         c1.schedule_time as course1_time,
         c1.schedule_days as course1_days,
         c2.id as course2_id,
         c2.course_code as course2_code,
         c2.course_name as course2_name,
         c2.schedule_time as course2_time,
         c2.schedule_days as course2_days
       FROM courses c1
       JOIN courses c2 ON c1.id < c2.id
       WHERE c1.is_active = true 
         AND c2.is_active = true
         AND c1.schedule_time = c2.schedule_time
         AND c1.schedule_days && c2.schedule_days`
    );

    res.json({
      timeSlots: timeSlotStats.rows,
      departments: departmentStats.rows,
      conflicts: conflicts.rows
    });
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({ message: 'Server error fetching schedule statistics' });
  }
});

// Get seat allocation conflicts
router.get('/seat-conflicts', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get over-enrolled courses
    const overEnrolled = await pool.query(
      `SELECT 
         c.*,
         (c.current_enrollment - c.max_capacity) as overflow,
         COUNT(cs.id) as pending_requests
       FROM courses c
       LEFT JOIN course_selections cs ON c.id = cs.course_id AND cs.status = 'pending'
       WHERE c.is_active = true AND c.current_enrollment > c.max_capacity
       GROUP BY c.id
       ORDER BY overflow DESC`
    );

    // Get courses near capacity
    const nearCapacity = await pool.query(
      `SELECT 
         c.*,
         (c.max_capacity - c.current_enrollment) as remaining_seats,
         COUNT(cs.id) as pending_requests
       FROM courses c
       LEFT JOIN course_selections cs ON c.id = cs.course_id AND cs.status = 'pending'
       WHERE c.is_active = true 
         AND c.current_enrollment >= (c.max_capacity * 0.9)
         AND c.current_enrollment <= c.max_capacity
       GROUP BY c.id
       ORDER BY remaining_seats ASC`
    );

    // Get waitlist statistics
    const waitlistStats = await pool.query(
      `SELECT 
         c.id,
         c.course_code,
         c.course_name,
         c.max_capacity,
         c.current_enrollment,
         COUNT(cs.id) as waitlist_count
       FROM courses c
       LEFT JOIN course_selections cs ON c.id = cs.course_id AND cs.status = 'pending'
       WHERE c.is_active = true AND c.current_enrollment >= c.max_capacity
       GROUP BY c.id, c.course_code, c.course_name, c.max_capacity, c.current_enrollment
       HAVING COUNT(cs.id) > 0
       ORDER BY waitlist_count DESC`
    );

    res.json({
      overEnrolled: overEnrolled.rows,
      nearCapacity: nearCapacity.rows,
      waitlist: waitlistStats.rows
    });
  } catch (error) {
    console.error('Error fetching seat conflicts:', error);
    res.status(500).json({ message: 'Server error fetching seat conflicts' });
  }
});

// Increase course capacity
router.put('/courses/:id/capacity', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newCapacity } = req.body;

    if (!newCapacity || newCapacity < 1) {
      return res.status(400).json({ message: 'Invalid capacity value' });
    }

    // Update course capacity
    const result = await pool.query(
      'UPDATE courses SET max_capacity = $1 WHERE id = $2 AND is_active = true RETURNING *',
      [newCapacity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If capacity increased, try to approve pending selections
    if (newCapacity > result.rows[0].current_enrollment) {
      const availableSeats = newCapacity - result.rows[0].current_enrollment;
      
      // Get pending selections for this course
      const pendingSelections = await pool.query(
        `SELECT cs.*, u.first_name, u.last_name, u.email
         FROM course_selections cs
         JOIN users u ON cs.user_id = u.id
         WHERE cs.course_id = $1 AND cs.status = 'pending'
         ORDER BY cs.selected_at ASC
         LIMIT $2`,
        [id, availableSeats]
      );

      // Auto-approve selections up to available seats
      for (const selection of pendingSelections.rows) {
        await pool.query(
          'UPDATE course_selections SET status = $1, reviewed_at = NOW() WHERE id = $2',
          ['approved', selection.id]
        );

        // Update course enrollment
        await pool.query(
          'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
          [id]
        );

        // Create notification
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [
            selection.user_id,
            'Course Selection Approved',
            `Your selection for ${result.rows[0].course_code} has been approved due to increased capacity.`,
            'course_approved'
          ]
        );
      }
    }

    res.json({
      message: 'Course capacity updated successfully',
      course: result.rows[0],
      autoApproved: newCapacity > result.rows[0].current_enrollment ? availableSeats : 0
    });
  } catch (error) {
    console.error('Error updating course capacity:', error);
    res.status(500).json({ message: 'Server error updating course capacity' });
  }
});

// Resolve seat allocation conflict
router.post('/resolve-conflict/:courseId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { action, newCapacity, selectedStudents } = req.body;

    const course = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let result = { message: '', affectedStudents: 0 };

    if (action === 'increase_capacity' && newCapacity) {
      // Increase capacity and auto-approve pending selections
      await pool.query(
        'UPDATE courses SET max_capacity = $1 WHERE id = $2',
        [newCapacity, courseId]
      );

      const availableSeats = newCapacity - course.rows[0].current_enrollment;
      if (availableSeats > 0) {
        const pendingSelections = await pool.query(
          `UPDATE course_selections 
           SET status = 'approved', reviewed_at = NOW()
           WHERE course_id = $1 AND status = 'pending'
           AND id IN (
             SELECT id FROM course_selections 
             WHERE course_id = $1 AND status = 'pending'
             ORDER BY selected_at ASC
             LIMIT $2
           )
           RETURNING user_id`,
          [courseId, availableSeats]
        );

        // Update enrollment count
        await pool.query(
          'UPDATE courses SET current_enrollment = current_enrollment + $1 WHERE id = $2',
          [pendingSelections.rows.length, courseId]
        );

        result.affectedStudents = pendingSelections.rows.length;
        result.message = `Capacity increased to ${newCapacity}. ${result.affectedStudents} students auto-approved.`;
      }
    } else if (action === 'manual_selection' && selectedStudents) {
      // Manually approve selected students
      for (const studentId of selectedStudents) {
        await pool.query(
          'UPDATE course_selections SET status = $1, reviewed_at = NOW() WHERE course_id = $2 AND user_id = $3 AND status = $4',
          ['approved', courseId, studentId, 'pending']
        );

        // Create notification
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [
            studentId,
            'Course Selection Approved',
            `Your selection for ${course.rows[0].course_code} has been manually approved.`,
            'course_approved'
          ]
        );
      }

      result.affectedStudents = selectedStudents.length;
      result.message = `${result.affectedStudents} students manually approved.`;
    }

    res.json(result);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ message: 'Server error resolving conflict' });
  }
});

module.exports = router;
