const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
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

    // Validate email domain based on role
    const emailLower = email.toLowerCase();
    if (role === 'student' && !emailLower.endsWith('@student.com')) {
      return res.status(400).json({ 
        message: 'Students must use an email ending with @student.com' 
      });
    }
    if (role === 'advisor' && !emailLower.endsWith('@advisor.com')) {
      return res.status(400).json({ 
        message: 'Advisors must use an email ending with @advisor.com' 
      });
    }
    if (role === 'admin' && !emailLower.endsWith('@admin.com')) {
      return res.status(400).json({ 
        message: 'Admins must use an email ending with @admin.com' 
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
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, student_id, department, year_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, firstName, lastName, role, studentId, department, yearLevel]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email domain for role-based access
    const emailLower = email.toLowerCase();
    const isStudentEmail = emailLower.endsWith('@student.com');
    const isAdvisorEmail = emailLower.endsWith('@advisor.com');
    const isAdminEmail = emailLower.endsWith('@admin.com');
    
    if (!isStudentEmail && !isAdvisorEmail && !isAdminEmail) {
      return res.status(400).json({ 
        message: 'Invalid email domain. Students must use @student.com, advisors must use @advisor.com, admins must use @admin.com' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password, first_name, last_name, role, student_id, department FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Validate that email domain matches user role
    if (user.role === 'student' && !emailLower.endsWith('@student.com')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role === 'advisor' && !emailLower.endsWith('@advisor.com')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role === 'admin' && !emailLower.endsWith('@admin.com')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        studentId: user.student_id,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, student_id, department, year_level, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        studentId: user.student_id,
        department: user.department,
        yearLevel: user.year_level,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, department, yearLevel } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, department = $3, year_level = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING id, email, first_name, last_name, role, student_id, department, year_level`,
      [firstName, lastName, department, yearLevel, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        studentId: user.student_id,
        department: user.department,
        yearLevel: user.year_level
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
