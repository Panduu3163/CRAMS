# 🚀 **Deploy CRAMS to Vercel + Supabase (100% FREE)**

## 📋 **Overview**
- **Frontend**: Vercel Static Hosting (FREE)
- **Backend**: Vercel Serverless Functions (FREE)
- **Database**: Supabase PostgreSQL (FREE - 500MB)
- **Total Cost**: $0.00 - Completely FREE!

## 🎯 **Prerequisites**
- [ ] GitHub account with your CRAMS code
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] Supabase account ([supabase.com](https://supabase.com))

---

## 🗄️ **Step 1: Setup FREE Supabase Database**

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended)
4. It's completely FREE - no credit card required!

### 1.2 Create New Project
1. Click **"New Project"**
2. Choose your organization
3. **Project Name**: `crams-database`
4. **Database Password**: Create a strong password (save it!)
5. **Region**: Choose closest to your users
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup

### 1.3 Get Database Connection
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** (looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)
4. Replace `[password]` with your actual password
5. Save this connection string

### 1.4 Create Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Paste and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'advisor', 'admin')) NOT NULL,
    student_id VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    department VARCHAR(100) NOT NULL,
    instructor VARCHAR(255),
    max_capacity INTEGER NOT NULL DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    schedule_days TEXT[], -- PostgreSQL array
    schedule_time VARCHAR(50),
    room VARCHAR(50),
    prerequisites TEXT,
    semester VARCHAR(20),
    year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course selections table
CREATE TABLE course_selections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    feedback TEXT,
    UNIQUE(user_id, course_id)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advisor assignments table
CREATE TABLE advisor_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    advisor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, advisor_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_department ON courses(department);
CREATE INDEX idx_course_selections_user ON course_selections(user_id);
CREATE INDEX idx_course_selections_course ON course_selections(course_id);
CREATE INDEX idx_course_selections_status ON course_selections(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_advisor_assignments_student ON advisor_assignments(student_id);
CREATE INDEX idx_advisor_assignments_advisor ON advisor_assignments(advisor_id);

-- Insert sample courses
INSERT INTO courses (course_code, course_name, description, credits, department, instructor, max_capacity, schedule_days, schedule_time, room, semester, year) VALUES
('CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 3, 'Computer Science', 'Dr. Sarah Johnson', 30, ARRAY['Monday', 'Wednesday', 'Friday'], '09:00-10:30', 'CS-101', 'Fall', 2024),
('CS201', 'Data Structures', 'Fundamental data structures and algorithms', 4, 'Computer Science', 'Prof. Michael Chen', 25, ARRAY['Tuesday', 'Thursday'], '11:00-12:30', 'CS-102', 'Fall', 2024),
('MATH101', 'Calculus I', 'Differential and integral calculus', 4, 'Mathematics', 'Dr. Emily Rodriguez', 40, ARRAY['Monday', 'Wednesday', 'Friday'], '10:00-11:30', 'MATH-201', 'Fall', 2024),
('ENG101', 'English Composition', 'Academic writing and communication', 3, 'English', 'Prof. David Wilson', 20, ARRAY['Tuesday', 'Thursday'], '14:00-15:30', 'ENG-101', 'Fall', 2024),
('PHYS101', 'General Physics I', 'Mechanics and thermodynamics', 4, 'Physics', 'Dr. Lisa Thompson', 35, ARRAY['Monday', 'Wednesday', 'Friday'], '13:00-14:30', 'PHYS-LAB', 'Fall', 2024);
```

4. Click **"Run"** to execute the schema
5. Verify tables were created in **Table Editor**

---

## 🔧 **Step 2: Update Database Connection for PostgreSQL**

### 2.1 Update Database Helper
Your existing `lib/db.js` needs to be updated for PostgreSQL:

```javascript
import { Pool } from 'pg';

let pool;

export async function getConnection() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  try {
    const pool = await getConnection();
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

### 2.2 Update API Functions for PostgreSQL
Your API functions need to use `$1, $2, $3` instead of `?` for parameters:

```javascript
// Example: api/auth/login.js
const users = await query(
  'SELECT * FROM users WHERE email = $1',
  [email.toLowerCase()]
);
```

---

## 🚀 **Step 3: Deploy to Vercel**

### 3.1 Push to GitHub
```bash
git add .
git commit -m "Configure for Supabase deployment"
git push origin main
```

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Import your CRAMS repository
5. Configure:
   - **Framework**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.3 Set Environment Variables
In Vercel dashboard → **Settings** → **Environment Variables**:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT Secret (generate 32+ character string)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long

# Environment
NODE_ENV=production

# Frontend API URL (update after deployment)
REACT_APP_API_URL=https://your-app.vercel.app/api
```

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for build (5-10 minutes)
3. Get your live URL: `https://your-app.vercel.app`
4. Update `REACT_APP_API_URL` with your actual URL

---

## 🧪 **Step 4: Test Your FREE Deployment**

### 4.1 Test API
- Health: `https://your-app.vercel.app/api/health`
- Should return: `{"status": "OK", "message": "CRAMS Backend is running on Vercel"}`

### 4.2 Test Registration
1. Go to: `https://your-app.vercel.app`
2. Register accounts:
   - Student: `student@student.com` / `password123`
   - Advisor: `advisor@advisor.com` / `password123`
   - Admin: `admin@admin.com` / `password123`

### 4.3 Test Features
- ✅ Login/logout
- ✅ Role-based dashboards
- ✅ Course management
- ✅ Student-advisor workflow

---

## 💰 **FREE Tier Limits**

### **Supabase FREE:**
- ✅ **500MB database** storage
- ✅ **2GB bandwidth** per month
- ✅ **50,000 monthly active users**
- ✅ **Unlimited API requests**
- ✅ **Real-time subscriptions**

### **Vercel FREE:**
- ✅ **100GB bandwidth** per month
- ✅ **Unlimited static sites**
- ✅ **Serverless functions**
- ✅ **Custom domains**
- ✅ **Automatic HTTPS**

### **Total Cost: $0.00** 🎉

---

## 🔧 **Troubleshooting**

### Common Issues:

**1. Database Connection Error**
```bash
# Check DATABASE_URL format
postgresql://postgres:password@host:5432/postgres
```

**2. CORS Issues**
```javascript
// Already handled in your API functions
res.setHeader('Access-Control-Allow-Origin', '*');
```

**3. Build Errors**
```bash
# Check Vercel build logs
# Ensure all dependencies in package.json
```

---

## 🎉 **Congratulations!**

Your CRAMS application is now running 100% FREE with:

✅ **React Frontend** on Vercel  
✅ **Node.js Backend** on Vercel Serverless  
✅ **PostgreSQL Database** on Supabase  
✅ **Global CDN** for fast loading  
✅ **Automatic HTTPS** and SSL  
✅ **Zero monthly costs**  

## 🔗 **Your Live Application**

- **Main App**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/health`
- **Database**: Managed by Supabase

**Your CRAMS application is now live and accessible worldwide - completely FREE!** 🌍

---

## 📊 **Why This Setup is Perfect**

1. **🆓 Completely Free** - No hidden costs
2. **🚀 Production Ready** - Enterprise-grade infrastructure  
3. **📈 Scalable** - Handles thousands of users
4. **🔒 Secure** - Built-in security features
5. **🌍 Global** - CDN for worldwide access
6. **📱 Mobile Friendly** - Responsive design
7. **⚡ Fast** - Optimized performance

**Perfect for academic projects, portfolios, and small to medium applications!**
