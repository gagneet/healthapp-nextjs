#!/bin/bash

# ============================================================================
# NEXT.JS HEALTHCARE VM DEPLOYMENT - LOCAL INSTALLATION
# ============================================================================
# Optimized for VM deployment with IP/domain access and local PostgreSQL
# Usage: ./scripts/deploy-vm-local.sh [--domain your.domain.com] [--local-db]
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
LOCAL_DB=false
HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' | head -1 2>/dev/null || hostname -I | cut -d' ' -f1)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain|-d)
            DOMAIN="$2"
            shift 2
            ;;
        --local-db)
            LOCAL_DB=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --domain, -d       Set domain name for external access"
            echo "  --local-db         Use local PostgreSQL instead of Docker"
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

echo -e "${BLUE}🏥 Next.js Healthcare VM Deployment${NC}"
echo "===================================="
echo ""
echo "Configuration:"
echo "  VM IP: $HOST_IP"
echo "  Domain: ${DOMAIN:-$HOST_IP}"
echo "  Local PostgreSQL: $LOCAL_DB"
echo ""

# Check system requirements
echo -e "${BLUE}🔍 Checking system requirements...${NC}"

# Check Node.js
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 18+ is required${NC}"
    echo "Install Node.js: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check PostgreSQL if local database requested
if [ "$LOCAL_DB" = true ]; then
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  Installing PostgreSQL locally...${NC}"
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        
        # Create database and user
        echo -e "${BLUE}📊 Setting up healthcare database...${NC}"
        sudo -u postgres psql << EOF
CREATE USER healthapp_user WITH PASSWORD 'pg_password';
CREATE DATABASE healthapp_dev OWNER healthapp_user;
GRANT ALL PRIVILEGES ON DATABASE healthapp_dev TO healthapp_user;
ALTER USER healthapp_user CREATEDB;
\q
EOF
        echo -e "${GREEN}✅ PostgreSQL configured${NC}"
    else
        echo -e "${GREEN}✅ PostgreSQL found${NC}"
    fi
    DB_HOST="localhost"
    DB_PORT="5432"
else
    # Use Docker for PostgreSQL only
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is required for containerized database${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker found - will use containerized PostgreSQL${NC}"
    DB_HOST="localhost"
    DB_PORT="5433"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --production=false

# Create production environment file
echo -e "${BLUE}⚙️ Creating VM production environment...${NC}"
cat > "$ENV_FILE" << EOF
# Next.js Healthcare App - VM Production Environment
NODE_ENV=production
PORT=3000

# NextAuth.js Configuration
NEXTAUTH_URL=http://${DOMAIN:-$HOST_IP}:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Database Configuration (Prisma)
DATABASE_URL="postgresql://healthapp_user:pg_password@${DB_HOST}:${DB_PORT}/healthapp_dev?schema=public"

# Application Settings
NEXT_PUBLIC_API_URL=http://${DOMAIN:-$HOST_IP}:3000/api
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1

# Production Optimizations
NODE_OPTIONS="--max-old-space-size=2048"
HOSTNAME=0.0.0.0
EOF

# Start PostgreSQL container if not using local
if [ "$LOCAL_DB" = false ]; then
    echo -e "${BLUE}🚀 Starting PostgreSQL container...${NC}"
    docker run -d \
        --name healthapp-postgres-vm \
        --restart unless-stopped \
        -p 5433:5432 \
        -e POSTGRES_DB=healthapp_dev \
        -e POSTGRES_USER=healthapp_user \
        -e POSTGRES_PASSWORD=pg_password \
        -v healthapp_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # Wait for PostgreSQL
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL container...${NC}"
    timeout=60
    while ! docker exec healthapp-postgres-vm pg_isready -U healthapp_user -d healthapp_dev >/dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            echo -e "${RED}❌ PostgreSQL container failed to start${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}✅ PostgreSQL container ready${NC}"
fi

# Setup Prisma and database
echo -e "${BLUE}🔄 Setting up database schema...${NC}"
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Build application
echo -e "${BLUE}🔨 Building Next.js application...${NC}"
npm run build

# Create systemd service for auto-start
echo -e "${BLUE}⚙️ Creating systemd service...${NC}"
sudo tee /etc/systemd/system/healthapp-nextjs.service > /dev/null << EOF
[Unit]
Description=Healthcare Next.js Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROJECT_ROOT
Environment=NODE_ENV=production
ExecStart=$(which npm) start
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_ROOT

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable healthapp-nextjs
sudo systemctl start healthapp-nextjs

# Setup nginx reverse proxy
echo -e "${BLUE}🌐 Setting up Nginx reverse proxy...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
fi

sudo tee /etc/nginx/sites-available/healthapp << EOF
server {
    listen 80;
    server_name ${DOMAIN:-$HOST_IP};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Healthcare app proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts for healthcare data processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/healthapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup firewall
echo -e "${BLUE}🔒 Configuring firewall...${NC}"
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (for future SSL)
sudo ufw --force enable

echo ""
echo -e "${GREEN}🎉 Healthcare VM Deployment Complete!${NC}"
echo "================================="
echo -e "${GREEN}🏥 Healthcare App:${NC}      http://${DOMAIN:-$HOST_IP}"
echo -e "${GREEN}🔧 Health Check:${NC}        http://${DOMAIN:-$HOST_IP}/health"
echo -e "${GREEN}📊 Database:${NC}            PostgreSQL on ${DB_HOST}:${DB_PORT}"
echo ""
echo -e "${GREEN}🔧 Management Commands:${NC}"
echo "  Status:    sudo systemctl status healthapp-nextjs"
echo "  Restart:   sudo systemctl restart healthapp-nextjs"
echo "  Logs:      sudo journalctl -u healthapp-nextjs -f"
echo "  Database:  psql -h ${DB_HOST} -p ${DB_PORT} -U healthapp_user -d healthapp_dev"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "  1. Configure DNS to point ${DOMAIN:-$HOST_IP} to this VM"
echo "  2. Set up SSL certificate with certbot (recommended)"
echo "  3. Configure backup strategy for database and uploads"
echo ""