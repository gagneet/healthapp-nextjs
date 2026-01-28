# Prisma 7 Migration Guide (Future Reference)

**Status:** 📋 Planning Document - DO NOT EXECUTE YET
**Current Version:** Prisma 6.16.1
**Target Version:** Prisma 7.x
**Last Updated:** 2026-01-28

---

## ⚠️ IMPORTANT: Read Before Starting

This guide is for **future reference only**. Your project currently runs on Prisma 6.16.1, which is stable and working perfectly. Only proceed with this migration when:

1. ✅ You have 2-3 days for migration + testing
2. ✅ You have a full backup of production database
3. ✅ You can afford downtime or have a rollback plan
4. ✅ You've tested in a development environment first
5. ✅ All team members are aware of the changes

---

## Executive Summary

### Major Breaking Changes in Prisma 7

1. **Datasource URL Configuration** - Moves from `schema.prisma` to new `prisma.config.ts` file
2. **Driver Adapters Required** - Must explicitly provide database adapter to PrismaClient
3. **ES Module Architecture** - Prisma now ships as ES module only
4. **Automatic Client Generation Removed** - Must run `prisma generate` manually
5. **Automatic Seeding Removed** - Must run `prisma db seed` manually
6. **CLI Flags Changed** - `--skip-generate` and `--skip-seed` removed
7. **Dual Configuration** - Database URL needed in both config file AND runtime adapter

### Estimated Migration Time

- **Schema Changes:** 30 minutes
- **Code Updates:** 2-3 hours (depending on codebase size)
- **Testing:** 1-2 days (all 46+ models must be tested)
- **Total:** 2-3 days including testing and verification

### Risk Assessment

**High Risk Areas:**
- 🔴 Auth.js PrismaAdapter compatibility (session management)
- 🔴 Database connections in production (connection pooling)
- 🟡 Deployment scripts (prisma commands changed)
- 🟡 CI/CD pipelines (build steps changed)

**Low Risk Areas:**
- 🟢 Model definitions (no changes needed)
- 🟢 Queries (mostly backward compatible)
- 🟢 Relations (unchanged)

---

## Phase 1: Pre-Migration Preparation

### 1.1 Backup Everything

```bash
# Backup production database
pg_dump -h localhost -U healthapp_user -d healthapp_prod > backup_prisma6_$(date +%Y%m%d).sql

# Backup current codebase
git checkout -b feature/prisma-7-migration
git push -u origin feature/prisma-7-migration

# Document current state
npm ls prisma @prisma/client > prisma6_versions.txt
```

### 1.2 Create Test Environment

```bash
# Clone production to test database
createdb healthapp_test_prisma7
pg_restore -d healthapp_test_prisma7 backup_prisma6_*.sql

# Update .env.test
DATABASE_URL="postgresql://healthapp_user:password@localhost:5432/healthapp_test_prisma7"
```

### 1.3 Read Official Documentation

