# 🚀 HealthApp Deployment Guide v2.0

## Overview

You now have **TWO deployment methods** to choose from:

1. **PM2 on Host** (Simple, Direct) - Recommended for single-server deployments
2. **Docker Swarm** (Containerized, Scalable) - Recommended for production clusters

## Quick Start

### Simple PM2 Deployment (Recommended)

```bash
# Standard PM2 deployment
./scripts/deploy-pm2.sh

# Quick restart (skip install/build)
./scripts/deploy-pm2.sh --skip-install --skip-build
```

### Unified Deployment (Choose Docker or PM2)

```bash
# Deploy with PM2
./scripts/deploy-unified.sh pm2

# Deploy with Docker Swarm
./scripts/deploy-unified.sh docker
```

---

## Deployment Method Comparison

| Feature | PM2 | Docker Swarm |
|---------|-----|--------------|
| **Complexity** | Simple ✅ | Complex |
| **Setup Time** | Fast ✅ | Slower |
| **Isolation** | No | Yes ✅ |
| **Scalability** | Single server | Multi-server ✅ |
| **Resource Usage** | Low ✅ | Higher |
| **Debugging** | Easy ✅ | Moderate |
| **Rollback** | Manual | Easy ✅ |
| **Load Balancing** | PM2 Cluster | Built-in ✅ |

---

## Method 1: PM2 Deployment (Simple)

### What You Already Have

You're currently running with PM2:
```bash
pm2 list
# Shows: healthapp-nextjs running
```

### PM2 Deployment Script

**Script:** `./scripts/deploy-pm2.sh`

#### Features
- ✅ Automatic schema validation
- ✅ Migration creation and application
- ✅ Build and restart automation
- ✅ Fast deployment (skippable steps)
- ✅ Simple process management

#### Basic Usage

```bash
# Full deployment with all steps
./scripts/deploy-pm2.sh

# Quick restart (development)
./scripts/deploy-pm2.sh --skip-install --skip-build

# With schema migration
./scripts/deploy-pm2.sh \
  --create-migration \
  --migration-name "add_new_fields"

# With database seeding
./scripts/deploy-pm2.sh --seed

# Automated (no prompts)
./scripts/deploy-pm2.sh --auto-yes
```

#### Options

| Option | Description |
|--------|-------------|
| `--skip-install` | Skip npm install (faster) |
| `--skip-build` | Skip Next.js build (faster) |
| `--no-migrate` | Skip database migrations |
| `--seed` | Run database seeders |
| `--no-schema-check` | Skip schema validation |
| `--create-migration` | Create migration if drift detected |
| `--migration-name NAME` | Name for new migration |
| `--auto-yes` | Skip all prompts |
| `--debug` | Enable debug output |

#### What It Does

1. ✅ Checks prerequisites (Node.js, npm, PM2, .env)
2. ✅ Validates Prisma schema syntax
3. ✅ Detects schema drift
4. ✅ Creates migrations (if requested)
5. ✅ Installs dependencies
6. ✅ Generates Prisma client
7. ✅ Builds Next.js application
8. ✅ Applies database migrations
9. ✅ Seeds database (if requested)
10. ✅ Restarts/starts PM2 process

#### PM2 Management Commands

```bash
# View logs
pm2 logs healthapp-nextjs

# Monitor in real-time
pm2 monit

# Restart app
pm2 restart healthapp-nextjs

# Stop app
pm2 stop healthapp-nextjs

# View detailed status
pm2 describe healthapp-nextjs

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## Method 2: Docker Swarm Deployment (Advanced)

### Docker Deployment Issues Fixed

**Problem:** Docker build was failing due to:
1. Large `node_modules` being copied (1.5GB)
2. Build cache issues
3. Incorrect Dockerfile configuration

**Solution:**
- ✅ Updated `.dockerignore` to exclude `node_modules/` and `.next/`
- ✅ Created optimized `Dockerfile.production.fixed`
- ✅ Multi-stage build for minimal image size
- ✅ Proper dependency management

### Docker Scripts

**Production:** `./scripts/deploy-production.sh` (Docker only)
**Unified:** `./scripts/deploy-unified.sh docker` (Docker or PM2)

#### Basic Usage

```bash
# Standard Docker deployment
./scripts/deploy-unified.sh docker

