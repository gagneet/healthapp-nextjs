# HealthApp Docker Deployment Guide

This guide provides comprehensive instructions for deploying the HealthApp Healthcare Management Platform using Docker.

## Overview

The HealthApp is containerized using Docker with the following components:

- **Frontend**: NextJS application (Port 3000/3002)
- **Backend**: Node.js/Express API (Port 3001)
- **Database**: PostgreSQL 15 (Port 5432/5433)
- **Cache**: Redis 7 (Port 6379)
- **Admin**: pgAdmin 4 (Port 5050) - Development only

## Quick Start

### Development Deployment

```bash
# Clone the repository
git clone <repository-url>
cd healthapp-nextjs

# Start development environment
./scripts/deploy.sh development --build --migrate --seed

# Access the application
# Frontend: http://localhost:3002
# Backend API: http://localhost:3001
# pgAdmin: http://localhost:5050
```

### Production Deployment

```bash
# Configure production environment
cp .env.docker.production .env.production.local
# Edit .env.production.local with your secure values

# Deploy to production
./scripts/deploy.sh production --build --migrate

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## Environment Configurations

### Development (.env.docker.development)
- Uses hot-reload for development
- Includes pgAdmin for database management
- Debug logging enabled
- Non-secure default credentials

### Production (.env.docker.production)
- Optimized production builds
- Security-focused configuration
- Requires secure credentials
- Monitoring and logging configured

## File Structure

```
healthapp-nextjs/
├── docker/
│   ├── Dockerfile              # Production NextJS frontend
│   ├── Dockerfile.dev          # Development NextJS frontend
│   ├── Dockerfile.backend      # Production Node.js backend
│   ├── docker-compose.dev.yml  # Development compose (legacy)
│   ├── docker-compose.prod.yml # Production compose (legacy)
│   └── docker-stack.yml        # Docker Swarm production
├── scripts/
│   ├── deploy.sh              # Unified deployment script
│   └── docker-cleanup.sh      # Cleanup script
├── docker-compose.yml         # Unified compose file
├── .env.docker.development    # Development environment
├── .env.docker.production     # Production environment template
└── DOCKER_README.md          # This file
```

## Deployment Scripts

### deploy.sh

Main deployment script with support for different environments:

```bash
./scripts/deploy.sh [environment] [options]

# Environments:
#   development (default)
#   production
#   staging

# Options:
#   --build     Force rebuild images
#   --migrate   Run database migrations
#   --seed      Run database seeders
#   --help      Show help
```

Examples:
```bash
# Development with fresh build and data
./scripts/deploy.sh development --build --migrate --seed

# Production deployment
./scripts/deploy.sh production --build --migrate

# Quick restart without rebuild
./scripts/deploy.sh development
```

### docker-cleanup.sh

Cleanup script for removing containers, images, and volumes:

```bash
./scripts/docker-cleanup.sh [options]

# Options:
#   --full      Complete cleanup (WARNING: Data loss!)
#   --volumes   Remove persistent volumes (WARNING: Data loss!)
#   --images    Remove HealthApp images
#   --help      Show help
```

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| DB_PASSWORD | PostgreSQL password | `secure_db_password_2024` |
| JWT_SECRET | JWT signing secret | `your-256-bit-secret` |
| STRIPE_SECRET_KEY | Stripe secret key | `sk_live_...` |
| AWS_ACCESS_KEY_ID | AWS access key | `AKIA...` |
| AWS_SECRET_ACCESS_KEY | AWS secret key | `...` |

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| FRONTEND_PORT | Frontend port | `3002` (dev), `3000` (prod) |
| BACKEND_PORT | Backend port | `3001` |
| DB_PORT | Database port | `5433` (dev), `5432` (prod) |
| LOG_LEVEL | Logging level | `debug` (dev), `info` (prod) |

## Service Management

### Starting Services

```bash
# Development
docker-compose --env-file .env.docker.development up -d

# Production
docker-compose --env-file .env.docker.production up -d
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Management

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Run seeders
docker-compose exec backend npm run seed

# Access database directly
docker-compose exec postgres psql -U healthapp_user -d healthapp_dev
```

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Check specific service
docker inspect healthapp-backend --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3001
   
   # Change port in environment file
   BACKEND_PORT=3002
   ```

2. **Database Connection Issues**
   ```bash
   # Check database is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   
   # Fix script permissions
   chmod +x scripts/*.sh
   ```

4. **Out of Disk Space**
   ```bash
   # Clean up Docker
   ./scripts/docker-cleanup.sh --full
   
   # Or manual cleanup
   docker system prune -f --volumes
   ```

### Service-Specific Issues

#### Frontend Build Failures
```bash
# Check build logs
docker-compose logs frontend

# Rebuild with no cache
docker-compose build --no-cache frontend
```

#### Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env | grep -E "(DB|JWT|NODE)"
```

#### Database Issues
```bash
# Reset database (WARNING: Data loss!)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run migrate
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (256-bit)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up proper firewall rules
- [ ] Enable database encryption
- [ ] Configure secure headers
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

### Network Security

```bash
# Production network isolation
docker network create --driver overlay --encrypted healthapp-prod

# Firewall configuration (example)
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3001/tcp  # Block direct API access
```

## Monitoring and Logging

### Log Management

```bash
# Configure log rotation
docker-compose logs --tail=1000 backend > logs/backend-$(date +%Y%m%d).log

# Centralized logging with ELK stack (advanced)
# See docker-stack.yml for Elasticsearch configuration
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check container health
docker-compose ps
watch docker-compose ps
```

## Scaling and High Availability

### Docker Swarm (Production)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker/docker-stack.yml healthapp

# Scale services
docker service scale healthapp_backend=3
docker service scale healthapp_frontend=2
```

### Load Balancing

The production stack includes NGINX for load balancing and SSL termination.

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U healthapp_user healthapp_prod > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U healthapp_user healthapp_prod < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v healthapp_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volumes
docker run --rm -v healthapp_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz
```

## Migration from Legacy Setup

If migrating from the old Docker setup:

1. Stop old containers: `docker-compose -f docker/docker-compose.dev.yml down`
2. Backup data: Follow backup procedures above
3. Deploy new setup: `./scripts/deploy.sh development --build`
4. Restore data if needed

## Support

For additional help:

1. Check service logs: `docker-compose logs [service]`
2. Review environment configuration
3. Verify network connectivity
4. Check resource availability (disk, memory)
5. Consult application documentation

## Quick Reference

```bash
# Start development
./scripts/deploy.sh development --build --migrate --seed

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Complete cleanup (data loss!)
./scripts/docker-cleanup.sh --full

# Production deployment
./scripts/deploy.sh production --build --migrate

# Scale services (swarm mode)
docker service scale healthapp_backend=3
```