**Required Reading:**
1. [Official Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
2. [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
3. [Driver Adapters Guide](https://www.prisma.io/docs/orm/overview/databases/database-drivers)

### 1.4 Check Auth.js Compatibility

```bash
# Check if @auth/prisma-adapter supports Prisma 7
npm info @auth/prisma-adapter

# May need to upgrade Auth.js as well
# Check compatibility matrix at: https://authjs.dev
```

---

## Phase 2: Schema and Configuration Changes

### 2.1 Create `prisma.config.ts`

**New File:** `prisma/prisma.config.ts`

```typescript
/**
 * Prisma 7 Configuration File
 *
 * This file is used by Prisma CLI for migrations and database operations.
 * Runtime database connection is configured separately in PrismaClient.
 */

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema file location
  schema: 'prisma/schema.prisma',

  // Migrations directory
  migrations: {
    path: 'prisma/migrations',
  },

  // Datasource configuration for CLI operations
  datasource: {
    url: env('DATABASE_URL'),
  },

  // Generator configuration (optional override)
  // generator: {
  //   output: './generated/prisma'
  // },
})
```

### 2.2 Update `prisma/schema.prisma`

**Current (Prisma 6):**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ Remove this line
}
```

**Updated (Prisma 7):**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url is now configured in prisma.config.ts
}
```

**⚠️ IMPORTANT:** Only remove the `url` line. All model definitions stay exactly the same.

### 2.3 Verify Schema Syntax

```bash
# Generate Prisma client to verify schema is valid
npm run db:generate

# Expected output: "✔ Generated Prisma Client..."
```

---

## Phase 3: Update PrismaClient Initialization

### 3.1 Install Required Packages

```bash
# Remove old Prisma packages
npm uninstall prisma @prisma/client

# Install Prisma 7 packages
npm install -D prisma@^7.0.0
npm install @prisma/client@^7.0.0

# Install PostgreSQL adapter (required for runtime)
npm install @prisma/adapter-postgres

# May also need (depending on your deployment):
# npm install pg  # If not already installed
```

### 3.2 Update `lib/prisma.ts`

**Current Code (Prisma 6):**
```typescript
// lib/prisma.ts - Lines 11-36
import { PrismaClient } from '@/prisma/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,  // ❌ No longer allowed
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Updated Code (Prisma 7):**
```typescript
/**
 * Prisma 7 Database Connection for Next.js Healthcare Application
 *
 * BREAKING CHANGE: Prisma 7 requires explicit driver adapters
 * - CLI operations use prisma.config.ts for DATABASE_URL
 * - Runtime operations use adapter with DATABASE_URL
 */

import { PrismaClient } from '@/prisma/generated/prisma';
import { PrismaPostgres } from '@prisma/adapter-postgres';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPostgres(pool);

// Global variable to store the Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Create Prisma Client with PostgreSQL adapter (Prisma 7 requirement)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter, // ✅ Required in Prisma 7
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    // datasources option removed in Prisma 7
  });

// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

