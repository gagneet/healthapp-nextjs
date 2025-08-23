#!/bin/bash

# Debug script for current deployment issues
# Run this to diagnose your current deployment state

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STACK_NAME="healthapp-test"  # Adjust if your stack name is different

echo -e "${BLUE}=== Debugging HealthApp Deployment ===${NC}"
echo "Stack: $STACK_NAME"
echo ""

# 1. Check if Docker Swarm is active
echo -e "${BLUE}1. Checking Docker Swarm status...${NC}"
if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
    echo -e "${GREEN}✅ Docker Swarm is active${NC}"
else
    echo -e "${RED}❌ Docker Swarm is not active${NC}"
    exit 1
fi

# 2. Check stack status
echo -e "${BLUE}2. Checking stack status...${NC}"
if docker stack ls --format "table {{.Name}}" | grep -q "^$STACK_NAME$"; then
    echo -e "${GREEN}✅ Stack $STACK_NAME exists${NC}"
    echo "Stack services:"
    docker stack services "$STACK_NAME" --format "table {{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}"
else
    echo -e "${RED}❌ Stack $STACK_NAME does not exist${NC}"
    exit 1
fi

# 3. Check individual service status
echo -e "${BLUE}3. Checking individual services...${NC}"
for service in postgres redis app pgadmin; do
    echo -n "  - $service: "
    if docker service ls --filter "name=${STACK_NAME}_${service}" --format "{{.Name}}" | grep -q "^${STACK_NAME}_${service}$"; then
        local replicas=$(docker service ls --filter "name=${STACK_NAME}_${service}" --format "{{.Replicas}}")
        echo -e "${GREEN}Running ($replicas)${NC}"
    else
        echo -e "${RED}Not found${NC}"
    fi
done

# 4. Check container status
echo -e "${BLUE}4. Checking running containers...${NC}"
echo "Containers for $STACK_NAME:"
docker ps --filter "name=${STACK_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"

# 5. Find app container and check environment
echo -e "${BLUE}5. Checking app container environment...${NC}"
APP_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)

if [ -z "$APP_CONTAINER" ]; then
    APP_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
fi

if [ -z "$APP_CONTAINER" ]; then
    APP_CONTAINER=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
fi

if [ -n "$APP_CONTAINER" ]; then
    echo -e "${GREEN}✅ Found app container: $APP_CONTAINER${NC}"
    
    echo "  Environment variables:"
    docker exec "$APP_CONTAINER" sh -c 'env | grep -E "(DATABASE|POSTGRES|NODE_ENV|NEXTAUTH)" | head -10' || echo -e "${RED}    Cannot access environment${NC}"
    
    echo "  DATABASE_URL format check:"
    docker exec "$APP_CONTAINER" sh -c 'echo "DATABASE_URL: ${DATABASE_URL:0:50}..."' || echo -e "${RED}    Cannot access DATABASE_URL${NC}"
    
    echo "  Working directory and files:"
    docker exec "$APP_CONTAINER" sh -c 'echo "PWD: $(pwd)" && ls -la | head -5' || echo -e "${RED}    Cannot access filesystem${NC}"
    
    echo "  Prisma files check:"
    docker exec "$APP_CONTAINER" sh -c 'ls -la prisma/ 2>/dev/null | head -5 || echo "No prisma directory"'
    docker exec "$APP_CONTAINER" sh -c 'ls -la node_modules/.prisma/client/ 2>/dev/null | head -3 || echo "No Prisma client generated"'
    
else
    echo -e "${RED}❌ No app container found${NC}"
fi

# 6. Test database connectivity
echo -e "${BLUE}6. Testing database connectivity...${NC}"
if [ -n "$APP_CONTAINER" ]; then
    echo "  Testing from app container:"
    if docker exec "$APP_CONTAINER" sh -c 'echo "SELECT version();" | psql "${DATABASE_URL}"' 2>/dev/null; then
        echo -e "${GREEN}✅ Database is accessible from app container${NC}"
    else
        echo -e "${RED}❌ Cannot connect to database from app container${NC}"
        
        echo "  Network connectivity test:"
        docker exec "$APP_CONTAINER" sh -c 'nc -zv postgres 5432' || echo -e "${RED}    Cannot reach postgres:5432${NC}"
        
        echo "  DNS resolution test:"
        docker exec "$APP_CONTAINER" sh -c 'nslookup postgres' || echo -e "${RED}    Cannot resolve postgres hostname${NC}"
    fi
fi

# 7. Check PostgreSQL container directly
echo -e "${BLUE}7. Checking PostgreSQL container...${NC}"
PG_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -1)

if [ -z "$PG_CONTAINER" ]; then
    PG_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -1)
fi

if [ -z "$PG_CONTAINER" ]; then
    PG_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)
fi

if [ -n "$PG_CONTAINER" ]; then
    echo -e "${GREEN}✅ Found PostgreSQL container: $PG_CONTAINER${NC}"
    
    echo "  PostgreSQL readiness check:"
    if docker exec "$PG_CONTAINER" pg_isready -U healthapp_user -d healthapp_test 2>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    fi
    
    echo "  PostgreSQL version:"
    docker exec "$PG_CONTAINER" psql -U healthapp_user -d healthapp_test -c "SELECT version();" 2>/dev/null || echo -e "${RED}    Cannot query PostgreSQL${NC}"
    
    echo "  Database tables:"
    docker exec "$PG_CONTAINER" psql -U healthapp_user -d healthapp_test -c "\dt" 2>/dev/null || echo -e "${RED}    Cannot list tables${NC}"
    
else
    echo -e "${RED}❌ No PostgreSQL container found${NC}"
fi

# 8. Show recent logs
echo -e "${BLUE}8. Recent service logs...${NC}"
for service in postgres app; do
    echo "  $service logs (last 20 lines):"
    docker service logs --tail 20 "${STACK_NAME}_${service}" 2>/dev/null | head -20 || echo -e "${RED}    Cannot retrieve logs for $service${NC}"
    echo ""
done

# 9. Test migration manually
echo -e "${BLUE}9. Manual migration test...${NC}"
if [ -n "$APP_CONTAINER" ]; then
    echo "Attempting manual migration:"
    docker exec "$APP_CONTAINER" sh -c '
        echo "=== Migration Test ==="
        echo "Checking Prisma installation:"
        which prisma || echo "Prisma binary not found in PATH"
        npx prisma --version 2>/dev/null || echo "Cannot run Prisma"
        
        echo "Checking migration files:"
        ls -la prisma/migrations/ 2>/dev/null | head -5 || echo "No migration files"
        
        echo "Testing migration status:"
        npx prisma migrate status 2>&1 | head -10
        
        echo "=== End Migration Test ==="
    ' || echo -e "${RED}Cannot run migration test${NC}"
fi

echo -e "${BLUE}=== Debug Complete ===${NC}"
echo ""
echo -e "${YELLOW}Common Issues and Solutions:${NC}"
echo "1. If DATABASE_URL is not set: Check your .env file"
echo "2. If Prisma client is missing: Run 'npx prisma generate' in container"
echo "3. If database is not accessible: Check network connectivity and credentials"
echo "4. If migration files are missing: Ensure they're copied to container during build"
echo "5. If containers keep restarting: Check service logs for startup errors"