# With custom replicas
./scripts/deploy-unified.sh docker --replicas 4

# With volume cleanup (DANGEROUS)
./scripts/deploy-unified.sh docker --cleanup-volumes

# Fast deployment (no clean build)
./scripts/deploy-unified.sh docker --no-clean
```

#### What It Does

1. ✅ Validates Docker and Docker Swarm
2. ✅ Validates Prisma schema
3. ✅ Removes old Docker stack
4. ✅ Cleans build artifacts
5. ✅ Installs dependencies
6. ✅ Builds optimized Docker image
7. ✅ Deploys to Docker Swarm
8. ✅ Waits for services to start
9. ✅ Runs migrations in containers
10. ✅ Displays service status

---

## Method 3: Unified Deployment

**Script:** `./scripts/deploy-unified.sh [docker|pm2]`

### Choose Your Method at Runtime

```bash
# PM2 deployment
./scripts/deploy-unified.sh pm2 [PM2_OPTIONS]

# Docker deployment
./scripts/deploy-unified.sh docker [DOCKER_OPTIONS]
```

### Shared Options (Both Methods)

```bash
--no-migrate          # Skip database migrations
--seed                # Run database seeders
--no-schema-check     # Skip Prisma schema validation
--create-migration    # Create migration if drift detected
--migration-name NAME # Migration name
--auto-yes            # Skip confirmations
--debug               # Debug output
```

### Docker-Specific Options

```bash
--no-clean            # Skip clean build
--cleanup-volumes     # Delete data volumes (DANGER)
--skip-tests          # Skip validation tests
--replicas N          # Number of replicas (default: 2)
```

### PM2-Specific Options

```bash
--skip-install        # Skip npm install
--skip-build          # Skip build step
```

---

## Schema Validation & Migrations

### Automatic Schema Validation

All scripts automatically check for schema changes:

✅ **Schema in sync** → Deployment proceeds
⚠️ **Pending migrations** → Applied automatically
❌ **Schema drift** → Deployment stops (unless `--create-migration`)

### Creating Migrations During Deployment

```bash
# PM2
./scripts/deploy-pm2.sh \
  --create-migration \
  --migration-name "add_insurance_fields"

# Docker
./scripts/deploy-unified.sh docker \
  --create-migration \
  --migration-name "add_insurance_fields"
```

### What Happens on Schema Drift

```
⚠️  SCHEMA DRIFT DETECTED!
Your schema.prisma has changes not reflected in migrations

Options:
  1. Use --create-migration --migration-name "description"
  2. Create manually: npx prisma migrate dev --name <name>
  3. Use --no-schema-check to skip (NOT RECOMMENDED)
```

---

## Common Workflows

### Development → Production (Recommended)

```bash
# 1. Development: Create migration locally
vim prisma/schema.prisma
npx prisma migrate dev --name "add_fields"
git add prisma/migrations
git commit -m "Add migration: add_fields"
git push

# 2. Production: Pull and deploy
git pull
./scripts/deploy-pm2.sh
```

### Quick Update (No Dependencies Changed)

```bash
# PM2 - fast deployment
./scripts/deploy-pm2.sh --skip-install --skip-build --no-migrate
```

### Emergency Schema Fix

```bash
# Create migration during deployment
./scripts/deploy-pm2.sh \
  --create-migration \
  --migration-name "emergency_fix"
```

### First-Time Deployment

```bash
# PM2 with seeding
./scripts/deploy-pm2.sh --seed

# Docker with seeding
./scripts/deploy-unified.sh docker --seed
```

---

## Troubleshooting

### PM2 Issues

**Problem:** App not restarting
```bash
# Solution: Check PM2 status
pm2 list
pm2 logs healthapp-nextjs --lines 50

