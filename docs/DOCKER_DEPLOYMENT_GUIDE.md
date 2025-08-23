# Healthcare Application - Complete Docker Deployment Guide

This comprehensive guide covers deploying the Healthcare Management Platform using Docker Compose (local) and Docker Swarm (dev/test/production) with all deployment scripts and configurations.

## 🆕 Latest Updates (August 2025)

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
| **Database** | postgres:15-alpine | postgres:15-alpine | Data persistence + NextAuth sessions |
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
./scripts/deploy-local.sh start --migrate --seed

# View logs
./scripts/deploy-local.sh logs

# Stop when done
./scripts/deploy-local.sh stop
```

### 2. Development Server

```bash
# Initialize Docker Swarm (one-time)
docker swarm init

# Deploy development environment
./scripts/deploy-dev.sh deploy --host-ip 192.168.1.100 --migrate --seed

# Scale services
./scripts/deploy-dev.sh scale frontend 3
```

### 3. Production Deployment

```bash
# Set required NextAuth.js environment variables
export NEXTAUTH_SECRET=your-32-char-nextauth-secret
export POSTGRES_PASSWORD=secure_prod_password
export REDIS_PASSWORD=secure_redis_password
export PGADMIN_PASSWORD=secure_admin_password

# Deploy to production with universal script
./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com --scale 4 --migrate
```

## 🎯 Environment-Specific Deployment

### Local Development with Docker Compose

**Script**: `./scripts/deploy-local.sh`

```bash
# Available commands
./scripts/deploy-local.sh start      # Start all services
./scripts/deploy-local.sh stop       # Stop all services
./scripts/deploy-local.sh restart    # Restart services
./scripts/deploy-local.sh logs       # Show logs
./scripts/deploy-local.sh status     # Service status
./scripts/deploy-local.sh migrate    # Run migrations
./scripts/deploy-local.sh seed       # Run seeders
./scripts/deploy-local.sh cleanup    # Clean up everything

# Configuration options
--domain DOMAIN           # Development domain/IP (default: localhost)
--port-app PORT          # Frontend port (default: 3002)
--port-backend PORT      # Backend API port (default: 3005)
--port-db PORT           # Database port (default: 5434)
--port-redis PORT        # Redis port (default: 6379)
--port-pgadmin PORT      # PgAdmin port (default: 5050)
--app-name NAME          # Compose project name (default: healthapp)
--branch BRANCH          # Git branch to use (default: current)
--migrate                # Run migrations after startup
--seed                   # Run seeders after startup
--auto-yes               # Skip confirmations
```

### Development Server with Docker Swarm

**Script**: `./scripts/deploy-dev.sh`

```bash
# Deploy development stack
./scripts/deploy-dev.sh deploy --scale 2 --migrate --seed

# Available commands
deploy    # Deploy stack to swarm
update    # Update services
stop      # Remove stack
logs      # Show service logs
status    # Show service status
scale     # Scale services
migrate   # Run migrations
seed      # Run seeders
backup    # Backup database

# Configuration options (same as production)
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