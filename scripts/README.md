# 🚀 HealthApp Consolidated Deployment System

This directory contains the **consolidated deployment system** for the HealthApp Healthcare Management Platform with a single script and Docker stack file for all environments.

## 📅 Latest Updates (August 2025)

### ✅ **MAJOR CONSOLIDATION (BREAKING CHANGES)**
- **Single Deployment Script**: All environment-specific scripts consolidated into `deploy.sh`
- **Single Docker Stack**: All docker-stack files consolidated into one universal `docker-stack.yml`
- **Environment Parameters**: Use environment parameters instead of separate scripts
- **Automatic Configuration**: Environment-specific settings applied automatically
- **Production Safety Built-In**: Safety measures integrated into the main script

### ✅ Enhanced Migration & Seeding System
- **Timeout Protection**: All migration and seeding operations now have timeout protection
- **Fallback Strategies**: Multiple fallback methods prevent deployment failures
- **TypeScript Seed Support**: Full support for `prisma/seed.ts` with tsx execution
- **Multiple Seed Locations**: Automatic detection of seed files in various locations

## 🎯 Consolidated File Structure

```
scripts/
└── deploy.sh              # Single universal deployment script

docker/
└── docker-stack.yml       # Single universal Docker stack file
```

### ✅ Removed Files (Consolidated)
- ❌ `deploy-local.sh` (merged into `deploy.sh`)
- ❌ `deploy-test.sh` (merged into `deploy.sh`)
- ❌ `deploy-prod.sh` (merged into `deploy.sh`)
- ❌ `docker-stack.test.yml` (merged into `docker-stack.yml`)
- ❌ `docker-stack.prod.yml` (merged into `docker-stack.yml`)
- ❌ `docker-stack.production.yml` (merged into `docker-stack.yml`)

## 🚀 **New Consolidated Usage**

### Universal Command Structure
```bash
./scripts/deploy.sh [ENVIRONMENT] [COMMAND] [OPTIONS]
```

### 🏠 **Development Environment**
```bash
# Basic development deployment
./scripts/deploy.sh dev deploy --migrate --seed

# Development features (automatic):
- Domain: localhost (automatic)
- Port: 3002
- Replicas: 1
- Memory limits: Lower (512M-1GB)
- SQL logging: Full (debug mode)
- Network encryption: Disabled
- PgAdmin: Single-user mode
```

### 🧪 **Test Environment**  
```bash
# Test deployment
./scripts/deploy.sh test deploy --domain test.healthapp.com --migrate --seed

# Update existing deployment
./scripts/deploy.sh test update --domain test.healthapp.com

# Scale test environment
./scripts/deploy.sh test scale --replicas 3

# Test features (automatic):
- Domain: Required (validation enforced)
- Port: 3002
- Replicas: 2 (for load testing)
- Memory limits: Medium (512M-1GB)
- SQL logging: Disabled
- Network encryption: Disabled
- PgAdmin: Multi-user mode
```

### 🚀 **Production Environment**
```bash
# Production deployment with safety checks
./scripts/deploy.sh prod deploy --domain healthapp.com --migrate

# Update production (recommended)
./scripts/deploy.sh prod update --domain healthapp.com

# Scale production
./scripts/deploy.sh prod scale --replicas 4

# Production safety features (automatic):
- Domain: Required with validation
- Environment validation: Required variables checked
- Memory limits: Higher (1GB-2GB)
- SQL logging: Disabled
- Network encryption: Enabled
- Database optimizations: Higher connections/buffers
- PgAdmin: Multi-user with master password
- BLOCKS: --seed, --cleanup-volumes, destructive operations
- Requires confirmation for stop/restart/migrations
```

## 🔄 Migration & Seeding System

### Migration Strategy

The deployment system uses an intelligent migration decision tree:

1. **Check Migration Files**: Look for `prisma/migrations/` directory
2. **Database Consistency Check**: Compare database with migration files
3. **Strategy Selection**:
   - **Consistent**: Run `prisma migrate deploy` (120s timeout)
   - **Inconsistent**: Run `prisma migrate reset --force --skip-seed` (120s timeout)  
   - **Reset Failed**: Fallback to `prisma db push --force-reset` (60s timeout)
   - **No Migrations**: Use `prisma db push` directly (60s timeout)

### Seeding System

The seeding system supports multiple locations and execution methods:

