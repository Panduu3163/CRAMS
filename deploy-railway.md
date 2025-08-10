# 🚀 Deploy CRAMS to Railway

## Overview
- **Backend**: Railway Service
- **Frontend**: Railway Static Site or Vercel
- **Database**: Railway PostgreSQL

## Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository

## Step 1: Deploy Database

1. **Create Project**:
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy PostgreSQL
   - Name: `crams-database`

2. **Get Connection Details**:
   - Copy `DATABASE_URL` from Variables tab

## Step 2: Deploy Backend

1. **New Service**:
   - Add Service → GitHub Repo
   - Select your repository
   - Root directory: `/` (leave empty)

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secure-jwt-secret-key
   CLIENT_URL=https://your-frontend.railway.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   ```

3. **Build Settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`

## Step 3: Deploy Frontend

1. **New Service**:
   - Add Service → GitHub Repo
   - Root directory: `client`

2. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   ```

3. **Build Settings**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -p $PORT`

## Step 4: Database Setup

1. **Connect via Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   railway connect
   railway run psql $DATABASE_URL
   ```

2. **Run Schema**: Execute your PostgreSQL schema

## Pros & Cons

### ✅ Pros:
- **$5 free credit** monthly
- **Simple deployment**
- **Automatic HTTPS**
- **Built-in monitoring**
- **PostgreSQL support**

### ❌ Cons:
- **Usage-based pricing**
- **Newer platform**
- **Limited free tier**

## Cost: **$5 free/month**, then usage-based
