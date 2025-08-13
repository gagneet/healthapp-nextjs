# Healthcare Management Platform - Production Deployment Guide

This document provides comprehensive instructions for deploying the Healthcare Management Platform with **Phase 1 (Medical Safety), Phase 3 (IoT Integration), and Phase 4 (Telemedicine & Lab Integration)** across different environments.

## 🏗️ **Current Architecture Overview**

### ✅ **Production-Ready Features (85% Complete)**
- **Phase 1**: Medical Safety & Drug Interactions (100%)
- **Phase 3**: IoT Device Integration & Advanced Monitoring (100%)
- **Phase 4**: Telemedicine & Laboratory Integration (85%)

### 🎯 **Deployment Architecture**
- **Next.js 14 Full-Stack**: Unified frontend and backend with API routes
- **Prisma + PostgreSQL**: Type-safe database with 50+ healthcare models
- **JWT Authentication**: Role-based access control for healthcare workflows
- **Docker Containerization**: Production-ready with horizontal scaling

## 🔧 **Port Configuration**

All environments use consistent ports:

- **Next.js Application**: 3002 (Frontend + API Routes)
- **PostgreSQL**: 5432/5433/5434 (Multi-environment)
- **Redis Cache**: 6379
- **WebRTC Video Server**: 8080 (External service)
- **Lab Integration API**: 9000 (External service)

## Environment Configurations

## 🚀 **Healthcare Platform Deployment Environments**

### **1. Local Development (Docker Compose)**
**Purpose**: Full-stack healthcare development with hot-reload and debugging

#### **Quick Start:**
```bash
# Start complete healthcare platform
./scripts/dev-local.sh start

# Seed with comprehensive healthcare data
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5434/healthapp_dev?schema=public" npx prisma db seed

# Access platform
# Frontend: http://localhost:3002
# Database: localhost:5434
```

#### **Available Commands**:

- `start` - Start complete healthcare platform stack
- `stop` - Stop all services
- `restart` - Restart with fresh database migrations
- `logs` - View aggregated logs from all services
- `clean` - Clean up containers and volumes
- `logs [service]` - Show logs
- `status` - Show service status
- `build` - Build/rebuild images
- `clean` - Remove all containers and volumes
- `migrate` - Run database migrations
- `seed` - Run database seeders
- `shell [service]` - Open shell in container

**Files**:

- `docker-compose.local.yml` - Local compose configuration
- `docker/Dockerfile.local` - Multi-stage local development images

**Example Usage**:

```bash
# Start local environment
./scripts/dev-local.sh start

# View backend logs
./scripts/dev-local.sh logs backend

# Run migrations
./scripts/dev-local.sh migrate

# Open shell in backend container
./scripts/dev-local.sh shell backend
```

#### **🎥 Phase 4: Telemedicine Configuration**

```bash
# Environment variables for video consultations
WEBRTC_SERVER_URL=https://meet.adhere.live
CONSULTATION_SECRET=secure-consultation-key
RECORDING_ENABLED=true

# Laboratory integration
LAB_API_URL=https://api.lab-partner.com/v1
LAB_API_KEY=your-lab-api-key
LAB_WEBHOOK_SECRET=webhook-secret-key

# External service health checks
npm run health-check:webrtc
npm run health-check:lab-api
```

### 2. Development Environment (Docker Swarm)

**Purpose**: Development/testing with service scaling and swarm features

**Command**: `./scripts/deploy-dev.sh [command]`

**Available Commands**:

- `deploy` - Deploy the development stack
- `update` - Update running services
- `stop` - Remove the stack
- `logs [service]` - Show service logs
- `status` - Show stack status
- `build` - Build development images
- `scale [service] [replicas]` - Scale specific service
- `migrate` - Run database migrations
- `seed` - Run database seeders

**Files**:

- `docker-stack.dev.yml` - Development swarm stack
- `docker/Dockerfile.local` - Development images (multi-target)

**Scaling Configuration**:

- **Backend**: 2 replicas (can scale up)
- **Frontend**: 2 replicas (can scale up)
- **PostgreSQL**: 1 replica (manager node only)

**Example Usage**:

```bash
# Deploy development stack
./scripts/deploy-dev.sh deploy

# Scale backend to 3 replicas
./scripts/deploy-dev.sh scale backend 3

# View all service status
./scripts/deploy-dev.sh status

# Update services with new code
./scripts/deploy-dev.sh update
```

### 3. Production Environment (Docker Swarm)

**Purpose**: Production deployment with high availability, security, and zero-downtime updates

**Command**: `./scripts/deploy-prod.sh [command]`

**Available Commands**:

- `deploy` - Deploy the production stack
- `update` - Zero-downtime rolling updates
- `stop` - Remove the production stack (with confirmation)
- `logs [service]` - Show service logs
- `status` - Show comprehensive stack status
- `build` - Build and push production images
- `scale [service] [replicas]` - Scale service (with confirmation)
- `secrets create` - Create required Docker secrets
- `migrate` - Run database migrations
- `backup` - Create database backup

**Files**:

- `docker-stack.prod.yml` - Production swarm stack
- `docker/Dockerfile.prod` - Optimized production images

**Security Features**:

