# Healthcare Application - Troubleshooting Guide

## Common Issues and Solutions

### Issue: Port 3002 Already in Use

**Symptoms:**
- PM2 shows status as "errored"
- Error: `EADDRINUSE: address already in use :::3002`
- Application won't start

**Root Cause:**
Multiple Next.js server processes running (sometimes as root user)

**Solution:**

#### Quick Fix:
```bash
./scripts/kill-port-3002.sh
pm2 start ecosystem.config.cjs
```

#### Manual Fix:
```bash
# 1. Find what's using port 3002
sudo netstat -tlnp | grep 3002

# 2. Kill the process (replace PID with actual process ID)
sudo kill -9 <PID>

# 3. Verify port is free
netstat -tlnp | grep 3002

# 4. Start the app
pm2 start ecosystem.config.cjs
```

#### Complete Cleanup:
```bash
# Kill ALL next-server processes
ps aux | grep next-server | grep -v grep | awk '{print $2}' | xargs sudo kill -9

# Kill shell parent processes
ps aux | grep "sh -c next start" | grep -v grep | awk '{print $2}' | xargs sudo kill -9

# Delete PM2 process
pm2 delete healthapp-nextjs

# Restart fresh
pm2 start ecosystem.config.cjs
```

---

### Issue: PM2 Shows "Errored" Status

**Symptoms:**
- PM2 lists the app as "errored"
- App restarts repeatedly (high restart count)

**Possible Causes:**

#### 1. Port Already in Use
See "Port 3002 Already in Use" above

#### 2. Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U <username> -d <database> -c "SELECT 1;"

# Check .env file
cat .env | grep DATABASE_URL
```

**Solution:**
```bash
# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Verify connection string in .env
# Should be: postgresql://user:password@host:5432/database

# Restart app
pm2 restart healthapp-nextjs
```

#### 3. Build Files Missing
```bash
# Check if .next directory exists and has files
ls -la .next/

# If missing or incomplete, rebuild
npm run build

# Then restart
pm2 restart healthapp-nextjs
```

---

### Issue: Application Starts But Crashes Immediately

**Symptoms:**
- PM2 shows "online" briefly then "errored"
- Restart count keeps incrementing

**Solution:**

#### Check Logs:
```bash
# View error logs
pm2 logs healthapp-nextjs --err --lines 50

# View all logs
pm2 logs healthapp-nextjs --lines 100
```

#### Common Fixes:

**Missing Environment Variables:**
```bash
# Verify .env file exists
ls -la .env

# Check required variables are set
cat .env | grep -E "DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL"

# If missing, add them and restart
pm2 restart healthapp-nextjs --update-env
```

**Prisma Client Not Generated:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart app
pm2 restart healthapp-nextjs
```

---

### Issue: Application Running as Root User

**Symptoms:**
- Process shows owner as "root" in `ps aux`
- Need sudo to kill the process
- Security concern for healthcare data

**Solution:**

```bash
# 1. Kill root process
sudo pkill -9 -f "next-server"

# 2. Start with PM2 as gagneet user (not root)
pm2 start ecosystem.config.cjs

# 3. Verify it's running as gagneet
pm2 status
ps aux | grep next-server
```

**Prevention:**
- Always use PM2 to start the app (not `sudo npm start`)
- PM2 config is set to run as user `gagneet`

---

### Issue: Build Permission Errors

**Symptoms:**
- `npm run build` fails with EACCES errors
- Cannot remove `.next` directory

**Solution:**

```bash
# Fix ownership of entire project
sudo chown -R gagneet:gagneet ~/healthapp-nextjs

# Remove .next if needed
rm -rf .next

# If that fails, use sudo
sudo rm -rf .next
sudo chown -R gagneet:gagneet ~/healthapp-nextjs

# Then rebuild
npm run build
```

---

### Issue: Changes Not Reflected After Deployment

**Symptoms:**
- Code changes don't appear in running app
- Old version still showing

**Solution:**

```bash
# Full rebuild and restart
./scripts/build-deploy.sh

# Or manual steps:
pm2 delete healthapp-nextjs
rm -rf .next
npm run build
pm2 start ecosystem.config.cjs
```

---

### Issue: Database Migration Errors

**Symptoms:**
- Prisma errors about schema mismatch
- "Table doesn't exist" errors

**Solution:**

