# 🏥 Healthcare Management Platform - Complete Setup Guide

This comprehensive guide will walk you through setting up the Healthcare Management Platform from scratch, including all configuration files, passwords, and deployment steps.

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Initial Setup](#-initial-setup)
3. [Environment Configuration](#️-environment-configuration)
4. [Database Setup](#-database-setup)
5. [External Services Configuration](#-external-services-configuration)
6. [Deployment](#-deployment)
7. [Post-Deployment Verification](#-post-deployment-verification)
8. [Troubleshooting](#-troubleshooting)
9. [Production Deployment](#-production-deployment)

## 🔧 Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher
- **Docker** and **Docker Compose**
- **Git** for version control
- **PostgreSQL** 14+ (if running locally without Docker)
- **Redis** (optional, for caching)

### System Requirements

- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk Space**: 10GB free space
- **Network**: Internet connection for downloading dependencies

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0+

# Check Docker
docker --version
docker-compose --version

# Check Git
git --version
```

## 🚀 Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd healthapp-nextjs

# Install dependencies
npm install
```

### 2. Create Environment Files

```bash
# Copy environment templates
cp .env.example .env.local
cp .env.development.example .env.development
cp .env.production.example .env.production
```

## ⚙️ Environment Configuration

### Overview of Environment Files

| File | Purpose | When Used |
|------|---------|-----------|
| `.env.local` | Local development (no Docker) | `npm run dev` |
| `.env.development` | Docker development environment | `./scripts/deploy-dev.sh` |
| `.env.production` | Production deployment | `./scripts/deploy-prod.sh` |

### Core Configuration Values

#### 🔐 Security Settings

**JWT Configuration:**

```bash
# Generate a secure JWT secret (run this command):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Use the output in your .env files:
JWT_SECRET=your-generated-256-bit-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

**Password Requirements:**

- Minimum 12 characters
- Include uppercase, lowercase, numbers, and symbols
- Different passwords for each environment

### 📊 Database Configuration

#### For Docker Development (`.env.development`)

```bash
# Database Configuration (PostgreSQL) - Docker
POSTGRES_HOST=postgres              # Docker service name
POSTGRES_PORT=5432                  # Internal container port
POSTGRES_DB=healthapp_dev          # Database name
POSTGRES_USER=healthapp_user       # Database username
POSTGRES_PASSWORD=Dev_Pass_2024!   # Strong development password
DB_DIALECT=postgres
DB_TIMEZONE=+00:00
```

#### For Local Development (`.env.local`)

```bash
# Database Configuration (PostgreSQL) - Local
POSTGRES_HOST=localhost            # Local PostgreSQL instance
POSTGRES_PORT=5432                # Local PostgreSQL port
POSTGRES_DB=healthapp_local       # Local database name
POSTGRES_USER=your_local_user     # Your local PostgreSQL user
POSTGRES_PASSWORD=your_local_pass # Your local PostgreSQL password
DB_DIALECT=postgres
DB_TIMEZONE=+00:00
```

#### For Production (`.env.production`)

```bash
# Database Configuration (PostgreSQL) - Production
POSTGRES_HOST=your-prod-db-host.com
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_production
POSTGRES_USER=healthapp_prod_user
POSTGRES_PASSWORD=Ultra_Secure_Prod_Pass_2024#@!
DB_DIALECT=postgres
DB_TIMEZONE=+00:00

# Production should NEVER use POSTGRES_HOST_AUTH_METHOD=trust
```

### 🗄️ Redis Configuration

#### For Docker Development

```bash
# Redis Configuration - Docker
REDIS_HOST=redis                   # Docker service name
REDIS_PORT=6379                   # Standard Redis port
REDIS_PASSWORD=Redis_Dev_2024!    # Optional password
REDIS_URL=redis://redis:6379      # Full connection URL
```

#### For Local Development

```bash
# Redis Configuration - Local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://localhost:6379
```

### 🌐 Application Settings

```bash
# Application Configuration
NODE_ENV=development               # or 'production'
PORT=3001                         # Backend port
FRONTEND_URL=http://localhost:3000 # Frontend URL for CORS

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001  # Frontend API endpoint
API_PREFIX=/api                           # API route prefix
MOBILE_API_PREFIX=/m-api                  # Mobile API prefix

# Logging
LOG_LEVEL=debug                   # development: debug, production: info
DEBUG=healthapp:*                 # Debug namespace
```

## 🔧 External Services Configuration

### ☁️ AWS S3 (File Uploads)

**How to get AWS credentials:**

1. **Sign up for AWS Account**
   - Go to [https://aws.amazon.com](https://aws.amazon.com)
   - Create account or sign in

2. **Create IAM User**
   - Go to IAM → Users → Create User
   - Name: `healthapp-s3-user`
   - Attach policy: `AmazonS3FullAccess`

3. **Generate Access Keys**
   - Select user → Security credentials → Create access key
   - Choose "Application running outside AWS"
   - Save the Access Key ID and Secret Access Key

4. **Create S3 Bucket**
   - Go to S3 → Create bucket
   - Name: `healthapp-dev-files` (for development)
   - Region: Choose closest to your users
   - Enable versioning and encryption

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...                    # From IAM user
AWS_SECRET_ACCESS_KEY=xyz123...              # From IAM user  
AWS_REGION=us-east-1                         # Your chosen region
AWS_S3_BUCKET=healthapp-dev-files           # Your bucket name
AWS_S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

### 📧 Email Service (SMTP)

#### **Option 1: Gmail (Development)**

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

```bash
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password        # App password, not regular password
EMAIL_FROM="Healthcare App <your-email@gmail.com>"
```

#### **Option 2: SendGrid (Production)**

1. Sign up at [https://sendgrid.com](https://sendgrid.com)
2. Create API Key: Settings → API Keys → Create API Key
3. Verify domain: Settings → Sender Authentication

```bash
# SendGrid Configuration
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xyz123...               # From SendGrid dashboard
EMAIL_FROM="Healthcare App <noreply@yourdomain.com>"
```

### 🔔 Push Notifications (Optional)

**Firebase Cloud Messaging:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project or select existing
3. Project Settings → Service accounts → Generate private key

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
```

### 📊 Monitoring (Optional)

```bash
# Application Performance Monitoring
SENTRY_DSN=https://xyz@o123.ingest.sentry.io/456   # From Sentry.io

# Prometheus Metrics
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Health Check
HEALTH_CHECK_INTERVAL=30000      # 30 seconds
```

## 🐘 Database Setup

### Option 1: Docker Setup (Recommended)

The deployment script handles database setup automatically. Just ensure your `.env.development` has the correct values:

```bash
# .env.development
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_dev
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=Dev_Pass_2024!
```

### Option 2: Local PostgreSQL Setup

If running PostgreSQL locally (without Docker):

```bash
# 1. Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows: Download from https://www.postgresql.org/download/

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

# 4. Update .env.local with your local settings
```

## 🚀 Deployment

### Development Deployment (Docker)

**Single Command Setup:**

```bash
# Make script executable
chmod +x scripts/deploy-dev.sh

# Deploy everything
./scripts/deploy-dev.sh
```

**What the script does:**

1. ✅ **Environment Check**: Verifies Docker is running
2. ✅ **Directory Setup**: Creates necessary folders
3. ✅ **Image Building**: Builds Docker images
4. ✅ **Service Startup**: Starts all containers
5. ✅ **Database Migration**: Runs all database migrations
6. ✅ **Database Seeding**: Populates initial data
7. ✅ **Health Checks**: Verifies all services are running

**Manual Step-by-Step (if script fails):**

```bash
# 1. Build and start containers
docker-compose -f docker/docker-compose.dev.yml up -d --build

# 2. Wait for database to be ready
docker-compose -f docker/docker-compose.dev.yml exec postgres pg_isready -U healthapp_user

# 3. Run migrations  
docker-compose -f docker/docker-compose.dev.yml exec backend npm run migrate

# 4. Seed database
docker-compose -f docker/docker-compose.dev.yml exec backend npm run seed

# 5. Check all services
docker-compose -f docker/docker-compose.dev.yml ps
```

### Local Development (No Docker)

```bash
# 1. Set up local database (see Database Setup section)

# 2. Install dependencies
npm install

# 3. Run migrations
npm run migrate

# 4. Seed database  
npm run seed

# 5. Start backend
npm run backend:dev

# 6. In another terminal, start frontend
npm run dev
```

## ✅ Post-Deployment Verification

### Service Health Checks

```bash
# Check all containers are running
docker-compose -f docker/docker-compose.dev.yml ps

# Expected output:
#   healthapp-frontend-dev    Up    3002->3000/tcp
#   healthapp-backend-dev     Up    3001->3001/tcp  
#   healthapp-postgres-dev    Up    5433->5432/tcp
#   healthapp-redis-dev       Up    6379->6379/tcp
#   healthapp-pgadmin-dev     Up    5050->80/tcp
```

### Application Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | [http://localhost:3002](http://localhost:3002) | Create account via UI |
| **Backend API** | [http://localhost:3001/api(http://localhost:3001/api)] | API endpoints |
| **pgAdmin** | [http://localhost:5050](http://localhost:5050) | admin @healthapp.com / admin123 |
| **API Docs** | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) | Auto-generated docs |

### Database Connection Test

```bash
# Test database connection
docker-compose -f docker/docker-compose.dev.yml exec backend node -e "
const { testConnection } = require('./src/config/database.js');
testConnection().then(() => console.log('✅ Database connected')).catch(console.error);
"
```

### API Health Check

```bash
# Test backend API
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z","uptime":"00:05:23"}
```

### Frontend Test

```bash
# Test frontend
curl -I http://localhost:3002

# Expected: HTTP/1.1 200 OK
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find what's using the port
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# Or change port in docker-compose.dev.yml
ports:
  - "3002:3000"  # Changed from 3000:3000
```

#### 2. Database Connection Failed

**Error:** `ECONNREFUSED ::1:5432`

**Solutions:**

```bash
# Check if PostgreSQL container is running
docker-compose -f docker/docker-compose.dev.yml ps postgres

# View PostgreSQL logs
docker-compose -f docker/docker-compose.dev.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker/docker-compose.dev.yml restart postgres

# Verify environment variables match
docker-compose -f docker/docker-compose.dev.yml exec backend env | grep POSTGRES
```

#### 3. Migration Errors

**Error:** `Migration failed`

**Solutions:**

```bash
# Reset database (DEVELOPMENT ONLY!)
docker-compose -f docker/docker-compose.dev.yml down -v
docker-compose -f docker/docker-compose.dev.yml up -d
./scripts/deploy-dev.sh

# Manual migration reset
docker-compose -f docker/docker-compose.dev.yml exec backend npm run migrate:undo:all
docker-compose -f docker/docker-compose.dev.yml exec backend npm run migrate
docker-compose -f docker/docker-compose.dev.yml exec backend npm run seed
```

#### 4. Frontend Build Errors

**Error:** `Module not found` or build failures

**Solutions:**

```bash
# Clear Node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild Docker image
docker-compose -f docker/docker-compose.dev.yml build --no-cache frontend
```

### Service-Specific Logs

```bash
# View specific service logs
docker-compose -f docker/docker-compose.dev.yml logs frontend
docker-compose -f docker/docker-compose.dev.yml logs backend  
docker-compose -f docker/docker-compose.dev.yml logs postgres
docker-compose -f docker/docker-compose.dev.yml logs redis

# Follow logs in real-time
docker-compose -f docker/docker-compose.dev.yml logs -f backend
```

### Complete Reset

If everything fails, reset completely:

```bash
# Stop and remove everything
docker-compose -f docker/docker-compose.dev.yml down -v --remove-orphans

# Remove images
docker image rm $(docker images "docker_*" -q)

# Clean system
docker system prune -f

# Start fresh
./scripts/deploy-dev.sh
```

## 🚀 Production Deployment

### Environment Setup

#### **Create production environment file:**

```bash
# .env.production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database - Use managed PostgreSQL service
POSTGRES_HOST=your-prod-database.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_production
POSTGRES_USER=healthapp_prod
POSTGRES_PASSWORD=ultra-secure-production-password

# Redis - Use managed Redis service  
REDIS_HOST=your-prod-redis.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=redis-production-password

# Security
JWT_SECRET=your-production-jwt-secret-256-bits-minimum
BCRYPT_ROUNDS=12

# External services with production credentials
AWS_ACCESS_KEY_ID=production-aws-key
AWS_SECRET_ACCESS_KEY=production-aws-secret
AWS_S3_BUCKET=healthapp-production-files

# Monitoring
SENTRY_DSN=https://your-production-sentry-dsn
LOG_LEVEL=info
```

#### **Production deployment:**

```bash
# Deploy to production
./scripts/deploy-prod.sh

# Or manually:
docker-compose -f docker/docker-compose.prod.yml up -d --build
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

## 📚 Additional Resources

### Useful Commands

```bash
# Database operations
npm run migrate              # Run pending migrations
npm run migrate:undo         # Undo last migration
npm run seed                # Seed database with initial data
npm run seed:undo           # Undo all seeds

# Development
npm run dev                 # Start frontend development
npm run backend:dev         # Start backend development  
npm run lint                # Run linter
npm run test                # Run tests

# Docker operations
docker-compose -f docker/docker-compose.dev.yml up -d     # Start services
docker-compose -f docker/docker-compose.dev.yml down      # Stop services
docker-compose -f docker/docker-compose.dev.yml restart   # Restart services
docker-compose -f docker/docker-compose.dev.yml logs -f   # View logs
```

### File Structure Reference

```text
healthapp-nextjs/
├── 📁 src/                     # Backend source code
│   ├── 📁 config/             # Configuration files
│   ├── 📁 controllers/        # Route controllers
│   ├── 📁 models/             # Database models  
│   ├── 📁 routes/             # API routes
│   ├── 📁 services/           # Business logic
│   ├── 📁 middleware/         # Express middleware
│   ├── 📁 migrations/         # Database migrations
│   ├── 📁 seeders/           # Database seeders
│   └── server.js             # Main server file
├── 📁 app/                    # Frontend (Next.js)
├── 📁 components/             # React components
├── 📁 docker/                 # Docker configurations
├── 📁 scripts/               # Deployment scripts
├── 📁 docs/                  # Documentation
├── .env.development          # Development environment
├── .env.production          # Production environment
├── .env.local              # Local development
├── package.json            # Dependencies
└── README.md              # Project overview
```

---

## 🎯 Quick Start Summary

For those who want to get started immediately:

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

**That's it!** The `deploy-dev.sh` script handles migrations, seeding, and everything else automatically.

---

## 💡 Support

If you encounter issues:

1. **Check logs:** `docker-compose -f docker/docker-compose.dev.yml logs [service]`
2. **Reset environment:** `./scripts/reset-dev.sh`
3. **Review this guide:** Most issues are covered in the troubleshooting section
4. **Create an issue:** Document the error and steps to reproduce

---

## *Last updated: July 2025*
