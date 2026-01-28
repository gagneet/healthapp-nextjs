# PM2 Deployment Quick Start Guide

## Problem Fixed

The `scripts/deploy-pm2.sh` script was failing with:
```
Error: Cannot find module '@tailwindcss/forms'
```

**Root Cause**: NPM cache corruption causing packages to not install despite showing "up to date"

**Solution**: Enhanced script with:
- Force installation with `--force` flag
- Post-installation verification
- Automatic cache clearing and retry logic
- Better error messages

## Quick Commands

### Fix Current Issue (Recommended)

```bash
# Complete clean reinstall (fixes most issues)
./scripts/deploy-pm2.sh --clean --clear-cache
```

### Alternative Fixes

```bash
# Just clear cache and install
./scripts/deploy-pm2.sh --clear-cache

# Verify packages are installed correctly
./scripts/deploy-pm2.sh --verify-only

# Standard deployment (if packages are ok)
./scripts/deploy-pm2.sh
```

### Common Scenarios

```bash
# Fresh deployment after pulling changes
./scripts/deploy-pm2.sh --clean

# Quick restart (code changes only, no deps changed)
./scripts/deploy-pm2.sh --skip-install --skip-build

# Full rebuild with database migration
./scripts/deploy-pm2.sh --clean --clear-cache --seed
```

## What the Script Now Does

### 1. **Enhanced Package Installation**
- Runs `npm install`
- **NEW**: Verifies `@tailwindcss/forms` and `@tailwindcss/typography` actually exist in node_modules
- **NEW**: If missing, force installs with `--force` flag
- **NEW**: If still missing, clears cache and retries
- **NEW**: Fails with clear error message if packages can't be installed

### 2. **Critical Package Verification**
Checks these packages are present before building:
- `@tailwindcss/forms`
- `@tailwindcss/typography`
- `next`
- `react`
- `@prisma/client`
- `tailwindcss`

### 3. **Better Error Messages**
If packages fail to install, you'll see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: Tailwind CSS plugins failed to install
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This indicates npm cache corruption or network issues.

Manual fix required:
  1. npm cache clean --force
  2. rm -rf node_modules package-lock.json
  3. npm install
  4. Re-run this script

Or try: ./scripts/deploy-pm2.sh --clean --clear-cache
```

## New Command-Line Options

| Option | Description |
|--------|-------------|
| `--clear-cache` | Clear npm cache before install (fixes corruption) |
| `--verify-only` | Verify packages without building/deploying |
| `--clean` | Remove node_modules and package-lock.json |
| `--skip-install` | Skip npm install step |
| `--skip-build` | Skip Next.js build |
| `--no-migrate` | Skip database migrations |
| `--seed` | Run database seeders |
| `--auto-yes` | Skip confirmation prompts |

## Recommended Workflow

### After Pulling Code Changes

```bash
# If only code changed (no package.json changes)
./scripts/deploy-pm2.sh

# If package.json changed
./scripts/deploy-pm2.sh --clean --clear-cache
```

### When Build Fails

```bash
# First try: Clean reinstall
./scripts/deploy-pm2.sh --clean --clear-cache

# If still failing: Check what's missing
./scripts/deploy-pm2.sh --verify-only

# If verification fails: Manual cleanup
npm cache clean --force
rm -rf node_modules package-lock.json .next
npm install
./scripts/deploy-pm2.sh --skip-install
```

### For Production Deployment

```bash
# Always use clean install in production
./scripts/deploy-pm2.sh --clean --clear-cache --auto-yes
```

## How the Fix Works

### Old Behavior (BROKEN)
```bash
1. npm install → reports "up to date"
2. Check if @tailwindcss/forms exists → NO
3. npm install @tailwindcss/forms → reports "up to date"
4. Continue to build → FAILS (package not actually installed)
```

### New Behavior (FIXED)
```bash
1. npm install → completes
2. Check if @tailwindcss/forms exists → NO
3. npm install --force @tailwindcss/forms → force reinstall
4. Verify package exists → YES? Continue : Retry with cache clear
5. If retry fails → Show clear error message with manual fix steps
6. If success → Continue to build → SUCCESS
```

## Files Modified

- ✅ `scripts/deploy-pm2.sh` - Enhanced with verification and retry logic
- ✅ `docs/PM2-DEPLOYMENT-FIX.md` - Detailed technical documentation
- ✅ `docs/PM2-DEPLOYMENT-QUICKSTART.md` - This quick reference

## Testing the Fix

Run this to test the fix works:

```bash
# Simulate the problem
rm -rf node_modules/@tailwindcss

# Run the script - should detect and fix automatically
./scripts/deploy-pm2.sh

# Should see:
# [WARNING] ⚠️  @tailwindcss/forms missing from node_modules
# [WARNING] Installing Tailwind CSS plugins with --force flag...
# [SUCCESS] ✅ Tailwind CSS plugins installed successfully
# [SUCCESS] ✅ All critical packages verified
# ... build continues and succeeds
```

## Additional Notes

### Node Version Warning

You're running Node v20.19.6, but package.json requires >=22.8.0.

To upgrade:
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
```

### PM2 Commands

After successful deployment:

```bash
# View logs
pm2 logs healthapp-nextjs

# Monitor resources
pm2 monit

# Restart app
pm2 restart healthapp-nextjs

# Stop app
pm2 stop healthapp-nextjs

# View status
pm2 status
```

## Need Help?

1. Check `/docs/PM2-DEPLOYMENT-FIX.md` for detailed technical analysis
2. Run `./scripts/deploy-pm2.sh --help` for all options
3. Try `./scripts/deploy-pm2.sh --verify-only` to check package installation

## Success Indicators

When the script runs successfully, you'll see:

```
🚀 HealthApp PM2 Deployment
============================

✓ All prerequisites met
✓ Schema validation passed
✓ Dependencies installed
✓ Tailwind CSS plugins verified
✓ All critical packages verified
✓ Prisma client generated
✓ Build completed successfully
✓ Migrations applied
✓ PM2 app restarted

🎉 PM2 Deployment Complete!
```

Access your app at: http://localhost:3002
