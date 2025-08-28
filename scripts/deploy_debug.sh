#!/bin/bash

# Debug script for deployment migration and seeding issues
# Run this after your deployment command fails

STACK_NAME="healthapp-test"  # Adjust based on your environment
ENVIRONMENT="test"

echo "=== DEPLOYMENT DEBUG SCRIPT ==="
echo "Investigating migration and seeding issues..."
echo

# 1. Check if stack is running
echo "1. STACK STATUS:"
echo "----------------------------------------"
docker stack ls | grep "$STACK_NAME" || echo "Stack not found!"
echo

# 2. Check service status
echo "2. SERVICE STATUS:"
echo "----------------------------------------"
docker stack services "$STACK_NAME" 2>/dev/null || echo "No services found!"
echo

# 3. Check running containers
echo "3. RUNNING CONTAINERS:"
echo "----------------------------------------"
echo "Looking for app containers:"
docker ps --filter "name=${STACK_NAME}_app" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
docker ps --filter "name=app" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
echo

echo "Looking for postgres containers:"
docker ps --filter "name=postgres" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
echo

# 4. Find the actual app container (using the same logic as the script)
echo "4. APP CONTAINER IDENTIFICATION:"
echo "----------------------------------------"
APP_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
if [ -z "$APP_CONTAINER" ]; then
    APP_CONTAINER=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
fi

if [ -n "$APP_CONTAINER" ]; then
    echo "Found app container: $APP_CONTAINER"
    echo "Container name: $(docker inspect --format='{{.Name}}' $APP_CONTAINER)"
    echo "Container status: $(docker inspect --format='{{.State.Status}}' $APP_CONTAINER)"
else
    echo "❌ NO APP CONTAINER FOUND - This is likely the main issue!"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.ID}}\t{{.Status}}"
    exit 1
fi
echo

# 5. Check database connectivity from app container
echo "5. DATABASE CONNECTIVITY TEST:"
echo "----------------------------------------"
echo "Testing database connection from app container..."

# Get environment variables from container
echo "Database environment in container:"
docker exec "$APP_CONTAINER" env | grep -E "(DATABASE_URL|POSTGRES_|DB_)" | sed -E 's/(password=)[^&@]*/\1****/g' || echo "Could not read environment"
echo

# Test basic connectivity
echo "Testing network connectivity to postgres:5432..."
docker exec "$APP_CONTAINER" sh -c 'nc -zv postgres 5432' || echo "❌ Network connectivity failed!"
echo

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
docker exec "$APP_CONTAINER" sh -c 'psql "$DATABASE_URL" -c "SELECT version();"' 2>/dev/null && echo "✅ Database connection successful" || echo "❌ Database connection failed"
echo

# 6. Check Prisma configuration
echo "6. PRISMA CONFIGURATION:"
echo "----------------------------------------"
echo "Checking if Prisma is installed in container..."
docker exec "$APP_CONTAINER" which npx || echo "❌ npx not found"
docker exec "$APP_CONTAINER" npx prisma --version 2>/dev/null || echo "❌ Prisma not found"
echo

echo "Checking for prisma directory..."
docker exec "$APP_CONTAINER" ls -la prisma/ || echo "❌ No prisma directory found"
echo

echo "Checking for migration files..."
docker exec "$APP_CONTAINER" find prisma/migrations -type f -name "*.sql" 2>/dev/null | head -5 || echo "❌ No migration files found"
echo

# 7. Check seed files
echo "7. SEED FILE CONFIGURATION:"
echo "----------------------------------------"
echo "Checking for seed files..."
docker exec "$APP_CONTAINER" ls -la lib/seed.* 2>/dev/null || echo "No seed files in lib/"
docker exec "$APP_CONTAINER" ls -la prisma/seed.* 2>/dev/null || echo "No seed files in prisma/"
docker exec "$APP_CONTAINER" ls -la package.json 2>/dev/null && echo "package.json found" || echo "❌ No package.json found"
echo

echo "Checking package.json for prisma seed configuration..."
docker exec "$APP_CONTAINER" grep -A 3 -B 1 '"seed"' package.json 2>/dev/null || echo "No seed configuration in package.json"
echo

# 8. Manual migration test
echo "8. MANUAL MIGRATION TEST:"
echo "----------------------------------------"
echo "Attempting manual migration..."
docker exec "$APP_CONTAINER" sh -c '
echo "Current working directory: $(pwd)"
echo "Contents of current directory:"
ls -la
echo
echo "Attempting Prisma migrate deploy..."
npx prisma migrate deploy 2>&1 || echo "Migration failed"
'
echo

# 9. Manual seeding test
echo "9. MANUAL SEEDING TEST:"
echo "----------------------------------------"
echo "Attempting manual seeding..."
docker exec "$APP_CONTAINER" sh -c '
echo "Attempting Prisma db seed..."
npx prisma db seed 2>&1 || echo "Prisma seed failed, trying manual seed files..."

if [ -f lib/seed.cjs ]; then
    echo "Found lib/seed.cjs, attempting to run..."
    node lib/seed.cjs 2>&1 || echo "lib/seed.cjs failed"
elif [ -f lib/seed.js ]; then
    echo "Found lib/seed.js, attempting to run..."
    node lib/seed.js 2>&1 || echo "lib/seed.js failed"
elif [ -f prisma/seed.js ]; then
    echo "Found prisma/seed.js, attempting to run..."
    node prisma/seed.js 2>&1 || echo "prisma/seed.js failed"
else
    echo "❌ No seed files found"
fi
'
echo

# 10. Check container logs
echo "10. CONTAINER LOGS:"
echo "----------------------------------------"
echo "Recent app container logs:"
docker logs --tail 20 "$APP_CONTAINER" 2>/dev/null || echo "Could not retrieve container logs"
echo

echo "Recent postgres logs:"
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)
if [ -n "$POSTGRES_CONTAINER" ]; then
    docker logs --tail 20 "$POSTGRES_CONTAINER" 2>/dev/null || echo "Could not retrieve postgres logs"
else
    echo "No postgres container found"
fi
echo

echo "=== DEBUG SUMMARY ==="
echo "Run this script and check each section for issues."
echo "Common problems:"
echo "1. App container not found/not running"
echo "2. Database connectivity issues"
echo "3. Missing Prisma configuration"
echo "4. Missing migration or seed files"
echo "5. Environment variable issues"
