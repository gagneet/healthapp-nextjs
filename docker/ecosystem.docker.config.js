// PM2 ecosystem config for Docker container deployment
// This is different from the host ecosystem.config.cjs

module.exports = {
  apps: [{
    name: 'healthapp-nextjs',
    script: 'server.js',
    instances: 2,  // Run 2 instances for load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: '3002',
    },
    error_file: '/app/logs/pm2-error.log',
    out_file: '/app/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    // Graceful start/shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true,
  }]
};
