#!/bin/bash

# Production Backup Script for Healthcare Application
set -e

echo "💾 Starting Healthcare Application Production Backup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"/backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="healthapp_backup_${TIMESTAMP}"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Source environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
else
    print_error ".env.production file not found"
    exit 1
fi

print_header "1. Preparing backup environment..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

print_header "2. Backing up database..."

# Database backup
print_status "Creating database dump..."
docker exec $(docker ps -q -f name=healthapp_postgres) pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --verbose \
    --clean \
    --no-acl \
    --no-owner \
    > "$BACKUP_DIR/$BACKUP_NAME/database.sql"

if [ $? -eq 0 ]; then
    print_status "Database backup completed ✓"
else
    print_error "Database backup failed ✗"
    exit 1
fi

print_header "3. Backing up Redis data..."

# Redis backup
print_status "Creating Redis dump..."
docker exec $(docker ps -q -f name=healthapp_redis) redis-cli \
    --rdb /data/dump_${TIMESTAMP}.rdb \
    BGSAVE

# Wait for background save to complete
sleep 5

# Copy Redis dump
docker cp $(docker ps -q -f name=healthapp_redis):/data/dump_${TIMESTAMP}.rdb \
    "$BACKUP_DIR/$BACKUP_NAME/redis.rdb"

if [ $? -eq 0 ]; then
    print_status "Redis backup completed ✓"
else
    print_warning "Redis backup failed (non-critical) ⚠️"
fi

print_header "4. Backing up application logs..."

# Application logs
print_status "Backing up application logs..."
docker service logs healthapp_backend > "$BACKUP_DIR/$BACKUP_NAME/backend.log" 2>&1 || true
docker service logs healthapp_frontend > "$BACKUP_DIR/$BACKUP_NAME/frontend.log" 2>&1 || true
docker service logs healthapp_nginx > "$BACKUP_DIR/$BACKUP_NAME/nginx.log" 2>&1 || true

print_header "5. Backing up configuration files..."

# Configuration backup
print_status "Backing up configuration files..."
cp -r nginx/ "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
cp -r monitoring/ "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
cp docker/docker-stack.yml "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
cp .env.production "$BACKUP_DIR/$BACKUP_NAME/env.production.backup" 2>/dev/null || true

print_header "6. Creating compressed archive..."

# Create compressed backup
print_status "Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    print_status "Backup compression completed ✓"
    # Remove uncompressed directory
    rm -rf "$BACKUP_NAME"
else
    print_error "Backup compression failed ✗"
    exit 1
fi

print_header "7. Uploading to cloud storage..."

# Upload to AWS S3 if configured
if [ -n "$AWS_S3_BACKUP_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    print_status "Uploading backup to S3..."
    docker run --rm \
        -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
        -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
        -e AWS_DEFAULT_REGION="$AWS_REGION" \
        -v "$BACKUP_DIR:/backups" \
        amazon/aws-cli s3 cp \
        "/backups/${BACKUP_NAME}.tar.gz" \
        "s3://$AWS_S3_BACKUP_BUCKET/healthapp-backups/${BACKUP_NAME}.tar.gz"
    
    if [ $? -eq 0 ]; then
        print_status "Cloud upload completed ✓"
    else
        print_warning "Cloud upload failed ⚠️"
    fi
else
    print_warning "AWS S3 backup not configured, skipping cloud upload"
fi

print_header "8. Cleaning up old backups..."

# Clean up old local backups
find "$BACKUP_DIR" -name "healthapp_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
print_status "Cleaned up backups older than $RETENTION_DAYS days"

# Clean up old S3 backups if configured
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
    cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    docker run --rm \
        -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
        -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
        -e AWS_DEFAULT_REGION="$AWS_REGION" \
        amazon/aws-cli s3 ls \
        "s3://$AWS_S3_BACKUP_BUCKET/healthapp-backups/" | \
        awk '{print $4}' | \
        grep "healthapp_backup_" | \
        while read backup_file; do
            backup_date=$(echo $backup_file | sed 's/healthapp_backup_\([0-9]*\)_.*/\1/')
            if [ "$backup_date" -lt "$cutoff_date" ]; then
                docker run --rm \
                    -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
                    -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
                    -e AWS_DEFAULT_REGION="$AWS_REGION" \
                    amazon/aws-cli s3 rm \
                    "s3://$AWS_S3_BACKUP_BUCKET/healthapp-backups/$backup_file"
                print_status "Deleted old S3 backup: $backup_file"
            fi
        done
fi

print_header "✅ Backup completed successfully!"

# Backup information
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo "📊 Backup Summary:"
echo "   Backup Name: ${BACKUP_NAME}.tar.gz"
echo "   Backup Size: $BACKUP_SIZE"
echo "   Location:    $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "   Timestamp:   $(date)"
echo ""
echo "📋 Backup Contents:"
echo "   ✓ PostgreSQL database dump"
echo "   ✓ Redis data snapshot"
echo "   ✓ Application logs"
echo "   ✓ Configuration files"
echo ""
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
echo "☁️  Cloud Storage: s3://$AWS_S3_BACKUP_BUCKET/healthapp-backups/${BACKUP_NAME}.tar.gz"
echo ""
fi
print_status "Backup retention: $RETENTION_DAYS days"
echo ""