#!/bin/bash

# Fix deployment issues for healthapp.gagneet.com
# This script fixes nginx configuration and checks database connectivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}Healthcare App Deployment Fix Script${NC}"
echo -e "${GREEN}====================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check application status
echo -e "\n${BLUE}[1/5] Checking application status...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002 | grep -q "200\|500"; then
    echo -e "${GREEN}✅ Application is running on port 3002${NC}"
else
    echo -e "${RED}❌ Application is not running on port 3002${NC}"
    echo -e "${YELLOW}Please start the application first:${NC}"
    echo -e "${YELLOW}  Using Docker: ./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com${NC}"
    echo -e "${YELLOW}  Using npm: npm run dev (for testing)${NC}"
    exit 1
fi

# Step 2: Check database connectivity
echo -e "\n${BLUE}[2/5] Checking database connectivity...${NC}"
if [ -f ".env" ]; then
    source .env
    
    # Extract database connection details
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
${BLUE}[2/5] Checking database connectivity...${NC}"
if [ -f ".env" ]; then
    source .env
    
    # Extract database connection details
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo -e "${YELLOW}Database Configuration:${NC}"
    echo -e "  Host: ${DB_HOST}"
    echo -e "  Port: ${DB_PORT}"
    echo -e "  Database: ${DB_NAME}"
    
    # Test database connection
    if command_exists nc; then
        if nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; then
            echo -e "${GREEN}✅ Database port is reachable${NC}"
        else
            echo -e "${RED}❌ Cannot reach database on ${DB_HOST}:${DB_PORT}${NC}"
            echo -e "${YELLOW}Possible issues:${NC}"
            echo -e "  1. PostgreSQL container is not running"
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo -e "${YELLOW}Database Configuration:${NC}"
    echo -e "  Host: ${DB_HOST}"
    echo -e "  Port: ${DB_PORT}"
    echo -e "  Database: ${DB_NAME}"
    
    # Test database connection
    if command_exists nc; then
echo -e "
${BLUE}[2/5] Checking database connectivity...${NC}"
if [ -f ".env" ]; then
    source .env
    
    # Extract database connection details
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo -e "${YELLOW}Database Configuration:${NC}"
    echo -e "  Host: ${DB_HOST}"
    echo -e "  Port: ${DB_PORT}"
    echo -e "  Database: ${DB_NAME}"
    
    # Test database connection
    if command_exists nc; then
        if nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; then
            echo -e "${GREEN}✅ Database port is reachable${NC}"
        else
            echo -e "${RED}❌ Cannot reach database on ${DB_HOST}:${DB_PORT}${NC}"
            echo -e "${YELLOW}Possible issues:${NC}"
            echo -e "  1. PostgreSQL container is not running"
            echo -e "${GREEN}✅ Database port is reachable${NC}"
        else
            echo -e "${RED}❌ Cannot reach database on ${DB_HOST}:${DB_PORT}${NC}"
            echo -e "${YELLOW}Possible issues:${NC}"
            echo -e "  1. PostgreSQL container is not running"
            echo -e "  2. Database host is incorrect in .env file"
            echo -e "  3. Network connectivity issue"
            echo -e "\n${YELLOW}To fix:${NC}"
            echo -e "  1. Start PostgreSQL: docker-compose up -d postgres"
            echo -e "  2. Or deploy full stack: ./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot test database connectivity (nc not installed)${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}Creating .env from production template...${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    if [ -f "env_files/.env.production" ]; then
        cp env_files/.env.production .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${RED}❌ env_files/.env.production not found${NC}"
        echo -e "${YELLOW}Please create .env file manually with required environment variables${NC}"
    fi
fi

# Step 3: Setup nginx configuration (requires sudo)
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Step 3: Setup nginx configuration (requires sudo)
echo -e "\n${BLUE}[3/5] Setting up nginx configuration...${NC}"

