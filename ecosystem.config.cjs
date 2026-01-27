module.exports = {
  apps: [{
    name: 'healthapp-nextjs',
    script: '.next/standalone/server.js',
    cwd: '/home/gagneet/healthapp-nextjs',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: '3003'
    },
    error_file: '/home/gagneet/healthapp-nextjs/logs/pm2-error.log',
    out_file: '/home/gagneet/healthapp-nextjs/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '2G'
  }]
};
