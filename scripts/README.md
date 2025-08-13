# Healthcare Application Deployment Scripts

This directory contains clean, organized deployment scripts for all environments of the Healthcare Management Platform.

## 🏗️ Architecture Overview

**Healthcare Management Platform** - Modern full-stack TypeScript application:
- **Frontend**: Next.js 14 with App Router + TypeScript
- **Backend**: Node.js/Express + TypeScript (for dev/test) or integrated Next.js API (for production)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with database sessions
- **Cache**: Redis for sessions and performance
- **Deployment**: Docker with environment-specific configurations

## 📁 Script Structure

### Environment-Specific Scripts

| Script | Environment | Purpose | Architecture |
|--------|-------------|---------|--------------|
| `deploy-local.sh` | Local Development | Hot-reload development | Docker Compose |
| `deploy-dev.sh` | Development Server | Team development server | Docker Swarm |
| `deploy-test.sh` | Test/CI Environment | Automated testing & QA | Docker Swarm |
| `deploy-production.sh` | Production Server | Live production deployment | Docker Swarm |

### Port Allocation

| Environment | Frontend | Backend | PostgreSQL | Redis | PgAdmin |
|-------------|----------|---------|------------|-------|---------|
| **Local** | 3002 | 3005 | 5434 | 6379 | 5050 |
| **Dev** | 3002 | 3005 | 5432 | 6379 | 5050 |
| **Test** | 3003 | 3006 | 5433 | 6380 | 5051 |
| **Production** | 3002 | - | 5432 | 6379 | 5050 |

*Note: Production uses integrated Next.js API routes instead of separate backend*

## 🚀 Quick Start

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
# Deploy to development server with Docker Swarm
./scripts/deploy-dev.sh deploy --host-ip 192.168.1.100 --migrate --seed

# Update services
./scripts/deploy-dev.sh update

# View status
./scripts/deploy-dev.sh status
```

### Test Environment
```bash
# Deploy test environment and run tests
./scripts/deploy-test.sh deploy --migrate --seed --test

# Run tests only
./scripts/deploy-test.sh test

# Cleanup test environment
./scripts/deploy-test.sh cleanup
```

### Production Deployment
```bash
# Set required environment variables
export POSTGRES_PASSWORD=secure_prod_password
export JWT_SECRET=your-256-bit-secret-key
export NEXTAUTH_SECRET=your-nextauth-secret-key
export REDIS_PASSWORD=secure_redis_password
export PGADMIN_PASSWORD=secure_admin_password

# Deploy to production
./scripts/deploy-production.sh deploy --domain demo.adhere.live --migrate

# Zero-downtime update
./scripts/deploy-production.sh update

# Create backup
./scripts/deploy-production.sh backup
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
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_256_bit_secret_key
NEXTAUTH_SECRET=your_nextauth_secret_key
REDIS_PASSWORD=your_redis_password
PGADMIN_PASSWORD=your_pgadmin_password
```

**Optional:**
```bash
DOMAIN=demo.adhere.live  # Production domain
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