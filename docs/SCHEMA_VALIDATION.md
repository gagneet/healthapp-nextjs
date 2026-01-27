# Prisma Schema Validation & Migration Guide

## Overview

The production deployment script now includes **comprehensive Prisma schema validation** to ensure your database schema is always in sync with your application code.

## Features

### 1. **Automatic Schema Validation** ✅

Every deployment automatically:
- ✅ Validates `prisma/schema.prisma` syntax
- ✅ Checks schema formatting compliance
- ✅ Detects schema drift (changes not reflected in migrations)
- ✅ Compares schema against current database state
- ✅ Shows detailed SQL diff of changes

### 2. **Schema Drift Detection** 🔍

The script detects three states:

| State | Description | Action |
|-------|-------------|--------|
| ✅ **In Sync** | Schema matches database perfectly | Deployment proceeds |
| ⚠️ **Pending Migrations** | Migration files exist but not applied | Applies migrations automatically |
| ❌ **Schema Drift** | Schema changed but no migration exists | **STOPS deployment** (unless `--create-migration`) |

### 3. **Automatic Migration Creation** 🚀

Create migrations directly during deployment:

```bash
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "add_patient_insurance_fields"
```

## Usage Examples

### Standard Deployment (Recommended)

```bash
# Deploy with automatic schema validation
./scripts/deploy-production.sh

# ✅ If no schema changes: deployment proceeds
# ❌ If schema drift detected: deployment stops with error
```

### Create Migration During Deployment

```bash
# If you've modified prisma/schema.prisma
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "add_user_profile_fields"

# This will:
# 1. Detect schema changes
# 2. Generate migration SQL file
# 3. Apply migration to database
# 4. Show generated SQL for review
# 5. Remind you to commit migration files
```

### Skip Schema Validation (Not Recommended)

```bash
# Only use if you absolutely know what you're doing
./scripts/deploy-production.sh --no-schema-check
```

## Workflow Recommendations

### Best Practice: Development → Production

#### 1. Local Development

```bash
# Modify prisma/schema.prisma
vim prisma/schema.prisma

# Create migration locally
npx prisma migrate dev --name "add_appointment_notes"

# Test migration
npm run dev

# Commit migration files
git add prisma/migrations prisma/schema.prisma
git commit -m "feat: Add appointment notes field"
git push
```

#### 2. Production Deployment

```bash
# Deploy - migrations will be applied automatically
./scripts/deploy-production.sh

# The script will:
# ✅ Detect new migration files
# ✅ Apply migrations to production database
# ✅ Verify database connection
```

### Alternative: Direct Production Migration (Use with Caution)

```bash
# If you need to create migration in production
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "emergency_fix_patient_table"

# ⚠️ Warning: This creates migration directly in production
# ⚠️ Remember to pull changes back to development!
```

## Error Scenarios & Solutions

### Scenario 1: Schema Drift Detected

**Error:**
```
⚠️  SCHEMA DRIFT DETECTED!
Your schema.prisma has changes not reflected in migrations

Schema changes detected:
ALTER TABLE "Patient" ADD COLUMN "insurance_provider" TEXT;

Options:
  1. Run with --create-migration --migration-name "description"
  2. Create migration manually: npx prisma migrate dev --name <name>
  3. Use --no-schema-check to skip (NOT RECOMMENDED)
```

**Solutions:**

**Option A: Create Migration Locally (Recommended)**
```bash
# On your development machine
npx prisma migrate dev --name "add_insurance_fields"
git add prisma/migrations
git commit -m "Add insurance provider fields"
git push

# Then deploy
./scripts/deploy-production.sh
```

**Option B: Create Migration During Deployment**
```bash
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "add_insurance_fields"
```

**Option C: Skip Validation (Not Recommended)**
```bash
# Only if you know schema is actually in sync
./scripts/deploy-production.sh --no-schema-check
```

### Scenario 2: Schema Formatting Issues

**Warning:**
```
⚠️  Schema formatting issues detected
Run 'npx prisma format' to auto-format

Continue despite formatting issues? (y/N):
```

**Solution:**
```bash
# Format schema locally
npx prisma format

# Commit changes
git add prisma/schema.prisma
git commit -m "Format Prisma schema"

# Deploy
./scripts/deploy-production.sh
```

