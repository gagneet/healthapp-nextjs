# Quick Deployment Commands

## Current Situation

Your healthcare app build is complete and ready, but port 3002 is still held by a root process.

## Fix and Deploy (Run these commands)

```bash
# 1. Kill the root process holding port 3002
sudo pkill -9 -f "next start -p 3002"

# 2. Start the app with PM2
cd ~/healthapp-nextjs
pm2 start ecosystem.config.cjs

# 3. Check status
pm2 status

# 4. View logs
pm2 logs healthapp-nextjs

# 5. Save PM2 config
pm2 save
```

## If That Doesn't Work

If PM2 still shows errors, use direct start instead:

```bash
# 1. Kill root process
sudo pkill -9 -f "next start -p 3002"

# 2. Start directly (test)
cd ~/healthapp-nextjs
npm start

# Press Ctrl+C after verifying it works, then:
# 3. Start in background with nohup
nohup npm start > logs/app.log 2>&1 &
```

## Verify It's Running

```bash
# Check if accessible
curl -I http://localhost:3002

# Check process
ps aux | grep next-server

# Check port
netstat -tlnp | grep 3002
```

## Access Your Application

Once running:
- Local: http://localhost:3002
- Production: https://healthapp.gagneet.com

## Test the Login Fix

1. Go to https://healthapp.gagneet.com/auth/login
2. Enter credentials
3. You should now be redirected to the dashboard automatically!

## Common Issues

### "Port already in use"
```bash
# Find and kill process on port 3002
sudo lsof -i :3002
sudo kill -9 <PID>
```

### "Permission denied"
```bash
# Fix file ownership
sudo chown -R gagneet:gagneet ~/healthapp-nextjs
```

### PM2 not working
```bash
# Delete and restart
pm2 delete healthapp-nextjs
pm2 start ecosystem.config.cjs
```