/**
 * Graceful shutdown handler for production environments
 * Now also closes the connection pool
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
  await pool.end(); // Close connection pool
}

// ... rest of the file stays the same
```

### 3.3 Update Type Imports (if needed)

Check if any files import Prisma types directly:

```bash
# Find all Prisma type imports
grep -r "import.*@prisma/client" --include="*.ts" --include="*.tsx"
```

Update if necessary:
```typescript
// May still work, but verify:
import { Prisma, User, Patient } from '@prisma/client'
```

---

## Phase 4: Update Deployment Scripts

### 4.1 Update `package.json` Scripts

**Current:**
```json
{
  "scripts": {
    "db:generate": "npx prisma generate",
    "migrate": "npx prisma migrate deploy",
    "migrate:dev": "npx prisma migrate dev",
    "seed": "npx prisma db seed",
    "db:push": "npx prisma db push"
  }
}
```

**Updated for Prisma 7:**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "migrate": "prisma migrate deploy && prisma generate",
    "migrate:dev": "prisma migrate dev && prisma generate",
    "seed": "prisma db seed",
    "db:push": "prisma db push && prisma generate",
    "db:reset": "prisma migrate reset && prisma generate && prisma db seed"
  }
}
```

**⚠️ KEY CHANGE:** Must run `prisma generate` after migrations because auto-generation was removed.

### 4.2 Update `scripts/deploy-pm2.sh`

The script already uses `npm run` commands, so it should work. But verify:

```bash
# Lines that need verification:
# - npm run db:generate  ✅ (already correct)
# - npm run migrate      ✅ (already correct)
# - npm run seed         ✅ (already correct)
```

No changes needed to deploy-pm2.sh if using npm scripts correctly.

### 4.3 Update Docker/CI/CD

If you have Docker or CI/CD pipelines, update them:

```dockerfile
# Dockerfile or CI/CD script
RUN npm run db:generate    # Explicit generate
RUN npm run migrate        # Will run generate automatically (per package.json)
```

---

## Phase 5: Update Auth.js Configuration

### 5.1 Verify PrismaAdapter Compatibility

```bash
# Check Auth.js adapter version
npm ls @auth/prisma-adapter

# May need to upgrade
npm install @auth/prisma-adapter@latest
```

### 5.2 Update Auth Configuration (if needed)

**File:** `lib/auth.ts` or `auth.ts`

```typescript
// Verify this still works with Prisma 7
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma), // Should still work
  // ... rest of config
}
```

**Test extensively:** Sessions, login, logout, registration

---

## Phase 6: Testing Checklist

### 6.1 Database Operations Testing

```bash
# Generate Prisma client
npm run db:generate
# ✅ Should complete without errors

# Test migrations
npm run migrate:dev
# ✅ Should apply migrations and generate client

# Test seeding
npm run seed
# ✅ Should seed database successfully

# Test rollback (in test environment only!)
npx prisma migrate reset --force
# ✅ Should reset and reseed
```

### 6.2 Application Testing

**Critical User Flows:**

1. **Authentication** (HIGH PRIORITY)
   - [ ] User registration
   - [ ] User login (email/password)
   - [ ] Session persistence
   - [ ] Logout
   - [ ] Password reset
   - [ ] OAuth login (if configured)

2. **Doctor Dashboard**
   - [ ] View patient list
   - [ ] Create care plan
   - [ ] Prescribe medication
   - [ ] View vital alerts
   - [ ] Schedule appointment

3. **Patient Dashboard**
   - [ ] View medications
   - [ ] Record vital signs
   - [ ] View appointments
   - [ ] Message doctor

4. **Hospital Staff Dashboard**
   - [ ] View patients
   - [ ] Update records
   - [ ] Schedule appointments

5. **Database Operations**
   - [ ] Create records
   - [ ] Update records
   - [ ] Delete records
   - [ ] Complex queries with relations
   - [ ] Transactions
   - [ ] Aggregations

### 6.3 Performance Testing

```typescript
// Test connection pooling
import { prisma } from '@/lib/prisma'

async function testConnectionPool() {
  const start = Date.now()

  // Run 50 concurrent queries
  const queries = Array.from({ length: 50 }, (_, i) =>
    prisma.user.count()
  )

  await Promise.all(queries)

  const duration = Date.now() - start
  console.log(`50 concurrent queries: ${duration}ms`)
  // Should be similar to or better than Prisma 6 performance
}
```

### 6.4 Load Testing

```bash
# Use a load testing tool
npm install -g artillery

# Create test script
artillery quick --count 100 --num 10 http://localhost:3002/api/health

# Monitor database connections
watch -n 1 'psql -U healthapp_user -d healthapp_prod -c "SELECT count(*) FROM pg_stat_activity;"'
```

---

## Phase 7: Known Issues and Workarounds

### 7.1 Enum Mapping Issue

**Problem:** `@map` directives on enum values may cause issues.

**Your Schema:** Check for enums with @map:
```bash
grep -A10 "enum" prisma/schema.prisma | grep "@map"
```

**Workaround:** If issues occur, temporarily remove @map from enums or consult Prisma 7 release notes.

### 7.2 MongoDB Not Supported

**Your Project:** Using PostgreSQL ✅ (no issue)

### 7.3 Connection Pool Size

**Adjust if needed:**
```typescript
// lib/prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase if needed (was auto-managed in Prisma 6)
  idleTimeoutMillis: 30000,
})
```

### 7.4 TypeScript Build Errors

**If you see module resolution errors:**
```json
// tsconfig.json - may need updates
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

---

## Phase 8: Rollback Plan

### 8.1 If Migration Fails

```bash
# Step 1: Restore database backup
dropdb healthapp_prod
createdb healthapp_prod
pg_restore -d healthapp_prod backup_prisma6_*.sql

# Step 2: Revert code changes
git checkout master
rm -rf node_modules package-lock.json
npm install

# Step 3: Verify Prisma 6 is back
npm ls prisma
# Should show: prisma@6.16.1

# Step 4: Regenerate client
npm run db:generate

# Step 5: Restart application
pm2 restart healthapp-nextjs
```

### 8.2 If Partial Migration

**If you've updated code but not deployed:**
```bash
# Discard all changes
git reset --hard HEAD
git clean -fd

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Phase 9: Post-Migration Verification

### 9.1 Production Deployment Checklist

- [ ] All tests passing in staging
- [ ] Performance metrics acceptable
- [ ] Auth.js sessions working
- [ ] Database connections stable
- [ ] No memory leaks detected
- [ ] Error monitoring configured
- [ ] Team trained on changes
- [ ] Documentation updated

### 9.2 Monitoring (First 48 Hours)

```bash
# Monitor PM2
pm2 monit

# Monitor database connections
watch -n 5 'psql -U healthapp_user -d healthapp_prod -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"'

# Monitor logs
pm2 logs healthapp-nextjs --lines 100

# Monitor application health
watch -n 10 'curl -s http://localhost:3002/api/health | jq'
```

### 9.3 Performance Comparison

Compare with Prisma 6 baseline:

| Metric | Prisma 6 | Prisma 7 | Acceptable? |
|--------|----------|----------|-------------|
| Query response time | TBD | TBD | ±10% |
| Connection pool usage | TBD | TBD | ±20% |
| Memory usage | TBD | TBD | ±15% |
| Error rate | TBD | TBD | Same or lower |

---

## Phase 10: File Change Summary

### Files to Create

- [ ] `prisma/prisma.config.ts` (NEW FILE)

### Files to Modify

- [ ] `prisma/schema.prisma` (remove url line)
- [ ] `lib/prisma.ts` (major changes - adapter required)
- [ ] `package.json` (update Prisma versions + scripts)
- [ ] `package-lock.json` (will auto-update)

### Files to Review (May Need Changes)

- [ ] `lib/auth.ts` (verify PrismaAdapter works)
- [ ] `types/auth.ts` (verify types still work)
- [ ] All files using Prisma types (verify imports)
- [ ] CI/CD configuration files
- [ ] Docker configuration (if applicable)

### Files That Don't Change

- ✅ All model definitions in `schema.prisma`
- ✅ All query code (mostly backward compatible)
- ✅ All components/pages using Prisma
- ✅ Deployment scripts (if using npm scripts)

---

## Decision Tree: Should You Migrate Now?

```
Start
  ↓
Do you NEED Prisma 7 features?
  ├─ Yes → Do you have 2-3 days for testing?
  │         ├─ Yes → Is production stable?
  │         │         ├─ Yes → ✅ Consider migrating
  │         │         └─ No → ⏸️ Wait until stable
  │         └─ No → ⏸️ Wait for better timing
  └─ No → Do you have urgent feature releases?
            ├─ Yes → ❌ Don't migrate (focus on features)
            └─ No → Is Prisma 6 reaching EOL?
                      ├─ Yes → ✅ Migrate soon
                      └─ No → ⏸️ No urgency to migrate
```

---

## Benefits of Staying on Prisma 6 (For Now)

1. ✅ **Stability** - Proven in production
2. ✅ **No Migration Risk** - Healthcare data is critical
3. ✅ **Team Productivity** - No learning curve
4. ✅ **Focus on Features** - Build value, not infrastructure
5. ✅ **Support** - Prisma 6.x still fully supported

---

## Benefits of Upgrading to Prisma 7 (Future)

1. 📈 **Better Performance** - Optimized query engine
2. 🔧 **Flexibility** - Custom database drivers
3. 🚀 **Edge Runtime** - Deploy to Cloudflare Workers
4. 🔮 **Future-Proof** - Latest features and improvements
5. 🐛 **Bug Fixes** - Latest fixes and improvements

---

## Recommended Timeline

### Option 1: Planned Migration Window
- **When:** Q2 2026 (or after next major release)
- **Duration:** 1 week (testing + deployment)
- **Risk:** Low (planned and tested)

### Option 2: Emergency Migration
- **When:** If Prisma 6 critical bug or security issue
- **Duration:** 2-3 days (rushed)
- **Risk:** Medium (less testing time)

### Option 3: No Migration Needed
- **When:** Prisma 6 continues to work well
- **Duration:** N/A
- **Risk:** None (stay on stable version)

---

## Support and Resources

### Official Documentation
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)

### Community Resources
- [Prisma Discord](https://pris.ly/discord)
- [Prisma GitHub Discussions](https://github.com/prisma/prisma/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/prisma)

### Auth.js Resources
- [Auth.js Documentation](https://authjs.dev)
- [PrismaAdapter Documentation](https://authjs.dev/reference/adapter/prisma)

---

## Final Recommendation

**For Your Healthcare Application:**

🟢 **STAY ON PRISMA 6.16.1 FOR NOW**

**Reasons:**
1. Healthcare data requires maximum stability
2. Current setup is proven and working
3. No critical features needed from Prisma 7
4. Focus on healthcare features, not infrastructure
5. Can migrate later during planned maintenance window

**Revisit This Decision:**
- Q2 2026 (6 months from now)
- When Prisma 6 nears end-of-life
- If specific Prisma 7 feature becomes critical
- During next major refactoring

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Next Review:** 2026-07-28
**Maintained By:** Development Team