### Scenario 3: Pending Migrations

**Info:**
```
⚠️  Database has pending migrations to apply
Migrations will be applied during deployment
```

**Action:** No action needed - migrations will be applied automatically ✅

## Migration Lifecycle

### What Happens During Deployment?

1. **Validation Phase** (before Docker build)
   ```
   ✅ Validating Prisma schema syntax...
   ✅ Checking schema format...
   ✅ Checking for unapplied schema changes...
   ```

2. **If Schema Drift Detected**
   ```
   ⚠️  SCHEMA DRIFT DETECTED!
   [Shows SQL diff]

   Options provided:
   - Create migration
   - Manual migration
   - Skip check
   ```

3. **Migration Creation** (if `--create-migration`)
   ```
   Creating migration: add_new_fields
   ✅ Migration created successfully
   ✅ Migration applied to database

   Migration file: prisma/migrations/20260127_add_new_fields/migration.sql

   ⚠️  Remember to commit migration files!
   ```

4. **Deployment Phase** (after Docker build)
   ```
   Running database migrations...
   ✅ Migrations completed successfully
   ✅ Database validation successful
   ```

## Command Reference

### Schema Validation Commands

```bash
# Check schema syntax
npx prisma validate

# Format schema
npx prisma format

# Check migration status
npx prisma migrate status

# Show schema diff
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script
```

### Deployment Commands

```bash
# Standard deployment with validation
./scripts/deploy-production.sh

# Create migration during deployment
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "migration_description"

# Skip schema validation (not recommended)
./scripts/deploy-production.sh --no-schema-check

# Debug mode (verbose output)
./scripts/deploy-production.sh --debug

# Automated deployment (CI/CD)
./scripts/deploy-production.sh --auto-yes
```

## Troubleshooting

### "Could not determine migration status"

**Cause:** Prisma can't connect to database or migrations table missing

**Solution:**
```bash
# Check database connectivity
npx prisma db pull

# Reset migrations (DANGER: data loss)
npx prisma migrate reset --force
```

### "Migration failed to apply"

**Cause:** SQL errors in migration or database constraints violated

**Solution:**
```bash
# Check migration SQL
cat prisma/migrations/LATEST_MIGRATION/migration.sql

# Check database logs
docker service logs healthapp-prod_postgres

# Rollback and fix
npx prisma migrate resolve --rolled-back "migration_name"
```

### "Schema drift but no changes visible"

**Cause:** Schema is in sync but Prisma migration metadata is outdated

**Solution:**
```bash
# Sync Prisma migrations table
npx prisma migrate resolve --applied "last_migration_name"

# Re-run deployment
./scripts/deploy-production.sh
```

## Best Practices

✅ **DO:**
- Create migrations in development environment
- Test migrations locally before production
- Commit migration files to version control
- Review generated SQL before applying
- Use descriptive migration names
- Keep schema formatting consistent

❌ **DON'T:**
- Skip schema validation in production
- Create migrations directly in production (unless emergency)
- Modify migration files after creation
- Delete migration files
- Mix `prisma db push` with migrations
- Manually edit database schema

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Check for schema changes
        run: |
          npm ci
          npx prisma generate
          npx prisma migrate status || echo "Schema check completed"

      - name: Deploy to Production
        env:
          ENV_FILE: ${{ secrets.PRODUCTION_ENV }}
        run: |
          echo "$ENV_FILE" > .env
          ./scripts/deploy-production.sh --auto-yes

      # Fail if schema drift detected without migration
      - name: Verify Deployment
        run: |
          # Add verification steps
```

## Summary

The enhanced deployment script provides:

✅ **Safety** - Prevents deploying with schema inconsistencies
✅ **Automation** - Automatically creates and applies migrations
✅ **Visibility** - Shows exactly what will change in database
✅ **Flexibility** - Multiple options for handling schema changes
✅ **Documentation** - Reminds you to commit migration files

**Default behavior:** Safe - stops deployment if schema drift detected

**Override:** Use `--create-migration` to create migrations automatically

---

**Last Updated:** 2026-01-27
**Script Version:** deploy-production.sh v2.0
