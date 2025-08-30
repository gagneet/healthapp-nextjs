# Healthcare Application - Complete Docker Deployment Guide

This comprehensive guide covers deploying the Healthcare Management Platform using Docker Compose (local) and Docker Swarm (dev/test/production) with all deployment scripts and configurations.

## 🆕 Latest Updates (August 2025)

### ✅ **Enhanced Deployment Scripts (NEW)**
- **Environment-Specific Scripts**: Added convenient `deploy-local.sh`, `deploy-test.sh`, and `deploy-prod.sh` scripts
- **Production Safety**: Enhanced production deployment with safety checks and confirmations
- **Timeout Protection**: Added timeout handling to prevent hanging deployments
- **Comprehensive Logging**: Detailed logging with emojis for better troubleshooting
- **Seed File Migration**: Updated to use new `prisma/seed.ts` location with TypeScript support

### ✅ **Migration & Seeding Improvements**
- **Timeout Handling**: Migrations and seeding now have timeout protection (120s/180s respectively)
- **Fallback Strategies**: Multiple fallback methods for both migration and seeding failures
- **TypeScript Support**: Full support for TypeScript seed files with `tsx` execution
- **Multiple Seed Locations**: Automatic detection of seed files in various locations
- **Enhanced Error Recovery**: Improved fallback to `db push` when migrations fail

### ✅ **Auth.js v5 Migration Completed**
- **Modern Authentication**: Upgraded from Auth.js v4 to v5 with improved performance
- **Database Sessions**: Enhanced security with PrismaAdapter integration  
- **Field Compatibility**: Automatic field mapping between legacy and Auth.js v5 schemas
- **Migration Included**: All deployments now include Auth.js v5 compatibility migrations
- **Healthcare Roles**: Full integration with role-based healthcare access control

