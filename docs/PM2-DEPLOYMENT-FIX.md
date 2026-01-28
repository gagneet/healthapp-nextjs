# PM2 Deployment Build Fix

## Problem Summary

The `scripts/deploy-pm2.sh` script encountered two critical issues during deployment:

### Issue 1: Missing Tailwind CSS Plugins
```
Error: Cannot find module '@tailwindcss/forms'
Require stack:
- /home/gagneet/healthapp-nextjs/tailwind.config.js
```

### Issue 2: Nodemailer Peer Dependency Conflict
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error Conflicting peer dependency: nodemailer@7.0.13
npm error peerOptional nodemailer@"^7.0.7" from next-auth@5.0.0-beta.30
```

### Root Cause Analysis

**Issue 1: NPM Cache Inconsistency**
1. `package.json` declares `@tailwindcss/forms` and `@tailwindcss/typography` as devDependencies
2. The packages exist in `package-lock.json`
3. But `node_modules/@tailwindcss/forms` directory is missing
4. When running `npm install`, npm reports "up to date" without actually installing the missing packages
5. Script continues assuming packages are installed
6. Build fails when Tailwind tries to load the plugins

**Issue 2: Nodemailer Version Conflict**
1. Project specified `nodemailer@^6.10.1` in package.json
2. `next-auth@5.0.0-beta.30` requires `nodemailer@^7.0.7` as peer dependency
3. NPM's strict peer dependency resolution prevents installation
4. Clean install fails with ERESOLVE error before any packages are installed

**Additional Issues Detected**
- Node version mismatch warning (requires >=22.8.0, running v20.19.6)
- No verification of package installation success AFTER running install commands
- No npm cache clearing mechanism
- No fallback for peer dependency conflicts

## Solution Implemented

### 1. Fixed Nodemailer Peer Dependency Conflict

**Updated package.json:**
```json
{
  "dependencies": {
    "nodemailer": "^7.0.13"  // Upgraded from ^6.10.1
  }
}
```

This resolves the conflict with `next-auth@5.0.0-beta.30` which requires `nodemailer@^7.0.7`.

**Breaking Changes:**
- Nodemailer v7 requires Node.js >=16.x
- Some deprecated options removed (most basic usage unchanged)
- Better ESM module support

### 2. Enhanced npm install with Automatic Retry

**Before Fix:**
```bash
if npm install; then
    # Success
else
    log_error "npm install failed"
    exit 1
fi
```

**After Fix:**
```bash
if npm install; then
    log_success "Dependencies installed"
else
    log_warning "npm install failed, retrying with --legacy-peer-deps..."
    if npm install --legacy-peer-deps; then
        log_success "Dependencies installed with --legacy-peer-deps"
    else
        log_error "npm install failed"
        log_error "Try manually: npm install --legacy-peer-deps"
        exit 1
    fi
fi
```

The script now automatically retries with `--legacy-peer-deps` if the initial install fails due to peer dependency issues.

### 3. Enhanced Package Installation Verification

**Before Fix:**
```bash
# Old logic - checks before install only
if [ ! -d "node_modules/@tailwindcss/forms" ]; then
    npm install @tailwindcss/forms @tailwindcss/typography --save-dev
    # No verification after!