- Docker secrets for sensitive data
- Non-root containers
- Health checks for all services
- Resource limits and reservations
- Rolling updates with rollback capability

**Scaling Configuration**:

- **Backend**: 3 replicas with placement constraints
- **Frontend**: 3 replicas with placement constraints  
- **PostgreSQL**: 1 replica (manager node only)
- **Nginx**: 2 replicas for load balancing

**Example Usage**:

```bash
# Create required secrets first
./scripts/deploy-prod.sh secrets create

# Deploy production stack
./scripts/deploy-prod.sh deploy

# Scale backend to 5 replicas (with confirmation)
./scripts/deploy-prod.sh scale backend 5

# Perform zero-downtime update
./scripts/deploy-prod.sh update

# Create database backup
./scripts/deploy-prod.sh backup
```

## Configuration Files

### JavaScript Configuration Files

All configuration files use JavaScript (not TypeScript) following best practices:

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration  
- `next.config.js` - Next.js configuration

### TypeScript Configuration

- `tsconfig.json` - TypeScript compiler configuration
- Application code uses TypeScript for type safety

## Docker Images

### Multi-stage Build Strategy

**Local Development** (`docker/Dockerfile.local`):

- `backend-dev`: Development backend with hot-reload
- `frontend-dev`: Development frontend with hot-reload
- Includes debugging tools and utilities

**Production** (`docker/Dockerfile.prod`):

- `backend-prod`: Optimized backend build
- `frontend-prod`: Optimized frontend build with static generation
- Minimal attack surface with non-root users
- Health checks and security hardening

## Database Management

### Migrations

```bash
# Local
./scripts/dev-local.sh migrate

# Development
./scripts/deploy-dev.sh migrate

# Production
./scripts/deploy-prod.sh migrate
```

### Seeders

```bash
# Local
./scripts/dev-local.sh seed

# Development  
./scripts/deploy-dev.sh seed
```

### Backups (Production)

```bash
./scripts/deploy-prod.sh backup
```

## Monitoring and Logs

### Service Logs

```bash
# All services
./scripts/[env].sh logs

# Specific service
./scripts/[env].sh logs backend
./scripts/[env].sh logs frontend
```

### Service Status

```bash
# Quick status
./scripts/[env].sh status

# Docker swarm details (dev/prod)
docker stack services healthapp-[env]
docker service ps healthapp-[env]_[service]
```

## Scaling Services

### Development Environment

```bash
# Scale backend
./scripts/deploy-dev.sh scale backend 3

# Scale frontend
./scripts/deploy-dev.sh scale frontend 3
```

### Production Environment

```bash
# Scale with confirmation prompts
./scripts/deploy-prod.sh scale backend 5
./scripts/deploy-prod.sh scale frontend 4
```

## Zero-Downtime Deployments

Production deployments use rolling updates:

1. **Build** new images
2. **Push** to container registry
3. **Update** services one replica at a time
4. **Health checks** ensure service availability
5. **Automatic rollback** on failure

```bash
# Perform zero-downtime update
./scripts/deploy-prod.sh update
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3002, 3005, 5432 are available
2. **Docker Swarm**: Ensure swarm is initialized for dev/prod deployments
3. **Secrets**: Create Docker secrets before production deployment
4. **Images**: Build images before deployment

### Debug Commands

```bash
# Check service health
docker service ps [service-name] --no-trunc

# View detailed logs
docker service logs [service-name] --tail 100 -f

# Inspect service configuration
docker service inspect [service-name]

# Check node status
docker node ls
```

### Container Shell Access

```bash
# Local environment
./scripts/dev-local.sh shell backend

# Production environment (find container)
docker ps | grep healthapp-prod_backend
docker exec -it [container-id] /bin/bash
```

## Security Considerations

### Production Security

1. **Secrets Management**: Use Docker secrets for sensitive data
2. **Network Security**: Services communicate on encrypted overlay network
3. **Container Security**: Non-root users, minimal images
4. **Access Control**: Manager node deployment restrictions
5. **Health Monitoring**: Comprehensive health checks

### Environment Variables

- **Local**: Defined in docker-compose.local.yml
- **Development**: Defined in docker-stack.dev.yml  
- **Production**: Use Docker secrets and environment variables

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Regular package updates
2. **Security Patches**: Apply security updates
3. **Database Backups**: Regular production backups
4. **Log Rotation**: Monitor and manage log sizes
5. **Resource Monitoring**: Monitor CPU, memory, disk usage

### Scaling Guidelines

- **Backend**: CPU-intensive, scale based on request load
- **Frontend**: Memory-intensive, scale based on concurrent users
- **Database**: Single instance with backup/replica strategy

## Migration from Old Setup

If migrating from the previous setup:

1. **Stop** existing containers
2. **Backup** database data  
3. **Deploy** using new scripts
4. **Migrate** database schema
5. **Verify** application functionality

This new architecture provides:

- ✅ Clean separation between environments
- ✅ Consistent port usage (3002, 3005, 5432)
- ✅ Scalable Docker Swarm for dev/prod
- ✅ Easy local development with Docker Compose
- ✅ Security hardening for production
- ✅ Zero-downtime deployments
- ✅ Comprehensive logging and monitoring
