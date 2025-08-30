# Healthcare Application - Complete Docker Deployment Guide

This comprehensive guide covers deploying the Healthcare Management Platform using Docker Compose (local) and Docker Swarm (dev/test/production) with all deployment scripts and configurations.

## 🆕 Latest Updates (August 2025)

### ✅ **CONSOLIDATED DEPLOYMENT SYSTEM (MAJOR OVERHAUL)**
- **Single Docker Stack**: Replaced multiple docker-stack files with one universal `docker-stack.yml`
- **Single Deployment Script**: Consolidated all deployment scripts into `deploy.sh` with environment parameters
- **Environment-Based Configuration**: Automatic resource limits and configurations per environment
- **Production Safety Built-In**: Enhanced safety measures integrated into the main deployment script
- **Simplified Usage**: Clean, simple command structure for all environments

### ✅ **Enhanced Migration & Seeding Improvements**
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
# Start local development environment
./scripts/deploy.sh dev deploy --migrate --seed

# View logs  
./scripts/deploy.sh dev logs app

# Stop when done
./scripts/deploy.sh dev stop
```

### 2. Test Environment

```bash
# Initialize Docker Swarm (one-time)
docker swarm init

# Deploy test environment
./scripts/deploy.sh test deploy --domain test.healthapp.com --migrate --seed

# Update existing test deployment
./scripts/deploy.sh test update --domain test.healthapp.com

# Scale test environment
./scripts/deploy.sh test scale --replicas 3
```

### 3. Production Deployment

```bash
# Production deployment with safety checks
./scripts/deploy.sh prod deploy --domain healthapp.com --migrate

# Update production (safest option)
./scripts/deploy.sh prod update --domain healthapp.com

# Scale production services  
./scripts/deploy.sh prod scale --replicas 4
```

## 🎯 Consolidated Deployment System

The deployment system has been completely consolidated into a single script and Docker stack file:

### 📁 **File Structure**
```
scripts/
└── deploy.sh                    # Single universal deployment script

docker/  
└── docker-stack.yml            # Single universal Docker stack file
```

### 🚀 **Simplified Usage**

All environments now use the same script with environment parameters:

```bash
# Universal deployment command structure
./scripts/deploy.sh [ENVIRONMENT] [COMMAND] [OPTIONS]
```

### 🏠 **Development Environment**

```bash
# Basic development deployment
./scripts/deploy.sh dev deploy --migrate --seed

# Available commands
./scripts/deploy.sh dev deploy    # Deploy complete stack  
./scripts/deploy.sh dev update    # Update running services
./scripts/deploy.sh dev stop      # Stop stack
./scripts/deploy.sh dev restart   # Stop and redeploy
./scripts/deploy.sh dev logs      # Show service logs
./scripts/deploy.sh dev status    # Show service status
./scripts/deploy.sh dev migrate   # Run database migrations only
./scripts/deploy.sh dev seed      # Run database seeders only
./scripts/deploy.sh dev scale --replicas 2  # Scale services

# Development Characteristics:
- Memory limits: Lower (512M-1GB)
- Logging: Debug level, all SQL statements
- Network encryption: Disabled
- PgAdmin: Single-user mode
- Default replicas: 1
```

### 🧪 **Test Environment**

```bash
# Test environment deployment
./scripts/deploy.sh test deploy --domain test.healthapp.com --migrate --seed

# Test environment features:
- Memory limits: Medium (512M-1GB)
- Logging: Info level, no SQL statements  
- Network encryption: Disabled
- PgAdmin: Multi-user mode
- Default replicas: 2 (for load testing)
- Domain validation: Required
```

### 🚀 **Production Environment**

```bash
# Production deployment with safety checks
./scripts/deploy.sh prod deploy --domain healthapp.com --migrate

# Production safety features:
- Memory limits: Higher (1GB-2GB)
- Logging: Warning level, no SQL statements
- Network encryption: Enabled
- PgAdmin: Multi-user with master password
- Database optimizations: Higher connections/buffers
- Default replicas: 2
- Built-in safety confirmations
- BLOCKS dangerous operations (--seed, --cleanup-volumes)
```

### 🔧 **Environment-Specific Automatic Configuration**

The single Docker stack file automatically configures itself based on the `ENVIRONMENT` variable:

| Configuration | Dev | Test | Prod |
|---------------|-----|------|------|
| App Memory | 1GB | 1GB | 2GB |
| DB Memory | 512MB | 512MB | 1GB |
| Redis Memory | 256MB | 256MB | 512MB |
| Network Encryption | ❌ | ❌ | ✅ |
| SQL Logging | ✅ Full | ❌ None | ❌ None |
| PgAdmin Mode | Single-user | Multi-user | Multi-user + Master Password |
| Max DB Connections | 200 | 200 | 500 |
| DB Shared Buffers | 128MB | 128MB | 256MB |

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