# Check if nginx is installed
if ! command_exists nginx; then
    echo -e "${RED}❌ nginx is not installed${NC}"
    echo -e "${YELLOW}To install nginx:${NC}"
    echo -e "  sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx"
    NGINX_MISSING=true
else
    echo -e "${GREEN}✅ nginx is installed${NC}"
    NGINX_MISSING=false
fi

# Create nginx configuration instructions
echo -e "\n${BLUE}[4/5] Nginx Configuration Instructions:${NC}"
echo -e "${YELLOW}Run these commands to set up nginx (requires sudo):${NC}"
echo ""
echo "# 1. Copy nginx configuration to system"
echo "sudo cp nginx/healthapp.gagneet.com.system.conf /etc/nginx/sites-available/healthapp.gagneet.com"
echo ""
echo "# 2. Enable the site"
echo "sudo ln -sf /etc/nginx/sites-available/healthapp.gagneet.com /etc/nginx/sites-enabled/"
echo ""
echo "# 3. Remove default site if it exists"
echo "sudo rm -f /etc/nginx/sites-enabled/default"
echo ""
echo "# 4. Test nginx configuration"
echo "sudo nginx -t"
echo ""
echo "# 5. Reload nginx"
echo "sudo systemctl reload nginx"
echo ""

# Step 4: SSL Certificate check
echo -e "\n${BLUE}[5/5] SSL Certificate Status:${NC}"
if [ -d "/etc/letsencrypt/live/healthapp.gagneet.com" ]; then
    echo -e "${GREEN}✅ SSL certificates found${NC}"
    echo -e "  Your site should be accessible at: https://healthapp.gagneet.com"
else
    echo -e "${YELLOW}⚠️  SSL certificates not found${NC}"
    echo -e "${YELLOW}To obtain SSL certificates:${NC}"
    echo "  sudo certbot --nginx -d healthapp.gagneet.com"
    echo ""
    echo -e "${YELLOW}For now, create a temporary HTTP-only configuration:${NC}"
    cat > /tmp/healthapp-temp.conf <<'EOF'
server {
    listen 80;
    server_name healthapp.gagneet.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    echo -e "${GREEN}✅ Created temporary configuration at /tmp/healthapp-temp.conf${NC}"
    echo -e "${YELLOW}To use it:${NC}"
    echo "  sudo cp /tmp/healthapp-temp.conf /etc/nginx/sites-available/healthapp.gagneet.com"
    echo "  sudo ln -sf /etc/nginx/sites-available/healthapp.gagneet.com /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
fi

# Summary
echo -e "\n${GREEN}====================================${NC}"
echo -e "${GREEN}Summary of Issues and Actions${NC}"
echo -e "${GREEN}====================================${NC}"

# Application status
echo -e "\n${BLUE}Application Status:${NC}"
if curl -s http://127.0.0.1:3002/api/health 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✅ Application API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Application API is not responding correctly${NC}"
    echo -e "   This may be due to database connection issues"
fi

# Quick fix commands
echo -e "\n${BLUE}Quick Fix Commands:${NC}"
echo -e "${YELLOW}1. Fix database connection:${NC}"
echo "   ./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com --migrate --seed"
echo ""
echo -e "${YELLOW}2. Set up nginx (run as root):${NC}"
echo "   sudo ./scripts/setup-nginx.sh"
echo ""
echo -e "${YELLOW}3. Check deployment status:${NC}"
echo "   curl -I https://healthapp.gagneet.com (if SSL is set up)"
echo "   curl -I http://healthapp.gagneet.com (if HTTP only)"
echo ""

# API endpoints to test
echo -e "\n${BLUE}Test API Endpoints:${NC}"
echo "After fixing, test these endpoints:"
echo "  curl http://127.0.0.1:3002/api/health"
echo "  curl http://127.0.0.1:3002/api/doctors/dashboard"
echo "  curl http://127.0.0.1:3002/api/patients/pagination?page=1&limit=10"

echo -e "\n${GREEN}====================================${NC}"
echo -e "${GREEN}Script Complete!${NC}"
echo -e "${GREEN}====================================${NC}"