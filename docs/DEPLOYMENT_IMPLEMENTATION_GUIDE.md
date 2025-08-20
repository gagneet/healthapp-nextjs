# HealthApp Deployment Implementation Guide

## Overview

This guide provides comprehensive instructions for deploying the HealthApp healthcare application to different environments using the enhanced deployment scripts. The application is built with Next.js 14, PostgreSQL, Redis, and containerized using Docker with orchestrated deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Scripts Overview](#deployment-scripts-overview)
4. [Production Deployment](#production-deployment)
5. [Test Environment Deployment](#test-environment-deployment)
6. [Local Development Deployment](#local-development-deployment)
7. [Database Operations](#database-operations)
8. [SSL and Nginx Configuration](#ssl-and-nginx-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance and Monitoring](#maintenance-and-monitoring)

## Prerequisites

### System Requirements

- **Docker Engine**: 24.0+ with Swarm mode capability
- **Docker Compose**: 2.20+
- **Linux Server**: Ubuntu 20.04+ or CentOS 8+
- **Memory**: Minimum 4GB RAM (8GB recommended for production)
- **Storage**: 50GB+ available disk space
- **Network**: Open ports 80, 443, 3002, 5432, 6379, 5050

### Required Services

- **Nginx**: Web server and reverse proxy
- **Let's Encrypt/Certbot**: SSL certificate management
- **PostgreSQL**: Database server
- **Redis**: Caching and session storage

### Domain Configuration

For production deployment, ensure:
- Domain DNS A record points to server IP
- Subdomain configuration (if using subdomains)
- Firewall allows HTTP/HTTPS traffic

## Environment Setup

### 1. Environment Files

Create environment files for each deployment target:

```bash
# Base configuration
cp env_files/.env.production .env

# Environment-specific configurations
cp env_files/.env.production .env.prod
cp env_files/.env.test .env.test
cp env_files/.env.local .env.local
```

### 2. Required Environment Variables

#### Core Application Settings
```bash
# Application
NODE_ENV=production
DOMAIN=healthapp.gagneet.com
FRONTEND_URL=https://healthapp.gagneet.com
BACKEND_URL=https://healthapp.gagneet.com

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://healthapp.gagneet.com/api
NEXTAUTH_URL=https://healthapp.gagneet.com
NEXTAUTH_SECRET=your-secure-nextauth-secret-here

# Database Configuration
DATABASE_URL=postgresql://healthapp_user:secure_password@postgres:5432/healthapp_prod?schema=public
POSTGRES_DB=healthapp_prod
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# PgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@healthapp.gagneet.com
PGADMIN_DEFAULT_PASSWORD=secure_admin_password
```

### 3. Docker Swarm Initialization

```bash
# Initialize Docker Swarm (if not already done)
docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')

# Verify swarm status
docker node ls
```

## Deployment Scripts Overview

The deployment system consists of several specialized scripts:

### Main Deployment Script
- **`scripts/deploy.sh`** - Universal deployment script with enhanced orchestration
- Supports dev, test, and production environments
- Features strict service startup ordering and health checking
- Enhanced PostgreSQL readiness verification
- Comprehensive error handling and logging

### Environment-Specific Scripts
- **`scripts/deploy-local.sh`** - Local development with Docker Compose
- **`scripts/deploy-dev.sh`** - Development environment deployment
- **`scripts/deploy-test.sh`** - Test environment with comprehensive testing
- **`scripts/deploy-production.sh`** - Production deployment with safety checks

### Maintenance Scripts
- **`scripts/fix-deployment.sh`** - Deployment diagnostics and quick fixes
- **`scripts/setup-nginx.sh`** - Nginx configuration setup
- **`scripts/setup-nginx-ssl.sh`** - SSL certificate management
- **`scripts/troubleshoot.sh`** - Comprehensive troubleshooting
- **`scripts/fix-api-issues.sh`** - API-specific issue resolution

## Production Deployment

### 1. Enhanced Production Deployment

The main deployment script features enhanced orchestration with strict dependency ordering:

```bash
# Full production deployment with all features
./scripts/deploy.sh prod deploy \
    --domain healthapp.gagneet.com \
    --migrate \
    --seed \
    --auto-yes

# Alternative: Use the production-specific script
./scripts/deploy-production.sh deploy \
    --domain healthapp.gagneet.com \
    --migrate \
    --seed \
    --scale 2
```

#### Deployment Phases

The deployment follows a strict orchestration order:

1. **Phase 1**: Pull base images (node:22-alpine, postgres:15-alpine, redis:7-alpine, pgadmin4)
2. **Phase 2**: Build application container
3. **Phase 3**: Deploy Docker stack
4. **Phase 4**: PostgreSQL startup with enhanced readiness verification
5. **Phase 5**: Redis cache startup
6. **Phase 6**: Application containers with health checks
7. **Phase 7**: Database migrations (if --migrate flag)
8. **Phase 8**: Database seeds (if --seed flag)
9. **Phase 9**: PgAdmin interface (non-critical)

### 2. Production Configuration Options

```bash
# Basic production deployment
./scripts/deploy.sh prod deploy --domain yourdomain.com

# Deployment with custom scaling
./scripts/deploy.sh prod deploy \
    --domain yourdomain.com \
    --replicas 3 \
    --migrate \
    --seed

# Skip image pulling for faster deployments
./scripts/deploy.sh prod deploy \
    --domain yourdomain.com \
    --skip-image-pull \
    --auto-yes

# Custom port configuration
./scripts/deploy.sh prod deploy \
    --domain yourdomain.com \
    --port-frontend 8080 \
    --port-db 5433
```

### 3. Production Health Verification

The deployment script includes comprehensive health checks:

- **PostgreSQL**: `pg_isready` verification + actual query execution test
- **Redis**: `redis-cli ping` with authentication support
- **Application**: HTTP health endpoint verification (`/api/health`)
- **PgAdmin**: Container running status verification

### 4. Production Monitoring Commands

```bash
# Check deployment status
./scripts/deploy.sh prod status

# View service logs
./scripts/deploy.sh prod logs app
./scripts/deploy.sh prod logs postgres

# Scale services
./scripts/deploy.sh prod scale --replicas 4

# Run migrations separately
./scripts/deploy.sh prod migrate

# Backup database
./scripts/deploy-production.sh backup
```

## Test Environment Deployment

### 1. Comprehensive Test Deployment

The test environment includes automated testing capabilities:

```bash
# Full test deployment with testing
./scripts/deploy-test.sh deploy \
    --migrate \
    --seed \
    --test \
    --scale-app 2

# Custom test environment
./scripts/deploy-test.sh deploy \
    --domain test.yourdomain.com \
    --port-app 3003 \
    --port-db 5433 \
    --branch feature/new-feature \
    --migrate \
    --seed
```

### 2. Test Environment Features

- **Automated Testing**: Health checks, API endpoint testing, frontend accessibility
- **Load Testing**: Multi-replica support for performance testing
- **Branch Deployment**: Deploy specific git branches for feature testing
- **Test Data**: Automated seeding with test data
- **Monitoring**: Comprehensive status reporting and health monitoring

### 3. Test Commands

```bash
# Run automated tests on existing deployment
./scripts/deploy-test.sh test

# Scale for load testing
./scripts/deploy-test.sh scale --scale-app 5

# Update with new code
./scripts/deploy-test.sh update --branch hotfix/critical-bug

# Clean test environment
./scripts/deploy-test.sh cleanup --auto-yes
```

## Local Development Deployment

### 1. Local Development Setup

```bash
# Start local development environment
./scripts/deploy-local.sh up --migrate --seed

# Development with custom ports
./scripts/deploy-local.sh up \
    --port-frontend 3010 \
    --port-backend 5010 \
    --migrate \
    --seed

# View logs in real-time
./scripts/deploy-local.sh logs frontend

# Stop development environment
./scripts/deploy-local.sh down
```

### 2. Local Development Features

- **Docker Compose**: Simplified local development
- **Hot Reloading**: Code changes reflected immediately
- **Debug Support**: Easy access to logs and debugging
- **Database Management**: Local PostgreSQL with PgAdmin
- **Port Customization**: Avoid conflicts with other services

## Database Operations

### 1. Database Migrations

```bash
# Run migrations on any environment
./scripts/deploy.sh [env] migrate

# Production migration with verification
./scripts/deploy-production.sh migrate

# Check migration status
docker exec $(docker ps --filter "name=healthapp-prod_app" -q | head -1) npx prisma migrate status
```

### 2. Database Seeding

```bash
# Seed database with test data
./scripts/deploy.sh [env] seed

# Production seeding (use with caution)
./scripts/deploy-production.sh seed
```

### 3. Database Backup and Restore

```bash
# Create database backup
./scripts/deploy-production.sh backup

# Manual backup
docker exec $(docker ps --filter "name=healthapp-prod_postgres" -q | head -1) \
    pg_dump -U healthapp_user healthapp_prod > backup_$(date +%Y%m%d).sql
```

## SSL and Nginx Configuration

### 1. Automated Nginx Setup

```bash
# Setup nginx with SSL (requires sudo)
sudo ./scripts/setup-nginx.sh

# Advanced SSL setup with options
sudo ./scripts/setup-nginx-ssl.sh
```

### 2. Manual Nginx Configuration

```bash
# Copy nginx configuration
sudo cp nginx/healthapp.gagneet.com.system.conf /etc/nginx/sites-available/healthapp.gagneet.com

# Enable site
sudo ln -sf /etc/nginx/sites-available/healthapp.gagneet.com /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate Management

```bash
# Obtain Let's Encrypt certificate
sudo certbot --nginx -d healthapp.gagneet.com

# Renew certificates (automated)
sudo systemctl enable certbot-renewal.timer
sudo systemctl start certbot-renewal.timer
```

## Troubleshooting

### 1. Deployment Diagnostics

```bash
# Comprehensive deployment diagnosis
./scripts/fix-deployment.sh

# Environment-specific troubleshooting
./scripts/troubleshoot.sh prod

# API-specific issue diagnosis
./scripts/fix-api-issues.sh
```

### 2. Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database connectivity
docker exec $(docker ps --filter "name=healthapp-prod_postgres" -q | head -1) \
    pg_isready -U healthapp_user -d healthapp_prod

# Test database connection from app
docker exec $(docker ps --filter "name=healthapp-prod_app" -q | head -1) \
    psql "$DATABASE_URL" -c "SELECT 1"
```

#### Application Health Issues
```bash
# Check application health
curl -f http://localhost:3002/api/health

# View application logs
./scripts/deploy.sh prod logs app

# Restart application services
docker service update --force healthapp-prod_app
```

#### SSL/Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check SSL certificate status
sudo certbot certificates

# Reload nginx
sudo systemctl reload nginx
```

### 3. Service Recovery Commands

```bash
# Restart entire stack
./scripts/deploy.sh prod restart

# Force service update
docker service update --force healthapp-prod_app

# Scale down and up (rolling restart)
docker service scale healthapp-prod_app=0
docker service scale healthapp-prod_app=2
```

## Maintenance and Monitoring

### 1. Regular Maintenance Tasks

```bash
# Weekly system cleanup
docker system prune -f
docker image prune -f

# Database backup (daily recommended)
./scripts/deploy-production.sh backup

# Certificate renewal check
sudo certbot renew --dry-run
```

### 2. Monitoring Commands

```bash
# System resource monitoring
docker stats

# Service health monitoring
./scripts/deploy.sh prod status

# Log monitoring
docker service logs -f healthapp-prod_app
```

### 3. Performance Optimization

```bash
# Scale services based on load
./scripts/deploy.sh prod scale --replicas 4

# Monitor database performance
docker exec $(docker ps --filter "name=healthapp-prod_postgres" -q | head -1) \
    psql -U healthapp_user -d healthapp_prod -c "
    SELECT query, calls, total_time, mean_time 
    FROM pg_stat_statements 
    ORDER BY total_time DESC 
    LIMIT 10;"
```

## Security Considerations

### 1. Environment Variables Security

- Store sensitive variables in secure environment files
- Use strong passwords and secrets
- Rotate secrets regularly
- Never commit secrets to version control

### 2. Network Security

```bash
# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. SSL Security

- Use Let's Encrypt for production SSL certificates
- Enable HSTS headers
- Configure proper SSL ciphers and protocols
- Set up automatic certificate renewal

## Backup and Recovery

### 1. Backup Strategy

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
./scripts/deploy-production.sh backup
gzip healthapp_prod_backup_*.sql
mv healthapp_prod_backup_*.sql.gz /backup/daily/
```

### 2. Recovery Procedures

```bash
# Stop application
./scripts/deploy.sh prod stop

# Restore database
docker exec -i $(docker ps --filter "name=healthapp-prod_postgres" -q | head -1) \
    psql -U healthapp_user -d healthapp_prod < backup.sql

# Restart application
./scripts/deploy.sh prod deploy --migrate --auto-yes
```

## Conclusion

This deployment implementation guide provides comprehensive instructions for deploying and maintaining the HealthApp application. The enhanced deployment scripts provide robust orchestration, health checking, and monitoring capabilities to ensure reliable deployments across all environments.

For additional support or questions, refer to:
- **Troubleshooting scripts**: Run diagnostics first
- **Log files**: Always check service logs for detailed error information
- **Health endpoints**: Use `/api/health` for application status verification
- **Documentation**: Review other docs in this folder for specific implementation details

The deployment system is designed for reliability, scalability, and ease of maintenance. Follow the prescribed procedures and always test deployments in test environments before production updates.