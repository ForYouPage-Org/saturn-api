# 🚀 Saturn API Production Deployment Guide

## Quick Fix for Current Production Issue

Based on the PM2 logs showing module resolution errors, follow these steps to fix the production deployment:

### 1. **Stop Current Process**
```bash
pm2 stop saturn-api
pm2 delete saturn-api
```

### 2. **Update Production Code**
```bash
cd /root/saturn-api
git pull origin main  # Get latest changes with module-alias fix
```

### 3. **Install Dependencies**
```bash
yarn install --frozen-lockfile
```

### 4. **Rebuild Application**
```bash
yarn build
```

### 5. **Deploy with PM2**
```bash
yarn deploy:pm2
# OR manually:
pm2 start ecosystem.config.js --env production
```

### 6. **Verify Deployment**
```bash
pm2 status
pm2 logs saturn-api --lines 20
```

---

## Complete Production Setup (First Time)

### Prerequisites
- Node.js 18+ installed
- MongoDB 6.0+ running
- PM2 installed globally: `npm install -g pm2`
- Git repository cloned to `/root/saturn-api`

### Environment Setup
```bash
# Create production environment file
cp .env.example .env

# Edit with production values
nano .env
```

Required environment variables:
```bash
NODE_ENV=production
PORT=4000
DOMAIN=yourdomain.com
MONGO_URI=mongodb://localhost:27017/saturn-production
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars
LOG_LEVEL=info
```

### Deployment Steps
```bash
# 1. Install dependencies
yarn install --frozen-lockfile

# 2. Run security checks
yarn ci:security

# 3. Build application
yarn build

# 4. Start with PM2
pm2 start ecosystem.config.js --env production

# 5. Setup PM2 to start on boot
pm2 startup
pm2 save
```

### Monitoring & Maintenance
```bash
# View logs
pm2 logs saturn-api

# Monitor performance
pm2 monit

# Restart if needed
pm2 restart saturn-api

# View process details
pm2 show saturn-api
```

### Health Check
Once deployed, verify the API is working:
```bash
# Check health endpoint
curl http://localhost:4000/health

# Check API response
curl http://localhost:4000/api/health
```

## Troubleshooting

### Module Resolution Errors
If you see "Cannot find module '@/modules/...'" errors:

1. **Verify module-alias is installed:**
   ```bash
   yarn list module-alias
   ```

2. **Check package.json configuration:**
   ```bash
   grep -A 3 "_moduleAliases" package.json
   ```

3. **Test module resolution:**
   ```bash
   node -e "require('module-alias/register'); console.log('Working')"
   ```

### Database Connection Issues
```bash
# Check MongoDB status
systemctl status mongod

# Test connection
mongosh --eval "db.runCommand('ping')"

# Check environment variables
echo $MONGO_URI
```

### PM2 Process Issues
```bash
# Kill all PM2 processes
pm2 kill

# Start fresh
pm2 start ecosystem.config.js --env production

# Check for port conflicts
lsof -i :4000
```

## Performance Optimization

### PM2 Cluster Mode
For production with multiple CPU cores:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'saturn-api',
    script: 'dist/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster'
  }]
}
```

### Memory Management
```bash
# Monitor memory usage
pm2 monit

# Set memory limit
pm2 start dist/index.js --name saturn-api --max-memory-restart 500M
```

### Log Rotation
```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```