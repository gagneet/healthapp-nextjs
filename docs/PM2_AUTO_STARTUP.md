# PM2 Auto-Startup Configuration

## Overview

This document describes the PM2 auto-startup configuration for the HealthApp Next.js application and related applications on this server. The configuration ensures that all Node.js applications automatically start when the server reboots.

## Configured Applications

### 1. HealthApp Next.js (Port 3002)
- **URL**: https://healthapp.gagneet.com
- **PM2 Process Name**: `healthapp-nextjs`
- **Directory**: `/home/gagneet/healthapp-nextjs`
- **User**: `gagneet`
- **Service**: `pm2-gagneet.service`

### 2. Hamees Inventory (Port 3009)
- **URL**: https://hamees.gagneet.com
- **PM2 Process Name**: `hamees-inventory`
- **Directory**: `/home/gagneet/hamees`
- **User**: `root`
- **Service**: `pm2-root.service`

## Systemd Services

Two systemd services were created to manage PM2 process resurrection on boot:

### pm2-gagneet.service (This Application)
```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=gagneet
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:/usr/local/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/home/gagneet/.pm2
PIDFile=/home/gagneet/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/local/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/local/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/local/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

**Location**: `/etc/systemd/system/pm2-gagneet.service`

### pm2-root.service
```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=root
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/root/.pm2
PIDFile=/root/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/local/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/local/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/local/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

**Location**: `/etc/systemd/system/pm2-root.service`

## Process Lists

PM2 maintains saved process lists that are resurrected on boot:

- **Gagneet user**: `/home/gagneet/.pm2/dump.pm2` (this application)
- **Root user**: `/root/.pm2/dump.pm2`

## Setup Commands (Already Executed)

The following commands were used to configure auto-startup:

```bash
# For gagneet user (healthapp - this application)
sudo -u gagneet pm2 startup
sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u gagneet --hp /home/gagneet
sudo -u gagneet pm2 save

# For root user (hamees)
pm2 startup
pm2 save
```

## Boot Sequence

When the server reboots, the following happens automatically:

1. **Server Boots**: System starts up
2. **Network Available**: systemd waits for network.target
3. **PM2 Services Start**:
   - `pm2-gagneet.service` starts (this application)
   - `pm2-root.service` starts
4. **PM2 Resurrects Processes**:
   - Reads saved process list from dump.pm2 files
   - Starts all saved applications with original configuration
5. **Applications Available**:
   - HealthApp on port 3002
   - Hamees Inventory on port 3009
6. **Nginx Routes Traffic**: Reverse proxy makes apps publicly available

## Management Commands

### Check Service Status

```bash
# Check this application's service
systemctl status pm2-gagneet

# Check all PM2 services
systemctl status pm2-root
systemctl list-unit-files | grep pm2
```

### Manage This Application (HealthApp)

```bash
# View processes (as gagneet user or with sudo)
pm2 list
sudo -u gagneet pm2 list

# Restart application
pm2 restart healthapp-nextjs
sudo -u gagneet pm2 restart healthapp-nextjs

# View logs
pm2 logs healthapp-nextjs
sudo -u gagneet pm2 logs healthapp-nextjs

# Stop application
pm2 stop healthapp-nextjs

# Start application
pm2 start healthapp-nextjs
```

### Save Process List After Changes

**IMPORTANT**: After starting new processes or making changes, save the process list:

```bash
# Save process list (as gagneet user)
pm2 save
sudo -u gagneet pm2 save
```

### Restart Systemd Service

```bash
# Restart this application's PM2 service
sudo systemctl restart pm2-gagneet

# Reload systemd daemon (if service files changed)
sudo systemctl daemon-reload
```

## Verification After Reboot

After a server reboot, verify this application started correctly:

```bash
# 1. Check systemd service
systemctl status pm2-gagneet

# 2. Check PM2 processes
pm2 list
sudo -u gagneet pm2 list

# 3. Check port is listening
sudo netstat -tlnp | grep :3002

# 4. Test public URL
curl -I https://healthapp.gagneet.com
```

Expected output:
- Service: `active (running)`
- PM2 process: `status: online`
- Port 3002: `LISTEN` state
- URL: `HTTP/2 200`

## Application-Specific Details

### HealthApp Configuration

- **Port**: 3002
- **Environment**: Production
- **Node Version**: 20.19.6
- **Next.js Version**: 14.2.32
- **PM2 Config**: Started with custom node args `--max-old-space-size=2048`
- **Logs**: `/home/gagneet/healthapp-nextjs/logs/`
  - `pm2-out.log` - Standard output
  - `pm2-error.log` - Error output

