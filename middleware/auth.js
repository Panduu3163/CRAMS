const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, student_id, department FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check if user is student
const isStudent = authorizeRole('student');

// Check if user is advisor
const isAdvisor = authorizeRole('advisor');

// Check if user is admin
const isAdmin = authorizeRole('admin');

// Check if user is advisor or admin
const isAdvisorOrAdmin = authorizeRole('advisor', 'admin');

module.exports = {
  authenticateToken,
  authorizeRole,
  isStudent,
  isAdvisor,
  isAdmin,
  isAdvisorOrAdmin
};
