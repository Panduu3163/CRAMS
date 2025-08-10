const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, isAdmin, isAdvisorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all courses (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department, semester, year, search } = req.query;
    
    let query = `
      SELECT c.*, 
             (c.max_capacity - c.current_enrollment) as available_seats,
             CASE WHEN c.current_enrollment >= c.max_capacity THEN true ELSE false END as is_full
      FROM courses c 
      WHERE c.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      query += ` AND c.department = $${paramCount}`;
      params.push(department);
    }

    if (semester) {
      paramCount++;
      query += ` AND c.semester = $${paramCount}`;
      params.push(semester);
    }

    if (year) {
      paramCount++;
      query += ` AND c.year = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (search) {
      paramCount++;
      query += ` AND (c.course_name ILIKE $${paramCount} OR c.course_code ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY c.department, c.course_code';

    const result = await pool.query(query, params);
    
    res.json({
      courses: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// Get course by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              (c.max_capacity - c.current_enrollment) as available_seats,
              CASE WHEN c.current_enrollment >= c.max_capacity THEN true ELSE false END as is_full
       FROM courses c 
       WHERE c.id = $1 AND c.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
});

// Create new course (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      credits,
      department,
      prerequisites,
      maxCapacity,
      scheduleDays,
      scheduleTime,
      instructor,
      semester,
      year
    } = req.body;

    // Validate required fields
    if (!courseCode || !courseName || !credits || !department || !maxCapacity || !scheduleDays || !scheduleTime || !semester || !year) {
      return res.status(400).json({ 
        message: 'All required fields must be provided' 
      });
    }

    // Check if course code already exists
    const existingCourse = await pool.query(
      'SELECT id FROM courses WHERE course_code = $1 AND semester = $2 AND year = $3',
      [courseCode, semester, year]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Course with this code already exists for the specified semester and year' 
      });
    }

    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, description, credits, department, prerequisites, max_capacity, schedule_days, schedule_time, instructor, semester, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [courseCode, courseName, description, credits, department, prerequisites || [], maxCapacity, scheduleDays, scheduleTime, instructor, semester, year]
    );

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// Update course (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      courseName,
      description,
      credits,
      department,
      prerequisites,
      maxCapacity,
      scheduleDays,
      scheduleTime,
      instructor,
      semester,
      year,
      isActive
    } = req.body;

    const result = await pool.query(
      `UPDATE courses SET 
         course_name = COALESCE($1, course_name),
         description = COALESCE($2, description),
         credits = COALESCE($3, credits),
         department = COALESCE($4, department),
         prerequisites = COALESCE($5, prerequisites),
         max_capacity = COALESCE($6, max_capacity),
         schedule_days = COALESCE($7, schedule_days),
         schedule_time = COALESCE($8, schedule_time),
         instructor = COALESCE($9, instructor),
         semester = COALESCE($10, semester),
         year = COALESCE($11, year),
         is_active = COALESCE($12, is_active)
       WHERE id = $13 
       RETURNING *`,
      [courseName, description, credits, department, prerequisites, maxCapacity, scheduleDays, scheduleTime, instructor, semester, year, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// Delete course (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const result = await pool.query(
      'UPDATE courses SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

// Check schedule conflicts for a student
router.post('/check-conflicts', authenticateToken, async (req, res) => {
  try {
    const { courseIds } = req.body;
    
    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'Course IDs array is required' });
    }

    // Get course schedules
    const result = await pool.query(
      `SELECT id, course_code, course_name, schedule_days, schedule_time 
       FROM courses 
       WHERE id = ANY($1) AND is_active = true`,
      [courseIds]
    );

    const courses = result.rows;
    const conflicts = [];

    // Check for time conflicts
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const course1 = courses[i];
        const course2 = courses[j];

        // Check if days overlap
        const days1 = course1.schedule_days.split('');
        const days2 = course2.schedule_days.split('');
        const daysOverlap = days1.some(day => days2.includes(day));

        if (daysOverlap && course1.schedule_time === course2.schedule_time) {
          conflicts.push({
            course1: {
              id: course1.id,
              code: course1.course_code,
              name: course1.course_name,
              schedule: `${course1.schedule_days} ${course1.schedule_time}`
            },
            course2: {
              id: course2.id,
              code: course2.course_code,
              name: course2.course_name,
              schedule: `${course2.schedule_days} ${course2.schedule_time}`
            }
          });
        }
      }
    }

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ message: 'Server error checking conflicts' });
  }
});

// Get departments
router.get('/meta/departments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT department FROM courses WHERE is_active = true ORDER BY department'
    );
    
    res.json({ departments: result.rows.map(row => row.department) });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
});

module.exports = router;
