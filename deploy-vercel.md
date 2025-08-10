# 🚀 Deploy CRAMS to Vercel + PlanetScale

## Overview
- **Frontend**: Vercel (Free tier)
- **Backend**: Vercel Serverless Functions
- **Database**: PlanetScale MySQL (Free tier)

## Prerequisites
- GitHub account
- Vercel account ([vercel.com](https://vercel.com))
- PlanetScale account ([planetscale.com](https://planetscale.com))

## Step 1: Prepare Backend for Serverless

### Create API Routes Structure
```
api/
├── auth/
│   ├── login.js
│   ├── register.js
│   └── profile.js
├── courses/
│   ├── index.js
│   └── [id].js
├── admin/
│   ├── dashboard.js
│   ├── schedule-stats.js
│   └── seat-conflicts.js
└── health.js
```

### Convert Express Routes to Vercel Functions
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

## Step 2: Setup PlanetScale Database

1. **Create Database**:
   - Go to [planetscale.com](https://planetscale.com)
   - Create new database: `crams-db`
   - Region: Choose closest to your users

2. **Get Connection String**:
   - Go to database → Connect
   - Select "Node.js"
   - Copy connection string

3. **Create Schema**:
   ```sql
   -- Run these in PlanetScale console
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     role ENUM('student', 'advisor', 'admin') NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE courses (
     id INT AUTO_INCREMENT PRIMARY KEY,
     course_code VARCHAR(20) UNIQUE NOT NULL,
     course_name VARCHAR(255) NOT NULL,
     description TEXT,
     credits INT NOT NULL,
     department VARCHAR(100) NOT NULL,
     instructor VARCHAR(255),
     max_capacity INT NOT NULL,
     current_enrollment INT DEFAULT 0,
     schedule_days JSON,
     schedule_time VARCHAR(50),
     room VARCHAR(50),
     prerequisites TEXT,
     semester VARCHAR(20),
     year INT,
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

## Step 3: Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure project:
     - Framework: Create React App
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `build`

3. **Environment Variables**:
   ```
   DATABASE_URL=mysql://[your-planetscale-connection-string]
   JWT_SECRET=your-super-secure-jwt-secret-key
   NODE_ENV=production
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   ```

4. **Frontend Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-app.vercel.app
   ```

## Step 4: Test Deployment

1. **Frontend**: `https://your-app.vercel.app`
2. **API Health**: `https://your-app.vercel.app/api/health`
3. **Register/Login**: Test with demo accounts

## Pros & Cons

### ✅ Pros:
- **Free tier** for both services
- **Automatic scaling**
- **Global CDN**
- **Easy GitHub integration**
- **Excellent performance**

### ❌ Cons:
- **Serverless limitations** (10-second timeout)
- **Cold starts** for infrequent requests
- **MySQL instead of PostgreSQL**

## Cost: **FREE** (within limits)
