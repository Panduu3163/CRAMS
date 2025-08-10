# 🚀 Deploy CRAMS to Heroku

## Overview
- **Backend**: Heroku Dyno (Free/Hobby tier)
- **Frontend**: Heroku Static Site or Netlify
- **Database**: Heroku PostgreSQL (Free tier)

## Prerequisites
- Heroku account ([heroku.com](https://heroku.com))
- Heroku CLI installed
- Git repository

## Step 1: Prepare for Heroku

### Create Procfile
```bash
# Create Procfile in root directory
echo "web: node server.js" > Procfile
```

### Update package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "cd client && npm install && npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Serve Frontend from Backend (Optional)
Add to `server.js`:
```javascript
// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}
```

## Step 2: Deploy Backend to Heroku

1. **Login to Heroku**:
   ```bash
   heroku login
   ```

2. **Create Heroku App**:
   ```bash
   heroku create crams-backend
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secure-jwt-secret-key
   heroku config:set CLIENT_URL=https://crams-frontend.netlify.app
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_PORT=587
   heroku config:set SMTP_USER=your-email@gmail.com
   heroku config:set SMTP_PASS=your-gmail-app-password
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## Step 3: Deploy Frontend to Netlify

1. **Build Frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `build` folder
   - Or connect GitHub repository

3. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://crams-backend.herokuapp.com
   ```

4. **Configure Redirects**:
   Create `client/public/_redirects`:
   ```
   /*    /index.html   200
   ```

## Step 4: Database Setup

1. **Get Database URL**:
   ```bash
   heroku config:get DATABASE_URL
   ```

2. **Run Migrations** (if needed):
   ```bash
   heroku run node scripts/setup-database.js
   ```

## Step 5: Test Deployment

1. **Backend**: `https://crams-backend.herokuapp.com/api/health`
2. **Frontend**: `https://crams-frontend.netlify.app`

## Pros & Cons

### ✅ Pros:
- **Easy deployment** with Git
- **Managed PostgreSQL**
- **Add-ons ecosystem**
- **Excellent documentation**
- **Automatic SSL**

### ❌ Cons:
- **Dyno sleeping** on free tier
- **Limited free hours**
- **Can be expensive** for production

## Cost: 
- **Free**: Limited hours, dyno sleeping
- **Hobby**: $7/month, no sleeping
