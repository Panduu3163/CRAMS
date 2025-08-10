# 🚀 Deploy CRAMS to DigitalOcean App Platform

## Overview
- **Backend**: DigitalOcean App Platform
- **Frontend**: DigitalOcean Static Site
- **Database**: DigitalOcean Managed PostgreSQL

## Prerequisites
- DigitalOcean account ([digitalocean.com](https://digitalocean.com))
- GitHub repository
- Credit card (for managed database)

## Step 1: Create App Spec

Create `.do/app.yaml`:
```yaml
name: crams-app
services:
- name: backend
  source_dir: /
  github:
    repo: your-username/crams-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: JWT_SECRET
    value: your-super-secure-jwt-secret-key
  - key: CLIENT_URL
    value: ${frontend.PUBLIC_URL}
  http_port: 5000

- name: frontend
  source_dir: /client
  github:
    repo: your-username/crams-repo
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: REACT_APP_API_URL
    value: ${backend.PUBLIC_URL}

databases:
- name: db
  engine: PG
  version: "13"
  size: db-s-dev-database
```

## Step 2: Deploy to DigitalOcean

1. **Create App**:
   - Go to DigitalOcean → Apps
   - Create App → GitHub
   - Select repository
   - Choose app spec or auto-detect

2. **Configure Services**:
   - **Backend**: Node.js service
   - **Frontend**: Static site
   - **Database**: PostgreSQL

3. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   ```

4. **Deploy**: Click "Create Resources"

## Step 3: Database Setup

1. **Connect to Database**:
   ```bash
   # Get connection details from DO dashboard
   psql "postgresql://username:password@host:port/database?sslmode=require"
   ```

2. **Run Schema**:
   ```sql
   -- Your existing PostgreSQL schema
   CREATE TABLE users (...);
   CREATE TABLE courses (...);
   -- etc.
   ```

## Pros & Cons

### ✅ Pros:
- **Managed infrastructure**
- **Auto-scaling**
- **Integrated monitoring**
- **PostgreSQL support**
- **Good performance**

### ❌ Cons:
- **Not free** (starts at $5/month)
- **Less ecosystem** than Heroku
- **Newer platform**

## Cost: **$12-25/month** (Basic tier)
