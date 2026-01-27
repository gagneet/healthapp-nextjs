# Production Deployment Guide

## Quick Start

### Standard Production Deployment

```bash
# Clean build and deploy with migrations
./scripts/deploy-production.sh
```

### Common Deployment Scenarios

```bash
# Deploy with database seeding (first-time setup)
./scripts/deploy-production.sh --seed

# Fast deployment without clean build
./scripts/deploy-production.sh --no-clean

# Deploy without migrations (just app update)
./scripts/deploy-production.sh --no-migrate

# CI/CD automated deployment (skip prompts)
./scripts/deploy-production.sh --auto-yes

# Complete fresh start (⚠️ DELETES ALL DATA)
./scripts/deploy-production.sh --cleanup-volumes
```

## Deployment Script Options

| Option | Description |
|--------|-------------|
| `--no-clean` | Skip clean build, use existing artifacts (faster) |
| `--cleanup-volumes` | ⚠️ DANGER: Delete all data volumes |
| `--no-migrate` | Skip database migrations |
| `--seed` | Run database seeders after deployment |
| `--skip-tests` | Skip validation tests before deployment |
| `--no-schema-check` | Skip Prisma schema drift detection (not recommended) |
| `--create-migration` | Create new migration if schema changes detected |
| `--migration-name NAME` | Name for new migration (requires `--create-migration`) |
| `--auto-yes` | Skip all confirmation prompts (for CI/CD) |
| `--debug` | Enable debug output |
| `--help` | Show help message |

## Deployment Process

The `deploy-production.sh` script performs the following steps:

1. **Prerequisites Check**
   - Validates Docker, Docker Swarm, Node.js, npm
   - Checks for required `.env` file
   - Validates critical environment variables

2. **Cleanup** (if needed)
   - Removes existing stack
   - Cleans up volumes (optional, dangerous)
   - Removes dangling Docker resources

3. **Clean Build** (if enabled)
   - Removes `.next` build directory
   - Cleans compiled TypeScript files
   - Removes Prisma generated client
   - Installs fresh dependencies
   - Generates Prisma client
   - **✨ NEW: Schema Validation**
     - Validates Prisma schema syntax
     - Checks schema formatting
     - Detects schema drift (changes not in migrations)
     - Creates new migrations if requested
     - Shows schema diff for review
   - Runs linting and type checking

4. **Docker Build**
   - Pulls latest base images
   - Builds production application image
   - Tags with timestamp for backup

5. **Deployment**
   - Deploys stack to Docker Swarm
   - Waits for services to start
   - Validates service health

6. **Post-Deployment**
   - Runs database migrations
   - Seeds database (optional)
   - Verifies deployment
   - Displays access URLs

## Environment Requirements

### Required Environment Variables

Ensure your `.env` file contains:

```bash
# Authentication
NEXTAUTH_SECRET=your_secure_secret_here
AUTH_SECRET=your_secure_secret_here

# Database
POSTGRES_HOST=/var/run/postgresql
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_prod
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=secure_pg_password
DATABASE_URL="postgresql://healthapp_user:secure_pg_password@localhost:5432/healthapp_prod"

# Application
DOMAIN=healthapp.gagneet.com
PORT=3002
NODE_ENV=production
FRONTEND_URL=http://healthapp.gagneet.com:3002
BACKEND_URL=http://healthapp.gagneet.com:3002
NEXT_PUBLIC_API_URL=http://healthapp.gagneet.com:3002/api

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Optional but recommended
REPLICAS=2  # Number of app containers
```

## Schema Management & Migrations

### Automatic Schema Validation

The deployment script **automatically checks** for Prisma schema changes:

✅ **What it does:**
- Validates schema syntax with `npx prisma validate`
- Checks schema formatting with `npx prisma format --check`
- Detects schema drift (changes not reflected in migrations)
- Compares schema.prisma against database state
- Shows detailed diff of changes

⚠️ **If schema changes are detected:**
1. **Without `--create-migration`**: Deployment will **stop** and show error
2. **With `--create-migration`**: Creates migration automatically

### Creating Migrations During Deployment

```bash
# Detected schema changes - create migration automatically
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "add_patient_insurance_fields"

# This will:
# 1. Detect schema changes
# 2. Generate SQL migration file
# 3. Apply migration to database
# 4. Show the generated SQL
# 5. Remind you to commit migration files
```

### Handling Schema Changes

**Recommended Workflow:**

1. **Development Environment:**
   ```bash
   # Make changes to prisma/schema.prisma
   # Create migration locally
   npx prisma migrate dev --name "your_migration_name"

   # Commit migration files
   git add prisma/migrations
   git commit -m "Add migration: your_migration_name"
   git push
   ```

2. **Production Deployment:**
   ```bash
   # Deploy with existing migrations
   ./scripts/deploy-production.sh
   # Script will detect and apply new migrations automatically
   ```

**Alternative (Direct Production):**
```bash
# Create migration during production deployment (use with caution)
./scripts/deploy-production.sh \
  --create-migration \
  --migration-name "add_new_fields"
```

### Schema Drift Detection

The script checks for:
- ✅ **In Sync**: Schema matches database - deployment proceeds
- ⚠️ **Pending Migrations**: Migrations exist but not applied - will apply during deployment
- ❌ **Schema Drift**: Schema has changes without migrations - deployment stops

**What happens on drift:**
```
⚠️  SCHEMA DRIFT DETECTED!
Your schema.prisma has changes not reflected in migrations

Schema changes detected:
[SQL diff showing changes]

Options:
  1. Run with --create-migration --migration-name "description"
  2. Create migration manually: npx prisma migrate dev --name <name>
  3. Use --no-schema-check to skip (NOT RECOMMENDED)
```

### Skip Schema Validation (Not Recommended)

