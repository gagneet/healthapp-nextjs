/**
 * PM2 Ecosystem Configuration for Healthcare Management Platform
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart healthapp-nextjs
 *   pm2 stop healthapp-nextjs
 *   pm2 logs healthapp-nextjs
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'healthapp-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '/home/gagneet/healthapp-nextjs',
      instances: 1,
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',

      // Watch and reload (disabled for production)
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],

      // Graceful shutdown
      kill_timeout: 5000,

      // Additional options for healthcare application
      node_args: '--max-old-space-size=2048',

      // Cron restart (optional - restart at 3 AM daily)
      // cron_restart: '0 3 * * *',
    },
  ],
}
