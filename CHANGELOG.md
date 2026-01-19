# Changelog

All notable changes to the Healthcare Management Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2026-01-19

#### Auth.js v5 Session Role Missing Issue
- **Problem**: Login was successful but role was not included in session, causing "no role found in session" error and preventing dashboard redirect
- **Root Cause**: Session callback in `lib/auth.ts` was mutating the session user object instead of creating a new object with all properties properly spread
- **Solution**: Updated session callback to use object spread operator to properly include all healthcare-specific fields (role, businessId, profileId, accountStatus, organizationId, profileData, and permission flags)
- **Files Changed**: `lib/auth.ts` (lines 318-337)
- **Impact**: Users can now successfully log in and are redirected to their role-based dashboards

#### Database Connectivity Issue
- **Problem**: Application could not connect to PostgreSQL database, showing "Can't reach database server at `postgres:5432`" error
- **Root Causes**:
  1. Docker Swarm PostgreSQL service failed with network error: "subnet sandbox join failed for 10.0.0.0/24: error creating vxlan interface: file exists"
  2. Next.js built with `output: 'standalone'` configuration but PM2 was using `next start` instead of standalone server
  3. Compiled Next.js code had hardcoded old DATABASE_URL from build time
- **Solutions Applied**:
  1. Updated DATABASE_URL in `.env` from `postgres:5432` to `localhost:5432` to use local PostgreSQL
  2. Updated POSTGRES_HOST from `postgres` to `localhost`
  3. Regenerated Prisma Client with new DATABASE_URL using `npx prisma generate`
  4. Rebuilt entire Next.js application with `npm run build` to incorporate new environment variables
  5. Created PM2 ecosystem configuration (`ecosystem.config.cjs`) to properly run standalone server
  6. Configured PM2 to load all 116 environment variables from `.env` file
  7. Copied static assets to standalone directory
  8. Deployed with 2 cluster instances for high availability
- **Files Changed**:
  - `.env` (DATABASE_URL, POSTGRES_HOST)
  - `lib/auth.ts` (session callback)
  - `ecosystem.config.cjs` (created new)
  - `.next/standalone/` (rebuilt with new config)
- **Impact**: Application now successfully connects to PostgreSQL and authentication works end-to-end

#### PM2 Deployment Configuration
- **Added**: New PM2 ecosystem configuration file (`ecosystem.config.cjs`)
- **Features**:
  - Uses Next.js standalone server (`.next/standalone/server.js`) as recommended for production
  - Loads all environment variables from `.env` file using dotenv
  - Runs 2 cluster instances for high availability and load balancing
  - Configured with proper memory limits (2GB), logging, auto-restart, and graceful shutdown
  - Eliminates "next start does not work with output: standalone" warning
- **Files Changed**: `ecosystem.config.cjs` (created new)

### Technical Details

#### Auth.js v5 Session Callback Fix
```typescript
// Before (incorrect - mutating object)
const extendedUser = session.user
extendedUser.role = token.role as UserRole
// ... other assignments

// After (correct - creating new object with spread)
session.user = {
    ...session.user,
    id: token.id as string,
    role: token.role as UserRole,
    businessId: (token.businessId as string | null) || null,
    // ... all other fields properly spread
}
```

#### PM2 Ecosystem Configuration
```javascript
module.exports = {
  apps: [{
    name: 'healthapp-nextjs',
    script: '.next/standalone/server.js',  // Standalone server, not 'next start'
    instances: 2,
    exec_mode: 'cluster',
    env: {
      ...envConfig.parsed,  // Load all 116 env vars from .env
    },
    // ... other production configurations
  }]
};
```

#### Environment Variable Changes
```bash
# Before
DATABASE_URL="postgresql://healthapp_user:secure_test_postgres@postgres:5432/healthapp_test?schema=public"
POSTGRES_HOST=postgres

# After
DATABASE_URL="postgresql://healthapp_user:secure_test_postgres@localhost:5432/healthapp_test?schema=public"
POSTGRES_HOST=localhost
```

### Deployment Commands

To apply these fixes:

```bash
# 1. Update environment variables
sed -i 's|@postgres:5432|@localhost:5432|g' .env
sed -i 's/^POSTGRES_HOST=postgres/POSTGRES_HOST=localhost/g' .env

# 2. Regenerate Prisma client
npx prisma generate

# 3. Rebuild Next.js application
npm run build

# 4. Copy static assets to standalone directory
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 5. Start with PM2 ecosystem config
pm2 delete healthapp-nextjs  # If already running
pm2 start ecosystem.config.cjs
pm2 save
```

### Verification

Application is now running successfully:
- ✅ Next.js server: `http://localhost:3002` and `http://0.0.0.0:3002`
- ✅ Instances: 2 (cluster mode for high availability)
- ✅ Database: Connected to localhost PostgreSQL
- ✅ Auth.js v5: Session includes role for proper dashboard redirects
- ✅ Ready time: 313ms (instance 1) and 258ms (instance 2)

### Breaking Changes

None - these are bug fixes that restore expected functionality.

### Migration Notes

- **Docker Swarm Users**: If you need to continue using Docker Swarm PostgreSQL service, you must resolve the network interface conflict first using `docker stack rm healthapp-test` followed by cleanup
- **PM2 Users**: Existing PM2 processes should be deleted and restarted using the new `ecosystem.config.cjs` configuration
- **Environment Variables**: Ensure `.env` file is present and readable by PM2 process

### Known Issues

- Docker Swarm PostgreSQL service has network conflict ("subnet sandbox join failed for 10.0.0.0/24") - currently bypassed by using localhost PostgreSQL
- Application assumes PostgreSQL is available on localhost:5432 with credentials from `.env`

---

## Version History

### [0.9.1] - Current
- Auth.js v5 session role fix
- Database connectivity restoration
- PM2 ecosystem configuration

### [0.8.2] - Previous
- See git history for previous changes
