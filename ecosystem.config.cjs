// PM2 Ecosystem Configuration for Healthcare Application
// Uses Next.js Standalone Server with proper environment variable loading

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envConfig = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (envConfig.error) {
  console.error('Error loading .env file:', envConfig.error);
}

module.exports = {
  apps: [{
    name: 'healthapp-nextjs',
    script: '.next/standalone/server.js',
    cwd: __dirname,
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      // Explicitly pass DATABASE_URL and other critical env vars
      ...envConfig.parsed,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002,
      ...envConfig.parsed,
    },
    max_memory_restart: '2G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    shutdown_with_message: true
  }]
};