### ✅ **Migration Infrastructure Consolidated**
- **Unified Migrations**: Consolidated multiple migration folders into single Prisma structure
- **Idempotent Operations**: All migrations and seeders now support repeated execution
- **Comprehensive Test Data**: Restored complete seed data (2 doctors, 5 patients, 1 admin, 1 provider)
- **Backward Compatible**: Zero-disruption deployment with proper field mapping

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Environments](#deployment-environments)
4. [Quick Start](#quick-start)
5. [Environment-Specific Deployment](#environment-specific-deployment)
6. [Advanced Configuration](#advanced-configuration)
7. [Scaling and Performance](#scaling-and-performance)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Minimum (Local Development):**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Docker: 20.10+
- Docker Compose: 2.0+

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Docker Swarm: 3+ node cluster
- Load Balancer (Nginx/HAProxy)

### Software Dependencies

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
docker-compose --version
```

## 🏗️ Architecture Overview

### Technology Stack
- **Full-Stack**: Next.js 14 with TypeScript (unified frontend/backend)
- **Database**: PostgreSQL 17 with Prisma ORM
- **Authentication**: NextAuth.js with PrismaAdapter and database sessions  
- **Cache**: Redis for enhanced session management and caching
- **Orchestration**: Docker Compose (local) / Docker Swarm (dev/test/prod)
- **Deployment**: Universal deployment scripts for all environments

### Service Architecture

| Service | Local (Compose) | Dev/Test/Prod (Swarm) | Purpose |
|---------|-----------------|----------------------|---------|
| **Application** | next.js:dev | healthapp:production | Full-stack Next.js with API routes |
| **Database** | postgres:17-alpine | postgres:17-alpine | Data persistence + NextAuth sessions |
| **Cache** | redis:7-alpine | redis:7-alpine | Session storage & caching |
| **Admin** | pgadmin4 | pgadmin4 | Database administration |

## 🚀 Deployment Environments

### Local Development (Docker Compose)
- **Purpose**: Developer workstations with hot-reload
- **Technology**: Docker Compose
- **Ports**: App(3002), DB(5434), Redis(6379), PgAdmin(5050)
- **Features**: Hot-reload, development debugging, relaxed security

### Development Server (Docker Swarm)
- **Purpose**: Team development server with load balancing
- **Technology**: Docker Swarm
- **Ports**: App(3002), DB(5432), Redis(6379), PgAdmin(5050)
- **Features**: Multi-replica services, service discovery, NextAuth.js integration

### Test Environment (Docker Swarm)
- **Purpose**: Automated testing and QA validation
- **Technology**: Docker Swarm  
- **Ports**: App(3003), DB(5433), Redis(6380), PgAdmin(5051)
- **Features**: Test automation, CI/CD integration, isolated testing

### Production (Docker Swarm)
- **Purpose**: Live production deployment
- **Technology**: Docker Swarm
- **Ports**: App(3002), DB(5432), Redis(6379), PgAdmin(5050)
- **Features**: High availability, auto-scaling, NextAuth.js security, monitoring

## 🚀 Quick Start

### 1. Local Development

```bash
# Start local development environment (easiest method)
./scripts/deploy-local.sh --migrate --seed

# Alternative: using main deploy script
./scripts/deploy.sh dev deploy --domain localhost --migrate --seed

# View logs
./scripts/deploy-local.sh logs

# Stop when done
./scripts/deploy-local.sh stop
```

### 2. Test Environment

```bash
# Initialize Docker Swarm (one-time)
docker swarm init

# Deploy test environment (requires domain)
./scripts/deploy-test.sh deploy --domain test.healthapp.com --migrate --seed

# Update existing test deployment
./scripts/deploy-test.sh update --domain test.healthapp.com
```

### 3. Production Deployment

```bash
# Production deployment with safety checks
./scripts/deploy-prod.sh deploy --domain healthapp.com --migrate

# Update production (safest option)
./scripts/deploy-prod.sh update --domain healthapp.com

# Scale production services
./scripts/deploy-prod.sh scale --domain healthapp.com --replicas 3
```

## 🎯 Environment-Specific Deployment Scripts

We now provide three convenient environment-specific scripts that wrap the main `deploy.sh` script with appropriate defaults and safety measures:

### 🏠 Local Development (`deploy-local.sh`)

**Purpose**: Quick local development deployment with optimized settings

```bash
# Basic deployment
./scripts/deploy-local.sh --migrate --seed

# Available commands
./scripts/deploy-local.sh deploy    # Deploy complete stack (default)
./scripts/deploy-local.sh start     # Alias for deploy
./scripts/deploy-local.sh stop      # Stop local stack
./scripts/deploy-local.sh restart   # Stop and redeploy
./scripts/deploy-local.sh logs      # Show service logs
./scripts/deploy-local.sh status    # Show service status
./scripts/deploy-local.sh clean     # Clean and redeploy (removes compiled files)
./scripts/deploy-local.sh fresh     # Fresh deployment (removes volumes - DATA LOSS!)
./scripts/deploy-local.sh migrate   # Run database migrations only
./scripts/deploy-local.sh seed      # Run database seeders only

# Local Development Defaults
- Environment: dev
- Domain: localhost
- Port: 3002
- Replicas: 1
- Early database start: enabled
- Skip image pulling: enabled (for faster builds)
```

### 🧪 Test Environment (`deploy-test.sh`)

**Purpose**: Test environment deployment with production-like settings

```bash
# Test deployment (domain required)
./scripts/deploy-test.sh deploy --domain test.healthapp.com --migrate --seed

# Available commands
./scripts/deploy-test.sh deploy     # Deploy complete test stack
./scripts/deploy-test.sh update     # Update running services (safer)
./scripts/deploy-test.sh stop       # Stop test stack
./scripts/deploy-test.sh restart    # Stop and redeploy
./scripts/deploy-test.sh logs       # Show service logs
./scripts/deploy-test.sh status     # Show service status
./scripts/deploy-test.sh clean      # Clean and redeploy
./scripts/deploy-test.sh fresh      # Fresh deployment (removes volumes)
./scripts/deploy-test.sh scale      # Scale services up/down

# Test Environment Features
- Environment: test
- Domain: Required (validation enforced)
- Port: 3002
- Replicas: 2 (for load testing)
- Volume cleanup protection: enabled
- Test database isolation
```

### 🚀 Production Environment (`deploy-prod.sh`)

**Purpose**: Secure production deployment with comprehensive safety measures

```bash
# Production deployment with safety checks
./scripts/deploy-prod.sh deploy --domain healthapp.com --migrate

# Available commands
./scripts/deploy-prod.sh deploy     # Deploy complete production stack
./scripts/deploy-prod.sh update     # Update services (RECOMMENDED for production)
./scripts/deploy-prod.sh stop       # Stop stack (requires confirmation)
./scripts/deploy-prod.sh restart    # Restart stack (requires confirmation)
./scripts/deploy-prod.sh logs       # Show service logs
./scripts/deploy-prod.sh status     # Show service status
./scripts/deploy-prod.sh migrate    # Run migrations (with backup recommendation)
./scripts/deploy-prod.sh scale      # Scale services up/down
./scripts/deploy-prod.sh backup     # Backup production database

# Production Safety Features
- Environment: prod
- Domain: Required with validation
- Production safety confirmations
- Volume cleanup BLOCKED (--cleanup-volumes disabled)
- Seeding BLOCKED (--seed disabled)
- Double confirmation for destructive operations
- Environment variable validation
- Automatic backup recommendations

# Blocked Operations in Production
❌ ./scripts/deploy-prod.sh fresh     # BLOCKED - would delete data
❌ ./scripts/deploy-prod.sh seed      # BLOCKED - could overwrite data
❌ --cleanup-volumes flag             # BLOCKED - would delete data
```

## 🔄 Enhanced Migration & Seeding System

### Migration Improvements

The deployment system now includes robust migration handling with timeout protection and fallback strategies:

```bash
# Migration Strategy Decision Tree:
1. Check for migration files in prisma/migrations/
2. If found: Check database consistency with migrations
3. If consistent: Run `prisma migrate deploy`
4. If inconsistent: Run `prisma migrate reset --force --skip-seed`
5. If reset fails: Fall back to `prisma db push --force-reset`
6. If no migrations: Use `prisma db push` directly

# Timeout Protection:
- Standard migrations: 120 second timeout
- Migration reset: 120 second timeout  
- Schema push: 60 second timeout
- All operations have fallback strategies
```

### Seeding Improvements

The seeding system now supports multiple locations and execution methods:

```bash
# Seed File Detection Priority:
1. prisma/seed.ts (NEW - TypeScript with tsx execution)
2. prisma/seed.js (Compiled TypeScript)
3. lib/seed.cjs (Legacy CommonJS)
4. lib/seed.js (Legacy JavaScript)

# Execution Methods Tried:
1. `npx prisma db seed` (Prisma's built-in command)
2. `npx tsx --require dotenv/config prisma/seed.ts`
3. `npx tsx prisma/seed.ts`  
4. `npx ts-node --require dotenv/config prisma/seed.ts`
5. `node prisma/seed.js` (if compiled)
6. `node lib/seed.cjs` (legacy)

# Timeout Protection:
- Prisma seed command: 120 second timeout
- Manual seed execution: 180 second timeout
- Process never hangs indefinitely
```

### Package.json Configuration

Current seed configuration (already correctly set):

```json
{
  "prisma": {
    "seed": "tsx --require dotenv/config prisma/seed.ts"
  }
}
```

## 🛠️ Universal Deploy Script

The main `deploy.sh` script is still available for advanced usage and supports all environments:

```bash
# Universal deployment script syntax
./scripts/deploy.sh [ENVIRONMENT] [COMMAND] [OPTIONS]

# Examples
./scripts/deploy.sh dev deploy --domain localhost --migrate --seed
./scripts/deploy.sh test deploy --domain test.healthapp.com --migrate --seed  
./scripts/deploy.sh prod deploy --domain healthapp.com --migrate --auto-yes

# All options
--domain DOMAIN              # Domain/IP for the application
--env-file FILE             # Environment file to load (default: .env)
--port-frontend PORT        # Frontend port (default: 3002)
--port-backend PORT         # Backend port (default: 5001)  
--port-db PORT              # Database port (default: 5432)
--port-redis PORT           # Redis port (default: 6379)
--port-pgadmin PORT         # PgAdmin port (default: 5050)
--replicas N                # Number of replicas for services
--migrate                   # Run database migrations after deployment
--seed                      # Run database seeders after deployment
--cleanup                   # Clean up before deployment
--cleanup-volumes           # Also remove data volumes (DANGER)
--no-early-db              # Don't start database services early
--skip-build               # Skip Docker image building  
--skip-image-pull          # Skip pulling base images
--auto-yes                 # Skip all confirmation prompts
--debug                    # Enable debug output
```

### Test Environment with Docker Swarm

**Script**: `./scripts/deploy-test.sh`

```bash
# Deploy test environment with automated testing
./scripts/deploy-test.sh deploy --test --migrate --seed

# Additional test-specific commands
test      # Run automated test suite
cleanup   # Clean up test environment

# Runs comprehensive tests:
# - Backend unit tests
# - Frontend component tests
# - API integration tests
# - Health check validations
```

### Production with Docker Swarm

**Script**: `./scripts/deploy-production.sh`

```bash
# Set required NextAuth.js environment variables first
export NEXTAUTH_SECRET=your-32-char-nextauth-secret
export POSTGRES_PASSWORD=secure_prod_password

# Production deployment with universal script
./scripts/deploy.sh prod deploy \
  --domain healthapp.gagneet.com \
  --scale 4 \
  --migrate

# Alternative: Production deployment with dedicated script
./scripts/deploy-production.sh deploy \
  --domain healthapp.gagneet.com \
  --scale 4 \
  --scale-db 2 \
  --branch master \
  --migrate \
  --seed

# Production-specific commands
deploy      # Deploy with safety checks
update      # Zero-downtime rolling update
rollback    # Rollback to previous version
scale       # Scale services
backup      # Create production backup
restore     # Restore from backup
```

## ⚙️ Advanced Configuration

### Custom Multi-Server Deployment

```bash
# Deploy across multiple servers with custom domains
./scripts/deploy-production.sh deploy \
  --domain app.company.com \
  --domain-db db.company.com \
  --domain-redis cache.company.com \
  --domain-pgadmin admin.company.com \
  --app-name company-health \
  --port-app 8080 \
  --port-db 5433
```

### Branch-Specific Deployment

```bash
# Deploy specific feature branch
./scripts/deploy-dev.sh deploy --branch feature/new-ui --migrate

# Deploy hotfix to production
./scripts/deploy-production.sh deploy --branch hotfix/critical-fix
```

### Custom Port Configuration

```bash
# Local development with custom ports
./scripts/deploy-local.sh start \
  --port-app 3000 \
  --port-backend 3001 \
  --port-db 5433

# Production with custom ports
./scripts/deploy-production.sh deploy \
  --port-app 8080 \
  --port-db 5433 \
  --port-redis 6380
```

## 📊 Scaling and Performance

### Horizontal Scaling

```bash
# Scale application for high traffic
./scripts/deploy-production.sh scale --scale 6

# Scale individual services
./scripts/deploy-dev.sh deploy \
  --scale 4 \
  --scale-db 2 \
  --scale-redis 2 \
  --scale-pgadmin 1
```

### Resource Management

**Memory Limits by Environment:**

| Environment | App Container | DB Container | Redis Container |
|-------------|---------------|--------------|-----------------|
| Local | 512MB | 1GB | 256MB |
| Development | 512MB | 1GB | 256MB |
| Test | 1GB | 2GB | 512MB |
| Production | 1GB | 2GB | 512MB |

### Performance Optimization

```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use specific resource limits
docker service update --limit-memory 1GB healthapp-prod_app
```

## 📊 Monitoring and Logging

### Health Checks

All deployment scripts include automatic health verification:

```bash
# Check deployment health
./scripts/deploy-production.sh status

# Example output:
✅ Application: Healthy (https://healthapp.gagneet.com:3002)
✅ PostgreSQL: Ready
✅ Redis: Ready
```

### Log Management

```bash
# View all service logs
./scripts/deploy-production.sh logs

# View specific service logs
./scripts/deploy-production.sh logs app
./scripts/deploy-dev.sh logs postgres
./scripts/deploy-local.sh logs frontend
```

### Service Monitoring

```bash
# Docker Swarm service status
docker service ls
docker service ps healthapp-prod_app
```

## 💾 Backup and Recovery

### Automated Backups

```bash
# Create production backup
./scripts/deploy-production.sh backup

# Backup with custom name
BACKUP_FILE="pre-deployment-$(date +%Y%m%d).sql"
```

### Disaster Recovery

```bash
# Restore from backup
./scripts/deploy-production.sh restore backup_file.sql.gz

# Emergency rollback
./scripts/deploy-production.sh rollback
```

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Find what's using a port
lsof -i :3002

# Kill process using port
kill -9 $(lsof -t -i:3002)
```

#### Docker Issues
```bash
# Clean up Docker system
docker system prune -f

# Reset Docker Swarm
docker swarm leave --force
docker swarm init
```

#### Database Connection Issues
```bash
# Check database status
docker exec healthapp-postgres pg_isready -U healthapp_user

# View database logs
docker service logs healthapp-prod_postgres
```

#### Service Discovery Problems
```bash
# Check Docker networks
docker network ls

# Inspect service network
docker service inspect healthapp-prod_app
```

### Emergency Procedures

#### Production Outage
1. Check service status: `./scripts/deploy-production.sh status`
2. Review logs: `./scripts/deploy-production.sh logs`
3. Rollback if needed: `./scripts/deploy-production.sh rollback`
4. Scale up if under load: `./scripts/deploy-production.sh scale --scale 6`

#### Database Recovery
1. Stop application: `./scripts/deploy-production.sh stop`
2. Restore backup: `./scripts/deploy-production.sh restore latest_backup.sql.gz`
3. Restart services: `./scripts/deploy-production.sh deploy`

### Getting Help

#### Health Check Commands
```bash
# Quick health check
curl -f http://localhost:3002/api/health

# Database connectivity
docker exec postgres-container pg_isready

# Redis connectivity  
docker exec redis-container redis-cli ping
```

#### Debug Mode
```bash
# Enable debug logging
export DEBUG=healthapp:*

# Run with verbose output
./scripts/deploy-local.sh start --migrate --seed
```

## 📝 Additional Resources

- **Environment Files**: `env_files/` directory contains all environment configurations
- **Docker Configurations**: `docker/` directory contains all Dockerfiles and compose files
- **Deployment Scripts**: `scripts/` directory contains all deployment automation
- **Architecture Documentation**: `docs/architecture.md`
- **API Documentation**: `docs/API_INTEGRATION_GUIDE.md`

---

**Healthcare Management Platform v4.0.0**  
*Complete Docker deployment solution for modern healthcare applications*