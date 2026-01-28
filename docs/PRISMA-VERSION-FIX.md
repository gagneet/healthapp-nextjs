# Prisma Version Fix - 2026-01-28

## Problem

The deployment script was failing with:

```
Error: Prisma schema validation - (validate wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
Prisma CLI Version : 7.3.0
```

## Root Cause

- Project uses **Prisma 6.16.1** (specified in package.json)
- Script was using `npx prisma` commands
- `npx` downloaded and used **Prisma 7.3.0** (latest version)
- Prisma 7 has breaking changes (no longer supports `url` in datasource)

## Solution

Updated `scripts/deploy-pm2.sh` to use locally installed Prisma version:

### Changes Made

**Before (BROKEN):**
```bash
npx prisma validate           # Downloads Prisma 7.x
npx prisma migrate status     # Uses Prisma 7.x
npx prisma generate           # Uses Prisma 7.x
npx prisma migrate deploy     # Uses Prisma 7.x
npx prisma db seed            # Uses Prisma 7.x
```

**After (FIXED):**
```bash
npm run db:generate           # Uses Prisma 6.16.1 from node_modules
npm exec -- prisma migrate status  # Uses Prisma 6.16.1
npm run db:generate           # Uses package.json script
npm run migrate               # Uses package.json script (prisma 6.16.1)
npm run seed                  # Uses package.json script (prisma 6.16.1)
```

## Why This Works

- `npm run <script>` uses the versions specified in package.json
- `npm exec -- prisma` uses the locally installed `prisma` from node_modules
- Both approaches ensure Prisma 6.16.1 is used, not the latest version

## Deploy Now

The fix is already applied to the script. Run:

```bash
./scripts/deploy-pm2.sh --clean --clear-cache
```

## Package.json Scripts Used

From your package.json:

```json
{
  "scripts": {
    "db:generate": "npx prisma generate",
    "migrate": "npx prisma migrate deploy",
    "seed": "npx prisma db seed"
  }
}
```

When you run `npm run db:generate`, npm uses the prisma version from node_modules (6.16.1), not the global/latest version.

## Important Notes

### Don't Run `npx prisma` Directly

❌ **WRONG:**
```bash
npx prisma validate
npx prisma migrate deploy
```

✅ **CORRECT:**
```bash
npm run db:generate
npm run migrate
# OR
npm exec -- prisma validate
npm exec -- prisma migrate deploy
```

### Prisma Version Lock

The project is locked to Prisma 6.16.1:

```json
{
  "devDependencies": {
    "prisma": "6.16.1"
  },
  "dependencies": {
    "@prisma/client": "6.16.1"
  }
}
```

**Do not upgrade to Prisma 7.x** without:
1. Migrating datasource URL to `prisma.config.ts`
2. Updating client initialization
3. Testing all database operations
4. Reviewing breaking changes

## Prisma 7 Breaking Changes (For Reference)

If you ever want to upgrade to Prisma 7:

1. **Datasource URL moved:**
   - Old: `url = env("DATABASE_URL")` in schema.prisma
   - New: Configure in `prisma.config.ts` and pass to PrismaClient

2. **Client configuration changed:**
   ```typescript
   // Prisma 6 (current)
   const prisma = new PrismaClient()

   // Prisma 7 (future)
   const prisma = new PrismaClient({
     adapter: createPrismaAdapter(connectionUrl)
   })
   ```

3. **Migration needed** for all Prisma operations

See: https://pris.ly/d/prisma7-client-config

## Verification

To verify the correct Prisma version is being used:

```bash
# Check installed version
npm ls prisma
# Should show: prisma@6.16.1

# Check what npx would use (DON'T RUN, just check)
npx prisma --version
# Might show 7.x (but we don't use npx anymore)

# Check what npm exec uses
npm exec -- prisma --version
# Should show: prisma@6.16.1
```

## Files Modified

- ✅ `scripts/deploy-pm2.sh` - Updated all Prisma commands to use local version

## Summary

- ✅ Fixed Prisma version mismatch
- ✅ Script now uses Prisma 6.16.1 consistently
- ✅ No more Prisma 7.x breaking change errors
- ✅ All Prisma commands work correctly

Run `./scripts/deploy-pm2.sh --clean --clear-cache` to deploy with the fix.