```bash
# Only use if you know what you're doing
./scripts/deploy-production.sh --no-schema-check
```

## Prerequisites

1. **Docker & Docker Swarm**
   ```bash
   # Initialize Docker Swarm (if not already done)
   docker swarm init
   ```

2. **Environment File**
   - Copy `.env.example` to `.env`
   - Update all values for production

3. **Required Ports**
   - 3002: Application (Frontend/Backend)
   - 5432: PostgreSQL
   - 6379: Redis
   - 8084: PgAdmin (optional)

## Post-Deployment Management

### View Service Status

```bash
# View all services in stack
docker stack services healthapp-prod

# View detailed task status
docker stack ps healthapp-prod

# View service logs
docker service logs -f healthapp-prod_app
docker service logs -f healthapp-prod_postgres
docker service logs -f healthapp-prod_redis
```

### Scale Application

```bash
# Scale to 4 replicas
docker service scale healthapp-prod_app=4

# Scale back to 2 replicas
docker service scale healthapp-prod_app=2
```

### Update Deployment

```bash
# Quick update without full rebuild
./scripts/deploy-production.sh --no-clean --no-migrate

# Full update with migrations
./scripts/deploy-production.sh
```

### Access Services

```bash
# Application
curl http://healthapp.gagneet.com:3002/api/health

# PgAdmin (web interface)
open http://healthapp.gagneet.com:8084
```

### Stop Deployment

```bash
# Stop and remove stack (keeps data volumes)
docker stack rm healthapp-prod

# Wait for cleanup
sleep 15
```

### Emergency Rollback

```bash
# List available image tags
docker images | grep healthapp

# Deploy previous version
docker tag healthapp:prod-20240127_143022 healthapp:prod
./scripts/deploy-production.sh --no-clean --skip-tests
```

## Troubleshooting

### Services Not Starting

```bash
# Check service logs
docker service logs --tail 100 healthapp-prod_app

# Check task failures
docker stack ps healthapp-prod --no-trunc

# Inspect service
docker service inspect healthapp-prod_app
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker service logs --tail 100 healthapp-prod_postgres

# Test database connectivity
docker exec $(docker ps -q -f name=healthapp-prod_postgres) \
  psql -U healthapp_user -d healthapp_prod -c "SELECT 1;"
```

### Migration Failures

```bash
# Access app container
docker exec -it $(docker ps -q -f name=healthapp-prod_app | head -1) sh

# Inside container
npx prisma migrate deploy
npx prisma migrate status
```

### Disk Space Issues

```bash
# Remove unused Docker resources
docker system prune -a --volumes

# Remove old images
docker images | grep healthapp | grep -v "prod$" | awk '{print $3}' | xargs docker rmi
```

## Alternative: Using Original deploy.sh

The project also includes the comprehensive `scripts/deploy.sh` which supports multiple environments:

```bash
# Production deployment
./scripts/deploy.sh prod deploy --migrate --seed

# With custom domain
./scripts/deploy.sh prod deploy --domain healthapp.com --migrate

# Stop production
./scripts/deploy.sh prod stop

# View status
./scripts/deploy.sh prod status

# View logs
./scripts/deploy.sh prod logs app
```

## Security Considerations

1. **Never commit `.env` files** with real credentials
2. **Use strong passwords** for all services
3. **Enable HTTPS** in production (configure reverse proxy)
4. **Regular backups** of database and volumes
5. **Monitor logs** for security issues
6. **Update dependencies** regularly
7. **Use Docker secrets** for sensitive data in production

## Backup & Recovery

### Backup Database

```bash
# Backup to file
docker exec $(docker ps -q -f name=healthapp-prod_postgres) \
  pg_dump -U healthapp_user healthapp_prod > backup_$(date +%Y%m%d).sql

# Backup with compression
docker exec $(docker ps -q -f name=healthapp-prod_postgres) \
  pg_dump -U healthapp_user healthapp_prod | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
docker exec -i $(docker ps -q -f name=healthapp-prod_postgres) \
  psql -U healthapp_user healthapp_prod < backup_20240127.sql

# Restore from compressed backup
gunzip -c backup_20240127.sql.gz | \
  docker exec -i $(docker ps -q -f name=healthapp-prod_postgres) \
  psql -U healthapp_user healthapp_prod
```

### Backup Volumes

```bash
# Create volume backup
docker run --rm -v healthapp-prod_postgres_data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/postgres_volume_backup.tar.gz /data
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Copy .env
        run: echo "${{ secrets.PRODUCTION_ENV }}" > .env

      - name: Deploy
        run: ./scripts/deploy-production.sh --auto-yes
```

### GitLab CI Example

```yaml
deploy:production:
  stage: deploy
  only:
    - main
  script:
    - echo "$PRODUCTION_ENV" > .env
    - chmod +x scripts/deploy-production.sh
    - ./scripts/deploy-production.sh --auto-yes
```

## Performance Optimization

### Recommended Production Settings

```bash
# .env production settings
NODE_ENV=production
REPLICAS=4  # Adjust based on load
APP_MEMORY_LIMIT=2048M
APP_MEMORY_RESERVATION=1024M
POSTGRES_MEMORY_LIMIT=2048M
POSTGRES_MEMORY_RESERVATION=1024M
REDIS_MEMORY_LIMIT=512M
REDIS_MEMORY_RESERVATION=256M
```

### Monitor Resource Usage

```bash
# View resource usage
docker stats

# Service-specific stats
docker stats $(docker ps -q -f name=healthapp-prod)
```

## Support

For issues or questions:
- Check logs: `docker service logs -f healthapp-prod_app`
- Review documentation: `/docs`
- Open issue: GitHub repository

---

**Last Updated:** 2026-01-27
**Script Version:** deploy-production.sh v1.0
