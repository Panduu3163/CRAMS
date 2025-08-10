# 🚀 CRAMS Deployment Guide for Render

This guide will walk you through deploying the CRAMS (Course Registration and Advising Management System) to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Gmail Account**: For SMTP email notifications (optional)

## 🗂️ Project Structure

```
CRAMS/
├── server.js                 # Backend entry point
├── package.json             # Backend dependencies
├── render.yaml              # Render configuration
├── .env.production.example  # Environment variables template
├── client/                  # Frontend React app
│   ├── package.json        # Frontend dependencies
│   ├── build.sh           # Build script
│   └── src/               # React source code
├── routes/                # API routes
├── middleware/            # Authentication middleware
└── config/               # Database configuration
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Deploy Database (PostgreSQL)

1. **Go to Render Dashboard** → **New** → **PostgreSQL**
2. **Configure Database**:
   - **Name**: `crams-database`
   - **Database**: `crams_db`
   - **User**: `crams_user`
   - **Region**: Oregon (US West)
   - **Plan**: Free
3. **Create Database** and wait for it to be ready
4. **Copy the External Database URL** (you'll need this)

### Step 3: Deploy Backend API

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect Repository**: Select your GitHub repository
3. **Configure Service**:
   - **Name**: `crams-backend`
   - **Environment**: Node
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Your PostgreSQL External Database URL]
   JWT_SECRET=[Generate a secure random string]
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=[Your Gmail address]
   SMTP_PASS=[Your Gmail App Password]
   CLIENT_URL=https://[your-frontend-name].onrender.com
   ```

5. **Deploy** and wait for completion

### Step 4: Deploy Frontend

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect Repository**: Select your GitHub repository
3. **Configure Site**:
   - **Name**: `crams-frontend`
   - **Branch**: main
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://[your-backend-name].onrender.com
   GENERATE_SOURCEMAP=false
   ```

5. **Deploy** and wait for completion

### Step 5: Initialize Database

1. **Access your backend URL**: `https://[your-backend-name].onrender.com`
2. **Check health endpoint**: `https://[your-backend-name].onrender.com/health`
3. **Database tables will be created automatically** on first run

### Step 6: Create Demo Accounts

Use the following API endpoints to create demo accounts:

**Admin Account**:
```bash
curl -X POST https://[your-backend-name].onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

**Advisor Account**:
```bash
curl -X POST https://[your-backend-name].onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor@advisor.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Advisor",
    "role": "advisor"
  }'
```

**Student Account**:
```bash
curl -X POST https://[your-backend-name].onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@student.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Student",
    "role": "student"
  }'
```

## 🔧 Configuration Details

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Server port (10000) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `SMTP_HOST` | Email server host | Optional |
| `SMTP_PORT` | Email server port | Optional |
| `SMTP_USER` | Email username | Optional |
| `SMTP_PASS` | Email password | Optional |
| `CLIENT_URL` | Frontend URL | Yes |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `GENERATE_SOURCEMAP` | Disable source maps (false) | Optional |

## 🎯 Post-Deployment Checklist

- [ ] Backend health check responds
- [ ] Frontend loads without errors
- [ ] Database connection works
- [ ] User registration works
- [ ] User login works
- [ ] Admin panel accessible
- [ ] Course management works
- [ ] Email notifications work (if configured)

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Verify all dependencies in package.json
   - Ensure environment variables are set

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check if database is running
   - Review connection logs

3. **CORS Issues**:
   - Ensure CLIENT_URL matches your frontend URL
   - Check CORS configuration in server.js

4. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Review authentication middleware

## 📱 Demo Credentials

After deployment, use these credentials to test:

- **Admin**: `admin@admin.com / password123`
- **Advisor**: `advisor@advisor.com / password123`
- **Student**: `student@student.com / password123`

## 🎉 Success!

Your CRAMS application should now be live at:
- **Frontend**: `https://[your-frontend-name].onrender.com`
- **Backend**: `https://[your-backend-name].onrender.com`

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Review environment variables
3. Test API endpoints individually
4. Check database connectivity

---

**🚀 Happy Deploying!**
