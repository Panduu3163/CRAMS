# 🚀 Complete Railway Deployment Guide for CRAMS

## 📋 Prerequisites Checklist

Before we start, make sure you have:
- [ ] GitHub account with your CRAMS code pushed
- [ ] Railway account (free signup at [railway.app](https://railway.app))
- [ ] Git installed on your machine
- [ ] Node.js installed (for testing)

## 🎯 Deployment Overview

We'll deploy in this order:
1. **PostgreSQL Database** (first)
2. **Backend API Service** (second)
3. **Frontend React App** (third)

**Total Time**: ~45 minutes
**Cost**: $5 free credit monthly (covers small to medium usage)

---

## 🗄️ Step 1: Deploy PostgreSQL Database

### 1.1 Create Railway Account & Project

1. **Go to [railway.app](https://railway.app)**
2. **Sign up** with GitHub (recommended)
3. **Create New Project** → **Provision PostgreSQL**
4. **Name your database**: `crams-database`

### 1.2 Configure Database

1. **Wait for deployment** (takes 2-3 minutes)
2. **Click on PostgreSQL service**
3. **Go to Variables tab**
4. **Copy these values** (you'll need them later):
   - `DATABASE_URL` (full connection string)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 1.3 Initialize Database Schema

1. **Go to Data tab** in Railway PostgreSQL service
2. **Click "Query"** to open SQL editor
3. **Run this schema** (copy-paste the entire script):

```sql
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
    schedule_days TEXT[], -- Array of days
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

-- Create demo accounts (passwords will be hashed by the application)
-- These are just placeholders - actual accounts should be created through the registration API
```

4. **Click "Run Query"** to execute the schema
5. **Verify tables** were created in the Data tab

✅ **Database is ready!**

---

## 🖥️ Step 2: Deploy Backend API Service

### 2.1 Prepare Your Code

First, let's make sure your code is ready for Railway deployment:

1. **Open your project** in VS Code
2. **Check package.json** has the correct start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

3. **Commit and push** any changes:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2.2 Deploy Backend Service

1. **Go back to your Railway project**
2. **Click "New Service"** → **GitHub Repo**
3. **Connect your GitHub account** (if not already connected)
4. **Select your CRAMS repository**
5. **Configure the service**:
   - **Service Name**: `crams-backend`
   - **Root Directory**: Leave empty (uses project root)
   - **Branch**: `main`

### 2.3 Configure Environment Variables

1. **Click on your backend service**
2. **Go to Variables tab**
3. **Add these environment variables** one by one:

```bash
# Core Configuration
NODE_ENV=production
PORT=5000

# Database (use your PostgreSQL DATABASE_URL from Step 1.2)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret (generate a secure 32+ character string)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long

# SMTP Configuration (optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Client URL (we'll update this after frontend deployment)
CLIENT_URL=http://localhost:3000
```

**Important Notes**:
- For `JWT_SECRET`: Generate a secure random string (32+ characters)
- For `DATABASE_URL`: Use the Railway variable reference `${{Postgres.DATABASE_URL}}`
- For SMTP: Use your actual Gmail credentials (optional for now)

### 2.4 Deploy and Test Backend

1. **Railway will automatically deploy** after you add variables
2. **Wait for deployment** (takes 3-5 minutes)
3. **Check deployment logs** in the Deployments tab
4. **Get your backend URL** from the Settings tab (looks like: `https://crams-backend-production-xxxx.up.railway.app`)

### 2.5 Test Backend Health

1. **Open your backend URL** in browser: `https://your-backend-url.railway.app/api/health`
2. **You should see**:
```json
{
  "status": "OK",
  "message": "CRAMS Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

✅ **Backend is deployed and running!**

---

## 🎨 Step 3: Deploy Frontend React App

### 3.1 Prepare Frontend for Deployment

1. **Update frontend API configuration**:

Open `client/src/contexts/AuthContext.js` and ensure it has:
```javascript
// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';
```

2. **Create build script** for Railway:

Create `client/package.json` build script (should already exist):
```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build -p $PORT"
  }
}
```

3. **Add serve dependency** to client:
```bash
cd client
npm install --save serve
cd ..
```

4. **Commit changes**:
```bash
git add .
git commit -m "Prepare frontend for Railway deployment"
git push origin main
```

### 3.2 Deploy Frontend Service

1. **Go back to Railway project**
2. **Click "New Service"** → **GitHub Repo**
3. **Select the same repository**
4. **Configure the service**:
   - **Service Name**: `crams-frontend`
   - **Root Directory**: `client`
   - **Branch**: `main`

### 3.3 Configure Frontend Environment Variables

1. **Click on frontend service**
2. **Go to Variables tab**
3. **Add these variables**:

```bash
# API URL (use your backend URL from Step 2.4)
REACT_APP_API_URL=https://your-backend-url.railway.app

# Build optimization
GENERATE_SOURCEMAP=false
```

### 3.4 Configure Build Settings

1. **Go to Settings tab** of frontend service
2. **Set Build Command**: `npm install && npm run build`
3. **Set Start Command**: `npm start`

### 3.5 Deploy and Test Frontend

1. **Railway will automatically deploy**
2. **Wait for deployment** (takes 5-10 minutes for React build)
3. **Get your frontend URL** from Settings tab
4. **Open your frontend URL** in browser

✅ **Frontend is deployed!**

---

## 🔗 Step 4: Connect Frontend and Backend

### 4.1 Update Backend CLIENT_URL

1. **Go to backend service** in Railway
2. **Go to Variables tab**
3. **Update CLIENT_URL** with your frontend URL:
```bash
CLIENT_URL=https://your-frontend-url.railway.app
```

4. **Redeploy backend** (Railway will auto-redeploy)

### 4.2 Test Full Application

1. **Open your frontend URL**
2. **Test registration** with these email formats:
   - Admin: `admin@admin.com`
   - Advisor: `advisor@advisor.com`
   - Student: `student@student.com`
   - Password: `password123`

3. **Test key features**:
   - [ ] User registration works
   - [ ] User login works
   - [ ] Admin panel accessible
   - [ ] Course management works
   - [ ] "Add Course" button works
   - [ ] Student dashboard loads
   - [ ] Advisor interface loads

---

## 🎉 Step 5: Final Configuration & Testing

### 5.1 Create Demo Accounts

Use your frontend registration page to create:

1. **Admin Account**:
   - Email: `admin@admin.com`
   - Password: `password123`
   - First Name: `Admin`
   - Last Name: `User`

2. **Advisor Account**:
   - Email: `advisor@advisor.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Advisor`

3. **Student Account**:
   - Email: `student@student.com`
   - Password: `password123`
   - First Name: `Jane`
   - Last Name: `Student`

### 5.2 Test Complete Workflow

1. **Login as Admin**:
   - Access admin panel
   - Test "Add Course" functionality
   - Create a new course
   - Assign advisor to student

2. **Login as Student**:
   - View available courses
   - Select a course
   - Check notifications

3. **Login as Advisor**:
   - Review student selections
   - Approve/reject selections
   - View assigned students

### 5.3 Monitor Your Deployment

1. **Railway Dashboard** provides:
   - Real-time logs
   - Resource usage
   - Deployment history
   - Environment variables

2. **Check logs** if anything isn't working:
   - Backend logs: Check for API errors
   - Frontend logs: Check for build/runtime errors
   - Database logs: Check for connection issues

---

## 📊 Your Live URLs

After successful deployment:

- **Frontend**: `https://crams-frontend-production-xxxx.up.railway.app`
- **Backend**: `https://crams-backend-production-xxxx.up.railway.app`
- **Database**: Managed by Railway (internal connection)

## 💰 Cost & Usage

- **Free Tier**: $5 credit monthly
- **Typical Usage**: $2-8/month for small to medium apps
- **Monitoring**: Check usage in Railway dashboard

## 🔧 Troubleshooting

### Common Issues:

1. **Build Failures**:
   ```bash
   # Check logs in Railway dashboard
   # Verify package.json scripts
   # Ensure all dependencies are listed
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify DATABASE_URL variable
   # Check if database service is running
   # Review connection logs
   ```

3. **CORS Errors**:
   ```bash
   # Ensure CLIENT_URL matches frontend URL
   # Check CORS configuration in server.js
   ```

4. **Environment Variables**:
   ```bash
   # Double-check all variables are set
   # Verify no typos in variable names
   # Ensure proper Railway variable references
   ```

### Getting Help:

1. **Railway Discord**: Active community support
2. **Railway Docs**: [docs.railway.app](https://docs.railway.app)
3. **GitHub Issues**: Check your repository issues
4. **Logs**: Always check Railway service logs first

---

## 🎊 Congratulations!

Your CRAMS application is now live on Railway with:

✅ **Complete course management system**  
✅ **Working "Add Course" functionality**  
✅ **Admin panel with seat allocation**  
✅ **Student and advisor dashboards**  
✅ **Real-time notifications**  
✅ **Secure authentication**  
✅ **PostgreSQL database**  
✅ **Production-ready deployment**  

## 🚀 Next Steps

1. **Custom Domain** (optional): Add your own domain in Railway settings
2. **Email Notifications**: Configure SMTP for real email notifications
3. **Monitoring**: Set up alerts for your services
4. **Scaling**: Monitor usage and upgrade plan if needed

**Your CRAMS application is now live and ready for users!** 🎉

---

## 📞 Need Help?

If you encounter any issues during deployment, check:
1. Railway service logs
2. Environment variables
3. Database connection
4. Build commands and scripts

**Happy deploying!** 🚀
