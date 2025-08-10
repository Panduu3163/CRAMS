#!/bin/bash
# Build script for React frontend deployment on Render

echo "🚀 Starting CRAMS Frontend Build Process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment variables
export REACT_APP_API_URL=${REACT_APP_API_URL:-"https://crams-backend.onrender.com"}
export GENERATE_SOURCEMAP=false

# Build the React application
echo "🔨 Building React application..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in the ./build directory"
