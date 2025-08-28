#!/bin/bash

# ============================================================================
# QUICK START - NEXT.JS HEALTHCARE APPLICATION
# ============================================================================
# Rapid local deployment script for pure Next.js architecture
# Run this script to get the healthcare application running quickly
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Next.js Healthcare Application - Quick Start${NC}"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p data/postgres data/redis logs

# Set environment variables
export HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' | head -1 2>/dev/null || echo "localhost")
echo -e "${BLUE}🌐 Using Host IP: $HOST_IP${NC}"

# Check if .env.local exists, if not create one
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local file...${NC}"
    cat > .env.local << EOF
# Next.js Healthcare App - Local Development
NODE_ENV=development
PORT=3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nextjs_healthcare_secret_key_for_development_not_for_production
JWT_SECRET=development_jwt_secret_key_not_for_production_use_only
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5432/healthapp_dev?schema=public"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_dev
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=pg_password
NEXT_PUBLIC_API_URL=http://localhost:3000/api
HOST_IP=$HOST_IP
DEBUG=true
LOG_LEVEL=debug
NEXT_TELEMETRY_DISABLED=1
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
else
    echo -e "${GREEN}✅ Using existing .env.local${NC}"
fi

# Start the application
echo -e "${BLUE}🚀 Starting Next.js Healthcare Application...${NC}"
echo "This will start:"
echo "  - PostgreSQL database (port 5432)"
echo "  - Redis cache (port 6379)" 
echo "  - Next.js app with API routes (port 3000)"
echo "  - PgAdmin database manager (port 5050)"
echo ""

# Use Docker Compose to start services
if [ -f "docker/docker-compose.nextjs-local.yml" ]; then
    echo -e "${BLUE}📦 Using Docker Compose for full stack deployment...${NC}"
    docker-compose -f docker/docker-compose.nextjs-local.yml up -d --build
    
    echo ""
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 30
    
    # Check if services are healthy
    echo -e "${BLUE}🔍 Checking service health...${NC}"
    
    # Check PostgreSQL
    if docker exec healthapp-nextjs-postgres-local pg_isready -U healthapp_user -d healthapp_dev &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    fi
    
    # Check Redis
    if docker exec healthapp-nextjs-redis-local redis-cli auth redis_dev_password ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is ready${NC}"
    else
        echo -e "${RED}❌ Redis is not ready${NC}"
    fi
    
    # Check Next.js app
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Next.js app is ready${NC}"
    else
        echo -e "${YELLOW}⏳ Next.js app is still starting up...${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Healthcare Application Started Successfully!${NC}"
    echo "=============================================="
    echo -e "${GREEN}🏥 Healthcare App:${NC}     http://localhost:3000"
    echo -e "${GREEN}🔧 API Health Check:${NC}   http://localhost:3000/api/health"
    echo -e "${GREEN}👨‍⚕️ Doctor Dashboard:${NC}  http://localhost:3000/dashboard/doctor"
    echo -e "${GREEN}🤒 Patient Dashboard:${NC}  http://localhost:3000/dashboard/patient"
    echo -e "${GREEN}🗄️ Database Admin:${NC}     http://localhost:5050 (admin@healthapp.dev/admin123)"
    echo -e "${GREEN}📊 Redis Admin:${NC}        http://localhost:8081 (admin/admin123)"
    echo ""
    echo -e "${BLUE}📝 Useful Commands:${NC}"
    echo "  View logs:     docker-compose -f docker/docker-compose.nextjs-local.yml logs -f nextjs"
    echo "  Stop app:      docker-compose -f docker/docker-compose.nextjs-local.yml down"
    echo "  Restart app:   docker-compose -f docker/docker-compose.nextjs-local.yml restart nextjs"
    echo ""

else
    # Fallback to npm development
    echo -e "${YELLOW}📦 Docker Compose file not found, using npm development mode...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📥 Installing dependencies...${NC}"
        npm install
    fi
    
    # Start PostgreSQL container only
    echo -e "${BLUE}🗄️ Starting PostgreSQL database...${NC}"
    docker run -d --name healthapp-postgres-quick \
        -e POSTGRES_DB=healthapp_dev \
        -e POSTGRES_USER=healthapp_user \
        -e POSTGRES_PASSWORD=pg_password \
        -p 5432:5432 \
        postgres:17-alpine
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 10
    
    # Run Prisma migrations
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    npx prisma migrate dev --name auto-migration
    
    echo -e "${GREEN}🎉 Database Ready!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Starting Next.js development server...${NC}"
    echo "  Application will be available at: http://localhost:3000"
    echo "  API endpoints available at: http://localhost:3000/api/*"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"
    echo ""
    
    # Start Next.js development server
    npm run dev
fi