### Ecosystem File

This application can also be managed via ecosystem.config.js if one exists:

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Save to auto-startup
pm2 save
```

## Adding New Applications

To add a new application to auto-startup (as gagneet user):

```bash
# 1. Start the application with PM2
pm2 start <app> --name <name>

# 2. Verify it's running
pm2 list

# 3. Save the process list
pm2 save

# The application will now auto-start on reboot
```

## Removing This Application from Auto-Startup

```bash
# 1. Stop and delete the process
pm2 stop healthapp-nextjs
pm2 delete healthapp-nextjs

# 2. Save the updated process list
pm2 save

# The application will no longer auto-start
```

## Troubleshooting

### Service Not Starting on Boot

```bash
# Check service status
sudo systemctl status pm2-gagneet

# Check service logs
sudo journalctl -u pm2-gagneet -n 50

# Re-enable service
sudo systemctl enable pm2-gagneet

# Manually start service
sudo systemctl start pm2-gagneet
```

### Process Not Resurrecting

```bash
# Check if dump.pm2 file exists
ls -la /home/gagneet/.pm2/dump.pm2

# View saved processes
cat /home/gagneet/.pm2/dump.pm2 | grep healthapp

# Manually resurrect
pm2 resurrect
sudo -u gagneet pm2 resurrect

# Re-save process list
pm2 save
```

### Port 3002 Already in Use After Reboot

```bash
# Find what's using the port
sudo lsof -i :3002

# Kill the process if needed
sudo kill -9 <PID>

# Restart PM2 process
pm2 restart healthapp-nextjs
```

### Application Crashes on Startup

```bash
# Check PM2 logs
pm2 logs healthapp-nextjs --lines 100

# Check application logs
tail -f /home/gagneet/healthapp-nextjs/logs/pm2-error.log

# Check environment variables
pm2 env 0

# Restart with fresh state
pm2 delete healthapp-nextjs
pm2 start <start-command>
pm2 save
```

### Service Fails to Start

```bash
# Check detailed error
sudo systemctl status pm2-gagneet -l

# Check PM2 logs
pm2 logs

# Restart service manually
sudo systemctl restart pm2-gagneet
```

## Disabling Auto-Startup

If you need to disable auto-startup for this application:

```bash
# Option 1: Remove from PM2 but keep service
pm2 delete healthapp-nextjs
pm2 save

# Option 2: Disable entire service (affects all gagneet PM2 processes)
sudo systemctl disable pm2-gagneet

# Option 3: Remove startup configuration entirely
pm2 unstartup systemd
```

## Important Notes

1. **Always save after changes**: Run `pm2 save` after starting/stopping/restarting processes
2. **User context**: This application runs as `gagneet` user
3. **Memory limit**: Configured with `--max-old-space-size=2048` (2GB)
4. **Auto-restart**: PM2 automatically restarts the app if it crashes
5. **Logs rotation**: PM2 handles log rotation automatically
6. **Environment**: All environment variables must be set before starting PM2

## Common Operations

### Update Application Code

```bash
# 1. Pull latest code
cd /home/gagneet/healthapp-nextjs
git pull

# 2. Install dependencies (if needed)
npm install

# 3. Build application
npm run build

# 4. Restart with PM2 (zero-downtime)
pm2 reload healthapp-nextjs

# Or restart (brief downtime)
pm2 restart healthapp-nextjs
```

### View Real-Time Logs

```bash
# All logs
pm2 logs healthapp-nextjs

# Only errors
pm2 logs healthapp-nextjs --err

# Only output
pm2 logs healthapp-nextjs --out

# Last 100 lines
pm2 logs healthapp-nextjs --lines 100
```

### Monitor Resource Usage

```bash
# Real-time monitoring
pm2 monit

# Process details
pm2 show healthapp-nextjs

# CPU and memory usage
pm2 list
```

## Configuration Date

- **Initial Setup**: January 19, 2026
- **Service**: pm2-gagneet.service
- **Application**: healthapp-nextjs
- **Port**: 3002

## Related Documentation

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Systemd Service Documentation](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs healthapp-nextjs`
2. Check systemd logs: `sudo journalctl -u pm2-gagneet`
3. Verify service status: `systemctl status pm2-gagneet`
4. Check application logs: `/home/gagneet/healthapp-nextjs/logs/`
5. Review this documentation