```bash
# Check migration status
npx prisma migrate status

# Run pending migrations
npx prisma migrate deploy

# If migrations are broken, reset (WARNING: deletes data)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate

# Restart app
pm2 restart healthapp-nextjs
```

---

### Issue: Memory Issues / High Memory Usage

**Symptoms:**
- PM2 shows high memory usage (>1GB)
- App automatically restarts due to memory limit

**Solution:**

PM2 is configured to auto-restart if memory exceeds 1GB. This is normal for healthcare apps with patient data.

**If restarts are too frequent:**

```bash
# Edit ecosystem.config.cjs
# Change: max_memory_restart: '1G'
# To:     max_memory_restart: '2G'

# Restart with new config
pm2 delete healthapp-nextjs
pm2 start ecosystem.config.cjs
```

---

### Issue: Cannot Access Application Externally

**Symptoms:**
- Works on `localhost:3002`
- Doesn't work on `healthapp.gagneet.com`

**Possible Causes:**

#### 1. Nginx/Reverse Proxy Not Configured
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 2. Firewall Blocking
```bash
# Check firewall status
sudo ufw status

# Allow port 3002 if needed
sudo ufw allow 3002/tcp

# Or if using different port via proxy, allow that
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### 3. Cloudflare/DNS Issues
- Check Cloudflare dashboard
- Verify DNS A record points to correct IP
- Check SSL/TLS settings

---

## Debugging Commands

### Check Application Status
```bash
# PM2 status
pm2 status

# Detailed info
pm2 show healthapp-nextjs

# Real-time monitoring
pm2 monit
```

### Check Logs
```bash
# Live logs
pm2 logs healthapp-nextjs

# Error logs only
pm2 logs healthapp-nextjs --err

# Last 100 lines
pm2 logs healthapp-nextjs --lines 100

# Clear logs
pm2 flush healthapp-nextjs
```

### Check Port Usage
```bash
# Check if port 3002 is listening
netstat -tlnp | grep 3002

# With sudo to see process names
sudo netstat -tlnp | grep 3002

# Alternative method
sudo lsof -i :3002
```

### Check Process Details
```bash
# Find all Next.js processes
ps aux | grep next-server

# Check specific process
ps -p <PID> -f

# Check process tree
pstree -p <PID>
```

### Check Database Connection
```bash
# Test PostgreSQL connection
psql -U healthapp_user -d healthapp_dev -c "SELECT version();"

# Check database tables
npx prisma studio

# Run test query
npx prisma db execute --sql "SELECT COUNT(*) FROM \"User\";"
```

---

## Emergency Recovery

If nothing works and you need to get the app running ASAP:

```bash
# 1. Nuclear option - kill everything
sudo pkill -9 -f "next"
pm2 delete all

# 2. Clean slate
cd ~/healthapp-nextjs
rm -rf .next node_modules

# 3. Fresh install
npm install

# 4. Build
npm run build

# 5. Start
pm2 start ecosystem.config.cjs

# 6. Check status
pm2 status
curl http://localhost:3002
```

---

## Getting Help

### Log Files to Check
- PM2 logs: `~/healthapp-nextjs/logs/pm2-*.log`
- Nginx logs: `/var/log/nginx/error.log`
- PostgreSQL logs: `/var/log/postgresql/`
- System logs: `journalctl -xe`

### Information to Provide for Support
```bash
# System info
uname -a
node --version
npm --version
pm2 --version

# Application status
pm2 status
pm2 logs healthapp-nextjs --lines 50 --nostream

# Port status
sudo netstat -tlnp | grep 3002

# Process list
ps aux | grep next-server
```

---

## Preventive Maintenance

### Daily Checks
```bash
# Check app status
pm2 status

# Check logs for errors
pm2 logs healthapp-nextjs --err --lines 20 --nostream
```

### Weekly Tasks
```bash
# Update dependencies (carefully, test in dev first)
npm outdated
# npm update (only if safe)

# Check disk space
df -h

# Rotate logs
pm2 flush healthapp-nextjs
```

### Monthly Tasks
```bash
# Database backup
pg_dump healthapp_dev > backup_$(date +%Y%m%d).sql

# Review PM2 logs for patterns
pm2 logs healthapp-nextjs --lines 1000 --nostream | grep -i error

# Update PM2
npm install -g pm2@latest
pm2 update
```

---

*Last Updated: January 2026*
*Healthcare Management Platform v0.9.1*
