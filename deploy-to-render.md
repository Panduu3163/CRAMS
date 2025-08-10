# 🚀 Quick Render Deployment Checklist

## Pre-Deployment Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub account

## Deployment Order (Important!)

### Step 1: PostgreSQL Database
1. **New** → **PostgreSQL**
2. **Settings**:
   - Name: `crams-database`
   - Database: `crams_db` 
   - User: `crams_user`
   - Region: Oregon
   - Plan: Free
3. **Create** and wait for ready status
4. **Copy External Database URL** from dashboard

### Step 2: Backend API Service
1. **New** → **Web Service**
2. **Connect GitHub repo**
3. **Settings**:
   - Name: `crams-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: Oregon
   - Plan: Free

4. **Environment Variables**:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Paste your PostgreSQL URL here]
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
CLIENT_URL=https://crams-frontend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

5. **Deploy** and wait for success

### Step 3: Frontend Static Site
1. **New** → **Static Site**
2. **Connect GitHub repo**
3. **Settings**:
   - Name: `crams-frontend`
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

4. **Environment Variables**:
```
REACT_APP_API_URL=https://crams-backend.onrender.com
GENERATE_SOURCEMAP=false
```

5. **Deploy** and wait for success

## Post-Deployment

### Test Your Deployment
1. Visit your frontend URL: `https://crams-frontend.onrender.com`
2. Check backend health: `https://crams-backend.onrender.com/health`
3. Register test accounts with proper email domains:
   - Admin: `admin@admin.com`
   - Advisor: `advisor@advisor.com` 
   - Student: `student@student.com`

### Demo Accounts (if needed)
Use the registration page with these email formats:
- **Admin**: Any email ending with `@admin.com`
- **Advisor**: Any email ending with `@advisor.com`
- **Student**: Any email ending with `@student.com`
- **Password**: `password123` (or any password you choose)

## 🎉 Success Indicators
- ✅ Frontend loads without errors
- ✅ Can register new accounts
- ✅ Can login successfully
- ✅ Admin panel accessible
- ✅ Course management works
- ✅ Student/Advisor dashboards work

## 🔧 Troubleshooting
- **Build fails**: Check logs in Render dashboard
- **Database errors**: Verify DATABASE_URL format
- **CORS issues**: Ensure CLIENT_URL matches frontend URL
- **Auth issues**: Check JWT_SECRET is set properly

## 📱 Your Live URLs
After deployment:
- **Frontend**: `https://crams-frontend.onrender.com`
- **Backend**: `https://crams-backend.onrender.com`

**Note**: Replace `crams-frontend` and `crams-backend` with your actual service names if different.