**Seed File Detection Priority:**
1. `prisma/seed.ts` (NEW - TypeScript with tsx)
2. `prisma/seed.js` (Compiled TypeScript)
3. `lib/seed.cjs` (Legacy CommonJS)
4. `lib/seed.js` (Legacy JavaScript)

**Execution Methods (tried in order):**
1. `npx prisma db seed` (Prisma's built-in - 120s timeout)
2. `npx tsx --require dotenv/config prisma/seed.ts`
3. `npx tsx prisma/seed.ts`
4. `npx ts-node --require dotenv/config prisma/seed.ts`
5. `node prisma/seed.js` (if compiled)
6. `node lib/seed.cjs` (legacy)

**Timeout Protection:**
- Total seeding timeout: 180 seconds
- Process never hangs indefinitely
- Graceful fallback on failures

### Current Configuration

Package.json is correctly configured:
```json
{
  "prisma": {
    "seed": "tsx --require dotenv/config prisma/seed.ts"
  }
}
```

## 🏗️ Architecture Overview

**Healthcare Management Platform** - Modern full-stack TypeScript application:
- **Full-Stack**: Next.js 14 with App Router + TypeScript (unified frontend/backend)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with PrismaAdapter and database sessions
- **Cache**: Redis for enhanced session management and performance  
- **Deployment**: Universal Docker Swarm deployment with environment-specific configurations

## 📁 Script Structure

### Environment-Specific Scripts

| Script | Environment | Purpose | Architecture |
|--------|-------------|---------|--------------|
| `deploy.sh` | **Universal** | **Universal deployment for dev/test/prod** | **Docker Swarm** |
| `deploy-local.sh` | Local Development | Hot-reload development | Docker Compose |
| `deploy-dev.sh` | Development Server | Team development server | Docker Swarm |
| `deploy-test.sh` | Test/CI Environment | Automated testing & QA | Docker Swarm |
| `deploy-production.sh` | Production Server | Live production deployment | Docker Swarm |

### Port Allocation

| Environment | Application | PostgreSQL | Redis | PgAdmin |
|-------------|-------------|------------|-------|---------|
| **Local** | 3002 | 5434 | 6379 | 5050 |
| **Dev** | 3002 | 5432 | 6379 | 5050 |
| **Test** | 3003 | 5433 | 6380 | 5051 |
| **Production** | 3002 | 5432 | 6379 | 5050 |

*Note: All environments use Next.js full-stack architecture with integrated API routes and NextAuth.js*

## 🚀 Quick Start

### Universal Deployment System

Use the **universal deployment script** for all environments:

```bash
# Universal deployment script syntax
./scripts/deploy.sh [environment] [command] [options]
# Environments: dev, test, prod
# Commands: deploy, stop, logs, status, migrate, seed, scale
```

### Local Development
```bash
# Start local development environment with hot-reload
./scripts/deploy-local.sh start --migrate --seed

# View logs
./scripts/deploy-local.sh logs

# Stop environment
./scripts/deploy-local.sh stop
```

### Development Server
```bash
# Deploy to development server using universal script
./scripts/deploy.sh dev deploy --host-ip 192.168.1.100 --migrate --seed

# Alternative: Use dedicated script
./scripts/deploy-dev.sh deploy --host-ip 192.168.1.100 --migrate --seed

# View status
./scripts/deploy.sh dev status
```

### Test Environment
```bash
# Deploy test environment and run tests using universal script
./scripts/deploy.sh test deploy --migrate --seed --test

# Run tests only
./scripts/deploy.sh test test

# Cleanup test environment
./scripts/deploy.sh test cleanup
```

### Production Deployment
```bash
# Set required NextAuth.js environment variables
export NEXTAUTH_SECRET=your-32-char-nextauth-secret
export POSTGRES_PASSWORD=secure_prod_password
export REDIS_PASSWORD=secure_redis_password
export PGADMIN_PASSWORD=secure_admin_password

# Deploy to production using universal script
./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com --migrate

# Alternative: Use dedicated script
./scripts/deploy-production.sh deploy --domain healthapp.gagneet.com --migrate

# Zero-downtime update
./scripts/deploy.sh prod update

# Create backup
./scripts/deploy.sh prod backup
```

## 📋 Common Commands

### All Environments
Every script supports these commands:
- `deploy` - Deploy the environment
- `stop` - Stop services
- `logs [service]` - Show logs
- `status` - Show service status
- `migrate` - Run database migrations
- `seed` - Run database seeders

### Environment-Specific Commands

**Local Development:**
- `start` - Start development environment
- `restart` - Restart services
- `cleanup` - Clean up containers and volumes

**Development Server:**
- `update` - Update services
- `scale <service> <replicas>` - Scale specific service
- `backup` - Backup development database

**Test Environment:**
- `test` - Run automated test suite
- `cleanup` - Clean up test environment

**Production:**
- `update` - Zero-downtime rolling update
- `rollback` - Rollback to previous version
- `scale <replicas>` - Scale application
- `backup` - Create production backup
- `restore <file>` - Restore from backup

## 🔧 Configuration

### Environment Variables

**Required for Production:**
```bash
NEXTAUTH_SECRET=your-32-char-nextauth-secret
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
PGADMIN_PASSWORD=your_pgadmin_password
```

**Optional:**
```bash
DOMAIN=healthapp.gagneet.com  # Production domain
HOST_IP=192.168.1.100    # Host IP for multi-server deployments
```

### Security Features

- **Production Safety Checks**: Multiple confirmations for critical operations
- **Automated Backups**: Pre-deployment backups for production
- **Environment Isolation**: Separate configurations for each environment
- **Health Checks**: Automated deployment verification
- **Zero-Downtime Updates**: Rolling updates for production

## 🗂️ File Organization

### Current Structure
```
scripts/
├── deploy-local.sh          # Local development
├── deploy-dev.sh           # Development server
├── deploy-test.sh          # Test environment
├── deploy-production.sh    # Production deployment
└── README.md              # This documentation

docker/
├── Dockerfile             # Base Dockerfile
├── Dockerfile.local       # Local development
├── Dockerfile.production  # Production build
├── docker-compose.local.yml    # Local compose
├── docker-compose.dev.yml      # Development compose
├── docker-compose.test.yml     # Test compose
├── docker-compose.production.yml # Production compose
├── docker-stack.dev.yml        # Development swarm
├── docker-stack.test.yml       # Test swarm
└── docker-stack.production.yml # Production swarm
```

### Removed Files ✅
Cleaned up redundant and unused files:
- `deploy-nextjs-*.sh` variants
- `deploy-vm-*.sh` variants
- `deploy-stack.sh` (overly complex)
- `docker-cleanup.sh` (integrated into scripts)
- `backup-prod.sh` (integrated into production script)
- Multiple redundant Dockerfiles and compose files

## 🧪 Testing

### Local Testing
```bash
./scripts/deploy-local.sh start --migrate --seed
# Test at http://localhost:3002
```

### Automated Testing
```bash
./scripts/deploy-test.sh deploy --test
# Runs full test suite including:
# - Backend unit tests
# - Frontend component tests  
# - API integration tests
# - Health check validations
```

## 🔍 Monitoring & Debugging

### Health Checks
All environments include automated health monitoring:
- Application health endpoints
- Database connectivity checks
- Service status verification

### Log Management
```bash
# View all service logs
./scripts/deploy-[env].sh logs

# View specific service logs
./scripts/deploy-[env].sh logs frontend
./scripts/deploy-[env].sh logs backend
./scripts/deploy-[env].sh logs postgres
```

### Status Monitoring
```bash
./scripts/deploy-[env].sh status
# Shows:
# - Service replica counts
# - Container health status
# - Resource utilization
# - Endpoint accessibility
```

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Check what's using a port
lsof -i :3002

# Kill process using port
kill -9 $(lsof -t -i:3002)
```

**Docker Issues:**
```bash
# Clean up Docker system
docker system prune -f

# Reset Docker Swarm (if needed)
docker swarm leave --force
docker swarm init
```

**Database Issues:**
```bash
# Reset local database
./scripts/deploy-local.sh cleanup --auto-yes
./scripts/deploy-local.sh start --migrate --seed
```

### Emergency Procedures

**Production Rollback:**
```bash
./scripts/deploy-production.sh rollback
```

**Production Database Restore:**
```bash
./scripts/deploy-production.sh restore backup_file.sql.gz
```

## 📈 Performance Optimization

### Resource Allocation
- **Local**: Minimal resources for development
- **Development**: Moderate resources for team testing
- **Test**: Optimized for automated testing performance
- **Production**: High availability with load balancing

### Scaling Guidelines
```bash
# Scale production application
./scripts/deploy-production.sh scale 4

# Scale development services
./scripts/deploy-dev.sh scale frontend 2
./scripts/deploy-dev.sh scale backend 3
```

---

**Healthcare Management Platform v4.0.0**  
*Clean, secure, and scalable deployment for modern healthcare applications*