#!/bin/bash

# Saturn API Deployment Script
set -e

echo "🚀 Starting Saturn API deployment..."

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found, using system environment variables"
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile --production=false

# Run quality checks
echo "🔍 Running quality checks..."
yarn ci:security
yarn ci:quality

# Build application
echo "🔨 Building application..."
yarn build

# Remove development dependencies to reduce size
echo "🧹 Cleaning up development dependencies..."
yarn install --frozen-lockfile --production=true

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop saturn-api 2>/dev/null || echo "No existing process to stop"
pm2 delete saturn-api 2>/dev/null || echo "No existing process to delete"

# Start with PM2
echo "▶️  Starting application with PM2..."
pm2 start dist/index.js --name "saturn-api" --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Show status
echo "📊 Application status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🔗 Application should be running on port ${PORT:-4000}"