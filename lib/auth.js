import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function getUserById(id) {
  const users = await query(
    'SELECT id, email, first_name, last_name, role, student_id, department FROM users WHERE id = $1',
    [id]
  );
  return users[0];
}

export function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: 'Invalid or expired token', status: 403 };
  }

  return { user: decoded };
}

export function authorizeRole(userRole, allowedRoles) {
  if (!allowedRoles.includes(userRole)) {
    return { error: `Access denied. Required roles: ${allowedRoles.join(', ')}`, status: 403 };
  }
  return { authorized: true };
}
