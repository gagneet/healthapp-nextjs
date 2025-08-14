# Healthcare Management Platform - Complete Setup and Deployment Guide

This comprehensive guide consolidates setup instructions, deployment procedures, and quick start information for the Healthcare Management Platform across all environments.

## 📋 Table of Contents

1. [Quick Start (5 Minutes)](#-quick-start-5-minutes)
2. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
3. [Environment Configuration](#️-environment-configuration)
4. [Database Setup](#-database-setup)
5. [Deployment Instructions](#-deployment-instructions)
6. [Post-Deployment Verification](#-post-deployment-verification)
7. [Troubleshooting](#-troubleshooting)
8. [Production Deployment](#-production-deployment)

## ⚡ Quick Start (5 Minutes)

### One-Command Local Development

```bash
# 1. Clone repository
git clone <repository-url>
cd healthapp-nextjs

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Quick start with Next.js application
chmod +x quick-start-nextjs.sh
./quick-start-nextjs.sh
```

### What You Get

After successful deployment (Pure Next.js Architecture):

| Service | URL | Purpose |
|---------|-----|----------|
| **🏥 Next.js Full-Stack App** | [http://localhost:3000](http://localhost:3000) | **Complete Healthcare Management Platform** |
| **💊 Health Check** | [http://localhost:3000/api/health](http://localhost:3000/api/health) | **Real Database Statistics** |
| **📊 PostgreSQL** | localhost:5432 | Advanced Healthcare Schema with Prisma |
| **⚡ Redis Cache** | localhost:6379 | Session management and caching |
| **🗄️ Database Admin** | [http://localhost:5050](http://localhost:5050) | **PgAdmin Interface** |

### Current Architecture ✅

- ✅ **Pure Next.js 14 Full-Stack** with App Router (port 3000)
- ✅ **NextAuth.js Authentication** with healthcare role-based permissions
- ✅ **Integrated API routes** in `/app/api` directory - no separate backend
- ✅ **Prisma ORM** with introspected PostgreSQL healthcare schema
- ✅ **Business ID generation** (DOC-2025-001, PAT-2025-001, HSP-2025-001)
- ✅ **Type-safe operations** with full TypeScript integration
- ✅ **Simplified deployment** - single Next.js service only

## 🔧 Prerequisites & System Requirements

### Required Software

```bash
# Verify you have these installed:
node --version    # Should be 22.18.0+ (LTS)
docker --version  # Any recent version
git --version     # Any recent version
```

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

### Software Installation

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker info
```

## ⚙️ Environment Configuration

### Environment Files Overview

| File | Purpose | When Used |
|------|---------|-----------||
| `.env.local` | Local development (no Docker) | `npm run dev` |
| `.env.development` | Docker development environment | `./scripts/deploy-dev.sh` |
| `.env.production` | Production deployment | `./scripts/deploy-prod.sh` |

### Create Environment Files

```bash
# Copy environment templates
cp .env.example .env.local
cp .env.development.example .env.development
cp .env.production.example .env.production
```

### Required Environment Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nextjs_healthcare_secret_key_for_development_not_for_production

# Database Connection (Prisma)
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5432/healthapp_dev?schema=public"

# Application Settings
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Security Settings

```bash
# Generate a secure JWT secret (run this command):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate secure NextAuth secret:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Use the output in your .env files:
JWT_SECRET=your-generated-256-bit-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## 🐘 Database Setup

### Option 1: Docker Setup (Recommended)

The deployment script handles database setup automatically. Ensure your `.env.development` has correct values:

```bash
# .env.development
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_dev
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=Dev_Pass_2024!
```

### Option 2: Local PostgreSQL Setup

```bash
# 1. Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# 2. Start PostgreSQL service
sudo service postgresql start

# 3. Create database and user
sudo -u postgres psql

-- In PostgreSQL prompt:
CREATE DATABASE healthapp_local;
CREATE USER healthapp_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE healthapp_local TO healthapp_user;
ALTER USER healthapp_user CREATEDB;  -- For running tests
\q
```

## 🚀 Deployment Instructions

### Local Development (Docker Compose)

```bash
# Start complete healthcare platform
./scripts/dev-local.sh start

# Seed with comprehensive healthcare data
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5434/healthapp_dev?schema=public" npx prisma db seed

# Access platform
# Frontend: http://localhost:3002
# Database: localhost:5434
```

**Available Commands:**
- `start` - Start complete healthcare platform stack
- `stop` - Stop all services
- `restart` - Restart with fresh database migrations
- `logs` - View aggregated logs from all services
- `clean` - Clean up containers and volumes
- `status` - Show service status
- `migrate` - Run database migrations
- `seed` - Run database seeders

### Development Environment (Docker Swarm)

```bash
# Initialize Docker Swarm (one-time)
./scripts/docker-swarm-init.sh

# Deploy development environment
./scripts/deploy-dev.sh deploy --auto-yes

# Scale services
./scripts/deploy-dev.sh scale backend 3
./scripts/deploy-dev.sh scale frontend 2
```

### Development Services

| Service | Port | Replicas | Description |
|---------|------|----------|-------------|
| Frontend | 3002 | 1-3 | NextJS application |
| Backend | 3001 | 1-5 | Node.js API server |
| PostgreSQL | 5433 | 1 | Database |
| Redis | 6379 | 1 | Cache & sessions |
| pgAdmin | 5050 | 1 | Database management |

### Production Deployment

```bash
# Set required environment variables
export POSTGRES_PASSWORD=secure_prod_password
export JWT_SECRET=your-256-bit-secret-key
export NEXTAUTH_SECRET=your-nextauth-secret-key
export REDIS_PASSWORD=secure_redis_password
export PGADMIN_PASSWORD=secure_admin_password

# Deploy to production
./scripts/deploy-production.sh deploy --domain demo.adhere.live --scale 4 --migrate
```

## ✅ Post-Deployment Verification

### Service Health Checks

```bash
# Check all containers are running
docker-compose -f docker/docker-compose.dev.yml ps

# Test API Health
curl http://localhost:3000/api/health
# Expected: {"status":true,"payload":{"data":{...}}}

# Test Frontend
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

### Application Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | [http://localhost:3002](http://localhost:3002) | Create account via UI |
| **Backend API** | [http://localhost:3001/api](http://localhost:3001/api) | API endpoints |
| **pgAdmin** | [http://localhost:5050](http://localhost:5050) | admin@healthapp.com / admin123 |
| **API Docs** | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) | Auto-generated docs |

### Default Access

- **Application**: [http://localhost:3000](http://localhost:3000)
- **Doctor Dashboard**: `/dashboard/doctor` (requires authentication)
- **Patient Dashboard**: `/dashboard/patient` (requires authentication)
- **Admin Dashboard**: `/dashboard/admin` (requires authentication)
- **NextAuth.js Sign In**: `/api/auth/signin`
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use

**Error:** `Port 3000 is already in use`

```bash
# Kill processes using conflicting ports
sudo fuser -k 3000/tcp 5432/tcp 6379/tcp

# Or find and kill specific process
lsof -ti:3000
kill -9 $(lsof -ti:3000)
```

#### 2. Database Connection Issues

**Error:** `ECONNREFUSED ::1:5432`

```bash
# Check PostgreSQL container
docker logs healthapp-nextjs-postgres-local
docker restart healthapp-nextjs-postgres-local

# Check if PostgreSQL container is running
docker-compose -f docker/docker-compose.dev.yml ps postgres

# View PostgreSQL logs
docker-compose -f docker/docker-compose.dev.yml logs postgres
```

#### 3. Complete Reset (Nuclear Option)

```bash
# Stop everything and start fresh
docker-compose -f docker/docker-compose.nextjs-local.yml down -v
sleep 10
./quick-start-nextjs.sh

# Or for development environment
docker-compose -f docker/docker-compose.dev.yml down -v --remove-orphans
docker system prune -f
./scripts/deploy-dev.sh
```

### Service-Specific Logs

```bash
# View specific service logs
docker-compose -f docker/docker-compose.dev.yml logs frontend
docker-compose -f docker/docker-compose.dev.yml logs backend
docker-compose -f docker/docker-compose.dev.yml logs postgres

# Follow logs in real-time
docker-compose -f docker/docker-compose.dev.yml logs -f backend
```

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

## 🚀 Production Deployment

### Environment Setup

```bash
# .env.production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://demo.adhere.live

# Database - Use managed PostgreSQL service
POSTGRES_HOST=your-prod-database.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_production
POSTGRES_USER=healthapp_prod
POSTGRES_PASSWORD=ultra-secure-production-password

# Security
JWT_SECRET=your-production-jwt-secret-256-bits-minimum
BCRYPT_ROUNDS=12

# External services with production credentials
AWS_ACCESS_KEY_ID=production-aws-key
AWS_SECRET_ACCESS_KEY=production-aws-secret
AWS_S3_BUCKET=healthapp-production-files
```

### Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Enable SSL/TLS certificates
- [ ] Set up proper firewall rules
- [ ] Enable database backups
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Remove development tools and debug flags
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up API authentication

### Production Features

- **Phase 1**: Medical Safety & Drug Interactions (100%)
- **Phase 3**: IoT Device Integration & Advanced Monitoring (100%)
- **Phase 4**: Telemedicine & Laboratory Integration (85%)

## 🎯 Key Features Available

Once deployed, you have access to:

- ✅ **Patient Management** - Complete CRUD operations
- ✅ **Provider Management** - Doctor profiles and specialties
- ✅ **Medication Tracking** - Prescription management
- ✅ **Appointment Scheduling** - Calendar system
- ✅ **Care Plans** - Treatment planning
- ✅ **Vital Signs** - Health monitoring
- ✅ **Real-time Notifications** - Alert system
- ✅ **File Uploads** - Document management
- ✅ **API Documentation** - Swagger/OpenAPI docs
- ✅ **Database Admin** - pgAdmin interface

## 📚 Useful Commands

### Database Operations

```bash
npm run migrate              # Run pending migrations
npm run migrate:undo         # Undo last migration
npm run seed                # Seed database with initial data
npm run seed:undo           # Undo all seeds
```

### Development

```bash
npm run dev                 # Start frontend development
npm run backend:dev         # Start backend development
npm run lint                # Run linter
npm run test                # Run tests
```

### Docker Operations

```bash
docker-compose -f docker/docker-compose.dev.yml up -d     # Start services
docker-compose -f docker/docker-compose.dev.yml down      # Stop services
docker-compose -f docker/docker-compose.dev.yml restart   # Restart services
docker-compose -f docker/docker-compose.dev.yml logs -f   # View logs
```

## 🔒 Security Notes

**Development Environment:**
- Uses development passwords (change for production!)
- CORS is open for localhost
- Debug logging is enabled
- `POSTGRES_HOST_AUTH_METHOD=trust` allows passwordless connections

**Before Production:**
- Change all passwords and secrets
- Enable SSL/TLS
- Configure proper firewall rules
- Set up monitoring and backups
- Review security checklist

## 💡 Need Help?

- **Full Setup Guide**: This document
- **Architecture Overview**: `README.md`
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Docker Guide**: `docs/DOCKER_DEPLOYMENT_GUIDE.md`

---

## 🎯 Quick Start Summary

For immediate deployment:

```bash
# 1. Clone and setup
git clone <repo-url> && cd healthapp-nextjs && npm install

# 2. Copy environment files
cp .env.development.example .env.development

# 3. Update passwords in .env.development (use strong passwords!)

# 4. Deploy with one command
chmod +x scripts/deploy-dev.sh && ./scripts/deploy-dev.sh

# 5. Access your application
# Frontend: http://localhost:3002
# Backend:  http://localhost:3001
# pgAdmin: http://localhost:5050
```

**🎉 That's it! Your Healthcare Management Platform is ready to use!**

---

*Last updated: August 2025 - Complete Setup Guide*
