# 🚀 Deploy CRAMS to AWS

## Overview
- **Backend**: AWS Elastic Beanstalk or ECS
- **Frontend**: AWS S3 + CloudFront
- **Database**: AWS RDS PostgreSQL

## Prerequisites
- AWS account ([aws.amazon.com](https://aws.amazon.com))
- AWS CLI installed
- Basic AWS knowledge

## Option A: Elastic Beanstalk (Easier)

### Step 1: Prepare Application

1. **Create deployment package**:
   ```bash
   # Remove node_modules and create zip
   rm -rf node_modules client/node_modules
   zip -r crams-backend.zip . -x "client/*" "*.git*"
   ```

2. **Create `.ebextensions/01_nginx.config`**:
   ```yaml
   files:
     "/etc/nginx/conf.d/proxy.conf":
       mode: "000644"
       owner: root
       group: root
       content: |
         upstream nodejs {
           server 127.0.0.1:8081;
           keepalive 256;
         }
         
         server {
           listen 80;
           
           location / {
             proxy_pass http://nodejs;
             proxy_set_header Connection "";
             proxy_http_version 1.1;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_cache_bypass $http_upgrade;
           }
         }
   ```

### Step 2: Deploy Backend

1. **Create RDS Database**:
   - Go to AWS RDS
   - Create PostgreSQL database
   - Note connection details

2. **Create Elastic Beanstalk Application**:
   - Go to Elastic Beanstalk
   - Create Application
   - Platform: Node.js
   - Upload `crams-backend.zip`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8081
   DATABASE_URL=postgresql://username:password@rds-endpoint:5432/crams_db
   JWT_SECRET=your-super-secure-jwt-secret-key
   CLIENT_URL=https://your-cloudfront-domain.cloudfront.net
   ```

### Step 3: Deploy Frontend

1. **Build Frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://crams-frontend-bucket
   aws s3 sync build/ s3://crams-frontend-bucket --delete
   ```

3. **Setup CloudFront**:
   - Create CloudFront distribution
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: 404 → `/index.html` (for SPA routing)

## Option B: ECS with Fargate (Advanced)

### Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    
  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=${BACKEND_URL}
```

### Deploy with ECS:
1. Push images to ECR
2. Create ECS cluster
3. Create task definitions
4. Create services

## Pros & Cons

### ✅ Pros:
- **Enterprise-grade** infrastructure
- **Highly scalable**
- **Full AWS ecosystem**
- **Advanced monitoring**
- **Global CDN**

### ❌ Cons:
- **Complex setup**
- **Higher costs**
- **Learning curve**
- **Overkill for small apps**

## Cost: **$20-100+/month** (depending on usage)
