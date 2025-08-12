#!/bin/bash

# ============================================================================
# NEXT.JS HEALTHCARE VM DEPLOYMENT - HYBRID CONTAINERS
# ============================================================================
# VM deployment with containerized database but local Next.js for performance
# Usage: ./scripts/deploy-vm-hybrid.sh [--domain your.domain.com]
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
ENV_FILE=".env.production"

# Default values
DOMAIN=""
HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' | head -1 2>/dev/null || hostname -I | cut -d' ' -f1)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain|-d)
            DOMAIN="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --domain, -d       Set domain name for external access"
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

echo -e "${BLUE}🏥 Next.js Healthcare VM Hybrid Deployment${NC}"
echo "============================================"
echo ""
echo "Configuration:"
echo "  VM IP: $HOST_IP"
echo "  Domain: ${DOMAIN:-$HOST_IP}"
echo "  Next.js: Local (performance optimized)"
echo "  Database: Containerized"
echo ""

# Check system requirements
echo -e "${BLUE}🔍 Checking system requirements...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required${NC}"
    echo "Install Docker: curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker \$USER"
    exit 1
fi
echo -e "${GREEN}✅ Docker found${NC}"

# Check Node.js
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 18+ is required${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Create production environment
cat > "$ENV_FILE" << EOF
# Next.js Healthcare App - VM Hybrid Environment
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# NextAuth.js Configuration
NEXTAUTH_URL=http://${DOMAIN:-$HOST_IP}:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Database Configuration (Containerized)
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5433/healthapp_dev?schema=public"

# Redis Configuration (Containerized)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_vm_password

# Application Settings
NEXT_PUBLIC_API_URL=http://${DOMAIN:-$HOST_IP}:3000/api
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1

# Performance Optimizations
NODE_OPTIONS="--max-old-space-size=4096"
EOF

# Start containerized services
echo -e "${BLUE}🚀 Starting containerized services...${NC}"

# PostgreSQL Container
docker run -d \
    --name healthapp-postgres-vm \
    --restart unless-stopped \
    -p 5433:5432 \
    -e POSTGRES_DB=healthapp_dev \
    -e POSTGRES_USER=healthapp_user \
    -e POSTGRES_PASSWORD=pg_password \
    -e POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements \
    -v healthapp_postgres_data:/var/lib/postgresql/data \
    postgres:15-alpine \
    postgres -c 'max_connections=200' -c 'shared_buffers=256MB'

# Redis Container
docker run -d \
    --name healthapp-redis-vm \
    --restart unless-stopped \
    -p 6379:6379 \
    -v healthapp_redis_data:/data \
    redis:7-alpine \
    redis-server --appendonly yes --requirepass redis_vm_password --maxmemory 512mb --maxmemory-policy allkeys-lru

# Wait for services
echo -e "${YELLOW}⏳ Waiting for containerized services...${NC}"
timeout=60
while ! docker exec healthapp-postgres-vm pg_isready -U healthapp_user -d healthapp_dev >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Containerized services ready${NC}"

# Setup application
echo -e "${BLUE}📦 Setting up Next.js application...${NC}"
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build

# Create systemd service
echo -e "${BLUE}⚙️ Creating systemd service...${NC}"
sudo tee /etc/systemd/system/healthapp-nextjs.service > /dev/null << EOF
[Unit]
Description=Healthcare Next.js Application (Hybrid)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROJECT_ROOT
Environment=NODE_ENV=production
ExecStart=$(which npm) start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable healthapp-nextjs
sudo systemctl start healthapp-nextjs

echo ""
echo -e "${GREEN}🎉 Healthcare VM Hybrid Deployment Complete!${NC}"
echo "============================================="
echo -e "${GREEN}🏥 Healthcare App:${NC}      http://${DOMAIN:-$HOST_IP}:3000"
echo -e "${GREEN}📊 Database:${NC}            Containerized PostgreSQL (port 5433)"
echo -e "${GREEN}💾 Cache:${NC}               Containerized Redis (port 6379)"
echo ""
echo -e "${GREEN}Management Commands:${NC}"
echo "  App Status:    sudo systemctl status healthapp-nextjs"
echo "  App Logs:      sudo journalctl -u healthapp-nextjs -f"
echo "  DB Container:  docker logs -f healthapp-postgres-vm"
echo "  Redis CLI:     docker exec -it healthapp-redis-vm redis-cli -a redis_vm_password"
echo ""