fi
```

**After Fix:**
```bash
# New logic - verify AFTER install with force option
install_tailwind_plugins() {
    if [ ! -d "node_modules/@tailwindcss/forms" ] || [ ! -d "node_modules/@tailwindcss/typography" ]; then
        # Force fresh install
        npm install --force @tailwindcss/forms @tailwindcss/typography --save-dev

        # Verify installation succeeded
        if [ ! -d "node_modules/@tailwindcss/forms" ] || [ ! -d "node_modules/@tailwindcss/typography" ]; then
            # Still missing? Clear cache and retry
            npm cache clean --force
            npm install --force @tailwindcss/forms @tailwindcss/typography --save-dev

            # Final verification
            if [ ! -d "node_modules/@tailwindcss/forms" ]; then
                log_error "CRITICAL: @tailwindcss/forms still not installed after retry"
                exit 1
            fi
        fi
    fi
}
```

### 4. NPM Cache Management

Added cache clearing options:
- `--clear-cache`: Force npm cache clean before install
- Automatic cache clearing if packages fail to install on first attempt

### 5. Post-Install Verification

Added mandatory verification after ALL installation steps:
```bash
verify_critical_packages() {
    local missing_packages=()

    # Check each critical package
    [ ! -d "node_modules/@tailwindcss/forms" ] && missing_packages+=("@tailwindcss/forms")
    [ ! -d "node_modules/@tailwindcss/typography" ] && missing_packages+=("@tailwindcss/typography")
    [ ! -d "node_modules/next" ] && missing_packages+=("next")
    [ ! -d "node_modules/react" ] && missing_packages+=("react")

    if [ ${#missing_packages[@]} -gt 0 ]; then
        log_error "Critical packages missing: ${missing_packages[*]}"
        exit 1
    fi
}
```

### 6. Improved Error Messages

Enhanced error messages to guide resolution:
```bash
[ERROR] Critical packages missing after installation
[ERROR] This indicates npm cache corruption or network issues
[ERROR]
[ERROR] Manual fix:
[ERROR]   1. npm cache clean --force
[ERROR]   2. rm -rf node_modules package-lock.json
[ERROR]   3. npm install
[ERROR]   4. Re-run this script
```

## New Script Features

### Additional Command-Line Options

```bash
# Clear npm cache before installation
./scripts/deploy-pm2.sh --clear-cache

# Verify packages without building
./scripts/deploy-pm2.sh --verify-only

# Force reinstall of all packages
./scripts/deploy-pm2.sh --clean --clear-cache
```

### Enhanced Installation Flow

1. **Prerequisites Check** - Verify environment setup
2. **Package Installation** (with new verification and retry)
   - Run `npm install`
   - If fails: Retry with `--legacy-peer-deps` (handles peer dependency conflicts)
   - Verify critical packages exist in node_modules
   - If missing: force install with --force flag
   - If still missing: clear cache and retry
   - If still missing: FAIL with clear error message
3. **Prisma Generation** - Generate Prisma client
4. **Build** - Run Next.js build
5. **Migrations** - Deploy database migrations
6. **PM2 Management** - Start/restart application

## Testing the Fix

### Test Case 1: Fresh Install
```bash
rm -rf node_modules
./scripts/deploy-pm2.sh
# Should install all packages and build successfully
```

### Test Case 2: Corrupted node_modules
```bash
rm -rf node_modules/@tailwindcss
./scripts/deploy-pm2.sh
# Should detect missing packages and reinstall them
```

### Test Case 3: NPM Cache Issues
```bash
./scripts/deploy-pm2.sh --clear-cache
# Should clear cache first, then install cleanly
```

### Test Case 4: Clean Reinstall (Recommended)
```bash
./scripts/deploy-pm2.sh --clean --clear-cache
# Should remove everything and start fresh
```

## Expected Behavior After Fix

✅ Nodemailer upgraded to v7 (resolves peer dependency conflict)
✅ Script automatically retries npm install with --legacy-peer-deps if needed
✅ Script detects missing Tailwind CSS plugins
✅ Force installs packages with --force flag
✅ Verifies packages are actually in node_modules after install
✅ Clears npm cache and retries if installation fails
✅ Provides clear error messages if problems persist
✅ Build succeeds with all required packages present

## Additional Recommendations

### 1. Node Version Upgrade
Current: v20.19.6
Required: >=22.8.0

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22
nvm alias default 22

# Or using apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v22.x.x
```

### 2. Test Email Functionality

After upgrading nodemailer to v7, test your email sending functionality:

```typescript
// Most basic usage remains the same
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // Your config
});

await transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test',
  text: 'Test email'
});
```

Review the [nodemailer v7 changelog](https://nodemailer.com/about/#version-7) for any deprecated features you might be using.

### 3. Package.json Engine Enforcement

The project specifies `"engines": { "node": ">=22.8.0" }` but npm allows running with older versions. Consider adding `.npmrc`:

```
engine-strict=true
```

This will make npm refuse to install with incompatible Node versions.

### 4. Lock File Integrity

Ensure `package-lock.json` is committed to git and not modified manually. This prevents version mismatches.

### 5. CI/CD Integration

When using this script in CI/CD:
```bash
# Always use clean install in CI
./scripts/deploy-pm2.sh --clean --auto-yes
```

## Troubleshooting

### If Build Still Fails

1. **Manually verify packages:**
   ```bash
   ls -la node_modules/@tailwindcss/
   # Should show: forms/ and typography/

   ls -la node_modules/nodemailer/
   # Should exist and show v7.x.x in package.json
   ```

2. **Check package.json integrity:**
   ```bash
   npm ls @tailwindcss/forms
   npm ls @tailwindcss/typography
   npm ls nodemailer
   ```

3. **Nuclear option (complete reset):**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npx prisma generate
   npm run build
   ```

4. **Check for permission issues:**
   ```bash
   ls -la node_modules/ | grep -E "^d---------"
   # Should return nothing - no directories with no permissions
   ```

5. **If peer dependency issues persist:**
   ```bash
   # Try with legacy peer deps
   npm install --legacy-peer-deps

   # Or force
   npm install --force
   ```

## Files Modified

- ✅ `package.json` - Upgraded nodemailer from ^6.10.1 to ^7.0.13
- ✅ `scripts/deploy-pm2.sh` - Enhanced installation, retry logic, and verification
- ✅ `docs/PM2-DEPLOYMENT-FIX.md` - This documentation (NEW)
- ✅ `docs/PM2-DEPLOYMENT-QUICKSTART.md` - Quick reference guide (NEW)

## Breaking Changes & Migration Notes

### Nodemailer v6 → v7

**What Changed:**
- Minimum Node.js version: 16.x (you're on 20.x, so safe)
- Better ESM module support
- Some deprecated options removed
- Improved security features

**What Stayed the Same:**
- Basic API for sending emails (transporter.sendMail())
- Configuration options for SMTP, Gmail, etc.
- Attachment handling

**Action Required:**
1. After deployment, test all email functionality (registration, password reset, notifications)
2. Review any custom nodemailer code for deprecated features
3. Check logs for any nodemailer-related warnings

**Reference:**
- [Nodemailer v7 Release Notes](https://nodemailer.com/about/#version-7)
- [Migration Guide](https://nodemailer.com/about/#migration-guide)

## Version History

- **v1.1** (2026-01-28)
  - Fixed nodemailer peer dependency conflict (v6 → v7)
  - Added automatic retry with --legacy-peer-deps
  - Enhanced error messages for dependency resolution

- **v1.0** (2026-01-28)
  - Initial fix for Tailwind CSS plugin installation issue
  - Added cache clearing and verification logic
  - Added critical package verification

Author: Claude Code