# Force restart
pm2 delete healthapp-nextjs
pm2 start ecosystem.config.cjs
```

**Problem:** Port already in use
```bash
# Solution: Find and kill process
lsof -ti:3002 | xargs kill -9
pm2 restart healthapp-nextjs
```

### Docker Issues

**Problem:** Build fails with "no space left"
```bash
# Solution: Clean Docker cache
docker system prune -a
docker buildx prune -f
```

**Problem:** Image build fails
```bash
# Solution: Use fixed Dockerfile
./scripts/deploy-unified.sh docker --no-clean
# Or manually:
docker build -f docker/Dockerfile.production.fixed -t healthapp:prod .
```

**Problem:** Container can't connect to database
```bash
# Solution: Check database service
docker service logs healthapp-prod_postgres

# Restart database service
docker service update --force healthapp-prod_postgres
```

### Schema Issues

**Problem:** "Schema drift detected"
```bash
# Solution A: Create migration
./scripts/deploy-pm2.sh \
  --create-migration \
  --migration-name "fix_drift"

# Solution B: Skip check (not recommended)
./scripts/deploy-pm2.sh --no-schema-check
```

**Problem:** "Migration failed"
```bash
# Solution: Check migration status
npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --rolled-back "migration_name"

# Retry deployment
./scripts/deploy-pm2.sh
```

---

## Migration Guide

### From Old Deployment to New Scripts

#### Currently Using PM2

```bash
# You're already good! Just use the new script:
./scripts/deploy-pm2.sh

# Or for quick restarts:
./scripts/deploy-pm2.sh --skip-install --skip-build
```

#### Want to Switch to Docker

```bash
# 1. Stop PM2
pm2 stop healthapp-nextjs

# 2. Initialize Docker Swarm
docker swarm init

# 3. Deploy with Docker
./scripts/deploy-unified.sh docker

# 4. (Optional) Remove PM2
pm2 delete healthapp-nextjs
```

#### Want Both (Development + Production)

```bash
# Development: Use PM2
./scripts/deploy-pm2.sh --skip-install --skip-build

# Production: Use Docker
./scripts/deploy-unified.sh docker --replicas 4
```

---

## Recommendations

### For Your Setup

Based on your current PM2 deployment, I recommend:

✅ **Primary:** Use `deploy-pm2.sh` for simplicity
✅ **Backup:** Keep `deploy-unified.sh` for flexibility
✅ **Future:** Consider Docker when scaling to multiple servers

### Deployment Strategy

```bash
# Daily development updates
./scripts/deploy-pm2.sh --skip-install --skip-build

# Weekly full deployments
./scripts/deploy-pm2.sh

# Monthly major updates
./scripts/deploy-pm2.sh --seed
```

---

## File Reference

### Created Files

- `scripts/deploy-pm2.sh` - Simple PM2 deployment ⭐ **Recommended**
- `scripts/deploy-unified.sh` - Docker or PM2 choice
- `scripts/deploy-production.sh` - Docker only (from v1.0)
- `docker/Dockerfile.production.fixed` - Optimized Dockerfile
- `docker/Dockerfile.production.pm2` - PM2 inside Docker
- `.dockerignore` - Updated to exclude node_modules

### Configuration Files

- `ecosystem.config.cjs` - PM2 configuration (host)
- `docker/ecosystem.docker.config.js` - PM2 for Docker
- `docker/docker-stack.yml` - Docker Swarm config
- `.env` - Environment variables

---

## Summary

You now have **three deployment scripts**:

1. **`deploy-pm2.sh`** - Simple PM2 deployment ⭐ **Recommended for you**
2. **`deploy-unified.sh`** - Choose Docker or PM2 at runtime
3. **`deploy-production.sh`** - Docker Swarm only (advanced)

All scripts include:
- ✅ Automatic schema validation
- ✅ Migration creation and application
- ✅ Database seeding support
- ✅ Error handling and rollback
- ✅ Detailed logging

**Start with:** `./scripts/deploy-pm2.sh`

---

**Version:** 2.0
**Last Updated:** 2026-01-27
**Status:** ✅ Production Ready
