# Healthcare Application - Deployment Guide

## 🚀 Quick Start

### First Time Deployment

```bash
cd ~/healthapp-nextjs
./scripts/build-deploy.sh
```

This will:
1. Stop any running instances
2. Clean and rebuild the application
3. Start the app with PM2
4. Make it accessible at https://healthapp.gagneet.com

---

## 📋 Common Commands

### Deploy with Latest Code

```bash
# Full deployment (recommended after code changes)
./scripts/build-deploy.sh

# Deploy without rebuilding (if build already exists)
./scripts/build-deploy.sh --skip-build

# Build only, don't restart
./scripts/build-deploy.sh --skip-restart
```

### Managing the Application

```bash
# Restart the application
pm2 restart healthapp-nextjs

# Stop the application
pm2 stop healthapp-nextjs

# Start the application
pm2 start healthapp-nextjs

# View real-time logs
pm2 logs healthapp-nextjs

# View application status
pm2 status healthapp-nextjs

# Monitor CPU/Memory usage
pm2 monit
```

### Quick Restart (after minor code changes)

```bash
# If you ONLY changed code (no dependencies)
pm2 restart healthapp-nextjs --update-env

# If you changed dependencies (package.json)
./scripts/build-deploy.sh
```

---

## 🔧 Manual Deployment Steps

If you prefer to run steps manually:

### 1. Stop Current Application

```bash
# If running as root
sudo pkill -f "next-server.*3002"

# If running via PM2
pm2 stop healthapp-nextjs
```

### 2. Clean Build Directory (if needed)

```bash
# Fix permissions if .next owned by root
sudo chown -R gagneet:gagneet .next

# Remove old build
rm -rf .next
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build Application

```bash
npm run build
```

### 5. Start with PM2

```bash
# First time
pm2 start ecosystem.config.js

# Restart existing
pm2 restart healthapp-nextjs
```

---

## 🔍 Troubleshooting

### Port 3002 Already in Use

```bash
# Find what's using port 3002
sudo lsof -i :3002

# Kill the process
sudo kill -9 <PID>

# Or use the deploy script which handles this automatically
./scripts/build-deploy.sh
```

### Permission Denied on .next Directory

```bash
# Fix ownership
sudo chown -R gagneet:gagneet .next
rm -rf .next

# Then rebuild
npm run build
```

### Build Fails

```bash
# Clean everything and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Application Not Accessible

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs healthapp-nextjs

# Check if process is running
ps aux | grep next-server

# Check if port 3002 is listening
sudo netstat -tlnp | grep 3002
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check .env file has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Test database connection
npx prisma db pull
```

---

## 📦 PM2 Configuration

The application uses PM2 for process management with the following configuration:

**Location**: `ecosystem.config.js`

**Key Settings**:
- **Name**: healthapp-nextjs
- **Port**: 3002
- **Instances**: 1 (cluster mode)
- **Max Memory**: 1GB (auto-restart if exceeded)
- **User**: gagneet (runs as non-root for security)
- **Logs**: `logs/pm2-error.log` and `logs/pm2-out.log`

### PM2 Startup on Boot

To make the application start automatically on server reboot:

```bash
# Generate startup script
pm2 startup

# Follow the command it outputs (usually requires sudo)
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u gagneet --hp /home/gagneet

# Save current PM2 process list
pm2 save
```

---

## 🔄 Deployment Workflow

### After Pulling Latest Code from Git

```bash
cd ~/healthapp-nextjs
git pull origin master
./scripts/build-deploy.sh
```

### After Changing Environment Variables

```bash
# Edit .env file
nano .env

# Restart with updated environment
pm2 restart healthapp-nextjs --update-env
```

### After Database Schema Changes

```bash
# Run migrations
npx prisma migrate deploy

# Restart application
pm2 restart healthapp-nextjs
```

---

## 📊 Monitoring

### Real-Time Monitoring

```bash
# PM2 built-in monitor
pm2 monit

# View logs in real-time
pm2 logs healthapp-nextjs

# View only error logs
pm2 logs healthapp-nextjs --err

# View only output logs
pm2 logs healthapp-nextjs --out
```

### Check Application Health

```bash
# HTTP check
curl -I http://localhost:3002

# Full response
curl http://localhost:3002

# External check
curl -I https://healthapp.gagneet.com
```

---

## 🔐 Security Best Practices

### Running as Non-Root User

The PM2 configuration automatically runs the application as user `gagneet` instead of root for security.

### If Currently Running as Root

```bash
# Stop root process
sudo pkill -f "next-server.*3002"

# Deploy with PM2 (runs as gagneet)
./scripts/build-deploy.sh
```

### File Permissions

```bash
# Ensure correct ownership
sudo chown -R gagneet:gagneet ~/healthapp-nextjs

# Ensure executable permissions on scripts
chmod +x ~/healthapp-nextjs/scripts/*.sh
```

---

## 📝 Logs

### PM2 Logs Location

- **Error logs**: `~/healthapp-nextjs/logs/pm2-error.log`
- **Output logs**: `~/healthapp-nextjs/logs/pm2-out.log`

### Viewing Logs

```bash
# Real-time logs
pm2 logs healthapp-nextjs

# Last 100 lines
pm2 logs healthapp-nextjs --lines 100

# Clear logs
pm2 flush healthapp-nextjs
```

### Application Logs

Check the browser console and Network tab for client-side issues.

---

## 🎯 Environment-Specific Deployments

### Development

```bash
# Use development environment
NODE_ENV=development npm run dev
```

### Production (Current Setup)

```bash
# Production deployment via PM2
./scripts/build-deploy.sh
```

### Docker Swarm (Advanced)

For Docker Swarm deployment, use the existing script:

```bash
./scripts/deploy.sh prod deploy
```

---

## 🔗 URLs

- **Local**: http://localhost:3002
- **Production**: https://healthapp.gagneet.com
- **API**: https://healthapp.gagneet.com/api
- **Auth**: https://healthapp.gagneet.com/auth/login

---

## ⚕️ Healthcare Application Specific

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run migrate

# Seed database
npm run seed

# Open Prisma Studio
npm run db:studio
```

### HIPAA Compliance Checks

- Ensure HTTPS is enabled (already configured via Cloudflare)
- Check audit logs are being written
- Verify session timeouts are configured
- Review access control in database

---

## 🆘 Emergency Procedures

### Application Down

```bash
# Quick restart
pm2 restart healthapp-nextjs

# If that doesn't work, full redeploy
./scripts/build-deploy.sh
```

### Database Connection Lost

```bash
# Check PostgreSQL service
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Restart application
pm2 restart healthapp-nextjs
```

### High Memory Usage

```bash
# PM2 will auto-restart if > 1GB
# Check current usage
pm2 status

# Manual restart
pm2 restart healthapp-nextjs
```

### Need to Rollback

```bash
# Go back to previous commit
cd ~/healthapp-nextjs
git log --oneline  # Find commit hash
git checkout <commit-hash>

# Redeploy
./scripts/build-deploy.sh
```

---

## 📞 Support

If issues persist:

1. Check PM2 logs: `pm2 logs healthapp-nextjs`
2. Check system logs: `journalctl -u healthapp-nextjs -f` (if using systemd)
3. Check browser console for frontend errors
4. Verify database connectivity
5. Check Nginx/Cloudflare configuration for routing issues

---

*Last Updated: January 2026*
*Application: Healthcare Management Platform v0.9.1*
