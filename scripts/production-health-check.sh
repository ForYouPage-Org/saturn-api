#!/bin/bash

# Production Health Check Script for Saturn API
echo "🏥 Saturn API Production Health Check"
echo "======================================"

# Check if application is running
echo "1. 📊 Checking PM2 process status..."
pm2 status saturn-api 2>/dev/null || echo "❌ Saturn API not running in PM2"

# Check application health endpoint
echo -e "\n2. 🔍 Testing application health endpoint..."
if curl -f -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Application health endpoint responding"
    curl -s http://localhost:4000/health | jq '.' 2>/dev/null || curl -s http://localhost:4000/health
else
    echo "❌ Application health endpoint not responding"
fi

# Check MongoDB Atlas connection
echo -e "\n3. 🗄️  Testing MongoDB Atlas connection..."
if command -v node &> /dev/null; then
    node scripts/verify-mongodb.js
else
    echo "❌ Node.js not found, cannot test MongoDB connection"
fi

# Check environment variables
echo -e "\n4. ⚙️  Checking environment variables..."
if [ -z "$MONGO_URI" ]; then
    echo "❌ MONGO_URI not set"
else
    echo "✅ MONGO_URI configured"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET not set"
else
    echo "✅ JWT_SECRET configured"
fi

# Check port availability
echo -e "\n5. 🌐 Checking port availability..."
if netstat -tuln | grep -q ":4000 "; then
    echo "✅ Port 4000 is in use (application likely running)"
else
    echo "❌ Port 4000 is not in use"
fi

# Check recent logs for errors
echo -e "\n6. 📋 Checking recent logs for errors..."
if command -v pm2 &> /dev/null; then
    echo "Recent error logs:"
    pm2 logs saturn-api --lines 5 --err 2>/dev/null || echo "No recent error logs"
else
    echo "PM2 not available, cannot check logs"
fi

echo -e "\n✅ Health check completed!"