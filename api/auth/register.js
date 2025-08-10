import { query } from '../../lib/db.js';
import { hashPassword } from '../../lib/auth.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      studentId, 
      department 
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
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1 OR student_id = $2',
      [email, studentId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'User with this email or student ID already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, student_id, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [email, hashedPassword, firstName, lastName, role, studentId, department]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result[0].id, role: role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result[0].id,
        email,
        firstName,
        lastName,
        role,
        department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
