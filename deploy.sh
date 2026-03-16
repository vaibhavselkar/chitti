#!/bin/bash

# Chitti Management Application Deployment Script
# This script helps deploy the application to Vercel

echo "🚀 Starting Chitti Management Application Deployment"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run 'vercel login' first."
    exit 1
fi

echo "✅ Vercel CLI is installed and user is logged in"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🔨 Building frontend..."
cd client
npm run build
cd ..

echo "✅ Frontend built successfully"

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please ensure it exists in the root directory."
    exit 1
fi

echo "✅ vercel.json found"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel

echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set environment variables (see DEPLOYMENT.md for details)"
echo "3. Configure MongoDB Atlas connection"
echo "4. Test your deployment"
echo ""
echo "📖 For detailed deployment instructions, see DEPLOYMENT.md"