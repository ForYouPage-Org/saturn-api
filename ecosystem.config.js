module.exports = {
  apps: [
    {
      name: 'saturn-api',
      script: 'dist/index.js',
      instances: 1, // Can be increased based on server capacity
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      // PM2 Options
      watch: false, // Don't watch files in production
      max_memory_restart: '500M', // Restart if memory usage exceeds 500MB
      error_file: './logs/saturn-api-error.log',
      out_file: './logs/saturn-api-out.log',
      log_file: './logs/saturn-api-combined.log',
      time: true, // Prefix logs with timestamp
      
      // Advanced PM2 options
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_url: 'http://localhost:4000/health',
      health_check_grace_period: 3000,
      
      // Environment variables that should be loaded from .env file
      env_file: '.env',
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/saturn-api.git',
      path: '/root/saturn-api',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install --frozen-lockfile && yarn build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};