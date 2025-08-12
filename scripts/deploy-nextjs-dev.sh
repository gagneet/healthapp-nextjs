#!/bin/bash

# ============================================================================
# NEXT.JS HEALTHCARE DEVELOPMENT DEPLOYMENT SCRIPT
# ============================================================================
# Complete development environment with auto-migrations, seeders, and testing
# Usage: ./scripts/deploy-nextjs-dev.sh [options]
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker/docker-compose.nextjs-dev.yml"
ENV_FILE=".env.development"

# Default values
AUTO_YES=false
MIGRATE=false
SEED=false
RESET=false
DOMAIN=""
HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' | head -1 2>/dev/null || echo "localhost")

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-yes|-y)
            AUTO_YES=true
            shift
            ;;
        --migrate|-m)
            MIGRATE=true
            shift
            ;;
        --seed|-s)
            SEED=true
            shift
            ;;
        --reset|-r)
            RESET=true
            shift
            ;;
        --domain|-d)
            DOMAIN="$2"
            shift 2
            ;;
        --host-ip)
            HOST_IP="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --auto-yes, -y     Auto-answer yes to prompts"
            echo "  --migrate, -m      Run database migrations"
            echo "  --seed, -s         Seed database with test data"
            echo "  --reset, -r        Reset and recreate all containers"
            echo "  --domain, -d       Set domain name (default: localhost)"
            echo "  --host-ip          Set host IP address"
            echo "  --help, -h         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

echo -e "${BLUE}🏥 Next.js Healthcare Development Environment${NC}"
echo "=============================================="
echo ""
echo "Configuration:"
echo "  Host IP: $HOST_IP"
echo "  Domain: ${DOMAIN:-$HOST_IP}"
echo "  Auto-migrate: $MIGRATE"
echo "  Auto-seed: $SEED"
echo "  Reset: $RESET"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p data/postgres-dev data/redis-dev logs/dev

# Set environment variables
export HOST_IP="$HOST_IP"

# Handle reset option
if [ "$RESET" = true ]; then
    if [ "$AUTO_YES" = false ]; then
        read -p "⚠️  This will destroy all development data. Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi
    
    echo -e "${YELLOW}🔄 Resetting development environment...${NC}"
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
    sudo rm -rf data/postgres-dev data/redis-dev logs/dev
    mkdir -p data/postgres-dev data/redis-dev logs/dev
fi

# Create environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Creating $ENV_FILE...${NC}"
    cat > "$ENV_FILE" << EOF
# Next.js Healthcare App - Development Environment
NODE_ENV=development
PORT=3000

# NextAuth.js Configuration
NEXTAUTH_URL=http://${DOMAIN:-$HOST_IP}:3000
NEXTAUTH_SECRET=nextjs_healthcare_dev_secret_key_not_for_production
JWT_SECRET=development_jwt_secret_key_not_for_production

# Database Configuration (Prisma)
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5432/healthapp_dev?schema=public"

# Application Settings
NEXT_PUBLIC_API_URL=http://${DOMAIN:-$HOST_IP}:3000/api
DEBUG=true
LOG_LEVEL=debug
NEXT_TELEMETRY_DISABLED=1

# Development Features
HOT_RELOAD=true
AUTO_MIGRATE=true
AUTO_SEED=true
EOF
    echo -e "${GREEN}✅ Created $ENV_FILE${NC}"
else
    echo -e "${GREEN}✅ Using existing $ENV_FILE${NC}"
fi

# Create pgAdmin servers configuration
mkdir -p docker/pgadmin-config
cat > docker/pgadmin-servers.json << 'EOF'
{
    "Servers": {
        "1": {
            "Name": "Healthcare Dev Database",
            "Group": "Development",
            "Host": "postgres",
            "Port": 5432,
            "MaintenanceDB": "healthapp_dev",
            "Username": "healthapp_user",
            "Password": "pg_password",
            "SSLMode": "prefer",
            "Comment": "Healthcare development database"
        }
    }
}
EOF

