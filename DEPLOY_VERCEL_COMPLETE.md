# 🚀 **Deploy CRAMS to Vercel - Complete Guide**

## 📋 **Overview**
- **Frontend**: Vercel Static Hosting (React.js)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: PlanetScale MySQL (Free tier)
- **Cost**: FREE for small to medium usage

## 🎯 **Prerequisites**
- [ ] GitHub account with your CRAMS code
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] PlanetScale account ([planetscale.com](https://planetscale.com))

---

## 📦 **Step 1: Prepare Your Project Structure**

### 1.1 Create Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### 1.2 Convert Backend Routes to Serverless Functions

Create `api/` directory structure:
```
api/
├── auth/
│   ├── login.js
│   ├── register.js
│   └── profile.js
├── courses/
│   ├── index.js
│   └── [id].js
├── student/
│   ├── selections.js
│   ├── select-course.js
│   └── schedule.js
├── advisor/
│   ├── pending-selections.js
│   ├── students.js
│   └── statistics.js
├── admin/
│   ├── dashboard.js
│   ├── users.js
│   ├── assign-advisor.js
│   └── seat-conflicts.js
└── health.js
```

---

## 🗄️ **Step 2: Setup PlanetScale Database**

### 2.1 Create Database
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up/Login with GitHub
3. Create new database: `crams-db`
4. Select region closest to your users

### 2.2 Get Connection String
1. Go to your database → **Connect**
2. Select **"Node.js"**
3. Copy the connection string
4. Save it for environment variables

### 2.3 Create Database Schema
1. Go to **Console** tab in PlanetScale
2. Run this SQL to create your tables:

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'advisor', 'admin') NOT NULL,
    student_id VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    instructor VARCHAR(255),
    max_capacity INT NOT NULL DEFAULT 30,
    current_enrollment INT DEFAULT 0,
    schedule_days JSON,
    schedule_time VARCHAR(50),
    room VARCHAR(50),
    prerequisites TEXT,
    semester VARCHAR(20),
    year INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Course selections table
CREATE TABLE course_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    feedback TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Advisor assignments table
CREATE TABLE advisor_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    advisor_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_advisor (student_id, advisor_id)
);

-- Insert sample courses
INSERT INTO courses (course_code, course_name, description, credits, department, instructor, max_capacity, schedule_days, schedule_time, room, semester, year) VALUES
('CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 3, 'Computer Science', 'Dr. Sarah Johnson', 30, JSON_ARRAY('Monday', 'Wednesday', 'Friday'), '09:00-10:30', 'CS-101', 'Fall', 2024),
('CS201', 'Data Structures', 'Fundamental data structures and algorithms', 4, 'Computer Science', 'Prof. Michael Chen', 25, JSON_ARRAY('Tuesday', 'Thursday'), '11:00-12:30', 'CS-102', 'Fall', 2024),
('MATH101', 'Calculus I', 'Differential and integral calculus', 4, 'Mathematics', 'Dr. Emily Rodriguez', 40, JSON_ARRAY('Monday', 'Wednesday', 'Friday'), '10:00-11:30', 'MATH-201', 'Fall', 2024);
```

---

## 🔧 **Step 3: Convert Backend to Serverless Functions**

### 3.1 Create Database Connection Helper

Create `lib/db.js`:
```javascript
import mysql from 'mysql2/promise';

let connection;

export async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
  }
  return connection;
}

export async function query(sql, params) {
  const conn = await getConnection();
  const [results] = await conn.execute(sql, params);
  return results;
}
```

### 3.2 Create Authentication Helper

Create `lib/auth.js`:
```javascript
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
    'SELECT id, email, first_name, last_name, role, student_id, department FROM users WHERE id = ?',
    [id]
  );
  return users[0];
}
```

### 3.3 Create Sample API Functions

Create `api/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'CRAMS Backend is running on Vercel',
    timestamp: new Date().toISOString()
  });
}
```

Create `api/auth/login.js`:
```javascript
import { query } from '../../lib/db.js';
import { comparePassword } from '../../lib/auth.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Get user from database
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
```

---

## 🎨 **Step 4: Prepare Frontend for Vercel**

### 4.1 Update Frontend API Configuration

Update `client/src/contexts/AuthContext.js`:
```javascript
// Configure axios defaults for Vercel
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-app.vercel.app/api' 
    : 'http://localhost:5000/api');

axios.defaults.baseURL = API_URL;
```

### 4.2 Create Build Script

Update `client/package.json`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "npm run build"
  }
}
```

### 4.3 Create Redirects for SPA

Create `client/public/_redirects`:
```
/*    /index.html   200
```

---

## 🚀 **Step 5: Deploy to Vercel**

### 5.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 5.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Import your CRAMS repository
5. Configure project settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 5.3 Set Environment Variables
In Vercel dashboard, go to **Settings** → **Environment Variables**:

```bash
# Database
DATABASE_URL=mysql://your-planetscale-connection-string

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# Environment
NODE_ENV=production

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Frontend
REACT_APP_API_URL=https://your-app.vercel.app/api
```

### 5.4 Deploy
1. Click **"Deploy"**
2. Wait for build to complete (5-10 minutes)
3. Get your live URL: `https://your-app.vercel.app`

---

## 🧪 **Step 6: Test Your Deployment**

### 6.1 Test API Endpoints
- Health check: `https://your-app.vercel.app/api/health`
- Should return: `{"status": "OK", "message": "CRAMS Backend is running on Vercel"}`

### 6.2 Test Frontend
- Main app: `https://your-app.vercel.app`
- Should load the CRAMS login page

### 6.3 Test Full Workflow
1. Register new accounts with proper email domains:
   - Student: `student@student.com`
   - Advisor: `advisor@advisor.com`
   - Admin: `admin@admin.com`
2. Test login functionality
3. Test role-based dashboards
4. Test course management features

---

## 🔧 **Step 7: Troubleshooting**

### Common Issues:

**1. Database Connection Errors**
```bash
# Check DATABASE_URL format
mysql://username:password@host:port/database?sslaccept=strict
```

**2. CORS Errors**
```javascript
// Add to your API functions
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
```

**3. Build Errors**
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies are in package.json
```

**4. Environment Variables**
```bash
# Verify all environment variables are set
# Check spelling and values
```

---

## 📊 **Step 8: Monitor Your Deployment**

### 8.1 Vercel Analytics
- Enable analytics in Vercel dashboard
- Monitor page views and performance

### 8.2 Function Logs
- Check function logs for errors
- Monitor API response times

### 8.3 Database Monitoring
- Monitor PlanetScale usage
- Check query performance

---

## 🎉 **Congratulations!**

Your CRAMS application is now live on Vercel with:

✅ **Frontend**: React.js hosted on Vercel  
✅ **Backend**: Serverless functions on Vercel  
✅ **Database**: MySQL on PlanetScale  
✅ **Security**: JWT authentication  
✅ **Performance**: Global CDN  
✅ **Cost**: FREE for small to medium usage  

## 🔗 **Your Live URLs**

- **Main App**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/health`
- **Admin Panel**: `https://your-app.vercel.app` (login as admin)

## 🚀 **Next Steps**

1. **Custom Domain**: Add your own domain in Vercel settings
2. **SSL Certificate**: Automatically provided by Vercel
3. **Monitoring**: Set up alerts for errors
4. **Scaling**: Monitor usage and upgrade if needed

**Your CRAMS application is now production-ready and accessible worldwide!** 🌍