# Start the development environment
echo -e "${BLUE}🚀 Starting Next.js Healthcare Development Environment...${NC}"
echo "Services to be started:"
echo "  - PostgreSQL database (port 5432)"
echo "  - Redis cache (port 6379)"
echo "  - Next.js full-stack app (port 3000)"
echo "  - PgAdmin database manager (port 5050)"
echo "  - Redis Commander (port 8081)"
echo "  - MailHog email testing (ports 1025, 8025)"
echo ""

if [ "$AUTO_YES" = false ]; then
    read -p "Continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Build and start services
echo -e "${BLUE}📦 Building and starting development services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -e "${BLUE}🔍 Waiting for PostgreSQL...${NC}"
timeout=60
while ! docker exec healthapp-nextjs-postgres-dev pg_isready -U healthapp_user -d healthapp_dev >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start in time${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Wait for Redis
echo -e "${BLUE}🔍 Waiting for Redis...${NC}"
timeout=30
while ! docker exec healthapp-nextjs-redis-dev redis-cli -a redis_dev_password ping >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ Redis failed to start in time${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Wait for Next.js application
echo -e "${BLUE}🔍 Waiting for Next.js application...${NC}"
timeout=120
while ! curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; do
    sleep 5
    timeout=$((timeout - 5))
    if [ $timeout -le 0 ]; then
        echo -e "${YELLOW}⏳ Next.js app is still starting up (this may take a few minutes)...${NC}"
        break
    fi
done

if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js application is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js application may still be starting...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Healthcare Development Environment Started Successfully!${NC}"
echo "======================================================="
echo -e "${GREEN}🏥 Healthcare App:${NC}         http://${DOMAIN:-$HOST_IP}:3000"
echo -e "${GREEN}🔧 API Health Check:${NC}       http://${DOMAIN:-$HOST_IP}:3000/api/health"
echo -e "${GREEN}👨‍⚕️ Doctor Dashboard:${NC}      http://${DOMAIN:-$HOST_IP}:3000/dashboard/doctor"
echo -e "${GREEN}🤒 Patient Dashboard:${NC}      http://${DOMAIN:-$HOST_IP}:3000/dashboard/patient"
echo -e "${GREEN}🏥 Admin Dashboard:${NC}        http://${DOMAIN:-$HOST_IP}:3000/dashboard/admin"
echo -e "${GREEN}🗄️ Database Admin:${NC}         http://${DOMAIN:-$HOST_IP}:5050"
echo -e "${GREEN}📊 Redis Commander:${NC}        http://${DOMAIN:-$HOST_IP}:8081"
echo -e "${GREEN}📧 Email Testing:${NC}          http://${DOMAIN:-$HOST_IP}:8025"
echo ""
echo -e "${GREEN}👤 Default Login Credentials:${NC}"
echo "  Database: admin@healthapp.dev / admin123"
echo "  Redis: admin / admin123"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "  View logs:       docker-compose -f $COMPOSE_FILE logs -f nextjs"
echo "  Stop services:   docker-compose -f $COMPOSE_FILE down"
echo "  Reset data:      $0 --reset --auto-yes"
echo "  Database shell:  docker exec -it healthapp-nextjs-postgres-dev psql -U healthapp_user -d healthapp_dev"
echo ""
echo -e "${YELLOW}📋 Development Features Enabled:${NC}"
echo "  ✅ Hot reload for code changes"
echo "  ✅ Auto-migrations on startup"
echo "  ✅ Database seeding with test data"
echo "  ✅ Debug logging enabled"
echo "  ✅ Email testing with MailHog"
echo "  ✅ Redis session debugging"
echo ""

# Additional migrations and seeding if requested
if [ "$MIGRATE" = true ]; then
    echo -e "${BLUE}🔄 Running additional migrations...${NC}"
    docker exec healthapp-nextjs-app-dev npx prisma migrate dev --name additional-dev-migration
fi

if [ "$SEED" = true ]; then
    echo -e "${BLUE}🌱 Seeding additional test data...${NC}"
    docker exec healthapp-nextjs-app-dev npx prisma db seed
fi

echo -e "${GREEN}✨ Development environment is ready for healthcare application development!${NC}"