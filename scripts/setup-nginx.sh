#!/bin/bash

# Setup nginx configuration for healthapp.gagneet.com
# This script copies the nginx configuration to the system and enables it

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up nginx configuration for healthapp.gagneet.com${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run this script with sudo${NC}"
    exit 1
fi

# Variables
DOMAIN="healthapp.gagneet.com"
CONFIG_FILE="nginx/healthapp.gagneet.com.system.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CERTBOT_PATH="/etc/letsencrypt/live/$DOMAIN"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}nginx is not installed. Installing...${NC}"
    apt-get update
    apt-get install -y nginx
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}certbot is not installed. Installing...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Create nginx directories if they don't exist
mkdir -p $NGINX_SITES_AVAILABLE
mkdir -p $NGINX_SITES_ENABLED

# Check if SSL certificates exist
if [ ! -d "$CERTBOT_PATH" ]; then
    echo -e "${YELLOW}SSL certificates not found at $CERTBOT_PATH${NC}"
    echo -e "${YELLOW}Would you like to obtain SSL certificates now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Obtaining SSL certificates...${NC}"
        certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email
    else
        echo -e "${YELLOW}Using temporary configuration without SSL...${NC}"
        # Create a temporary HTTP-only configuration
        cat > "$NGINX_SITES_AVAILABLE/$DOMAIN" <<EOF
# Temporary HTTP configuration for healthapp.gagneet.com
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Client body size limit for file uploads
    client_max_body_size 50M;

    # Main application proxy to Docker app on port 3002
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /_next/image {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /api/health {
        access_log off;
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host \$host;
        proxy_read_timeout 5s;
        proxy_connect_timeout 5s;
    }

    # Logging
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;
}
EOF
    fi
else
    echo -e "${GREEN}SSL certificates found at $CERTBOT_PATH${NC}"
    # Copy the full SSL configuration
else
    echo -e "${GREEN}SSL certificates found at $CERTBOT_PATH${NC}"
    # Copy the full SSL configuration
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$NGINX_SITES_AVAILABLE/$DOMAIN"
    else
        echo -e "${RED}Error: $CONFIG_FILE not found${NC}"
        exit 1
    fi
fi

# Remove default nginx site if it exists
fi

# Remove default nginx site if it exists
if [ -L "$NGINX_SITES_ENABLED/default" ]; then
    echo -e "${YELLOW}Removing default nginx site...${NC}"
    rm "$NGINX_SITES_ENABLED/default"
fi

# Remove old symlink if it exists
if [ -L "$NGINX_SITES_ENABLED/$DOMAIN" ]; then
    echo -e "${YELLOW}Removing old symlink...${NC}"
    rm "$NGINX_SITES_ENABLED/$DOMAIN"
fi

# Create symlink to enable the site
echo -e "${GREEN}Enabling nginx site...${NC}"
ln -s "$NGINX_SITES_AVAILABLE/$DOMAIN" "$NGINX_SITES_ENABLED/$DOMAIN"

# Fix rate limiting configuration (move outside of location blocks)
if [ -f "$NGINX_SITES_AVAILABLE/$DOMAIN" ]; then
    # Create a fixed configuration with rate limiting properly configured
    cat > "$NGINX_SITES_AVAILABLE/${DOMAIN}.fixed" <<'EOF'
# Rate limiting zones (must be defined at http level, but we'll skip for now)
# These should be added to /etc/nginx/nginx.conf in the http block:
# limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
# limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name healthapp.gagneet.com;
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
    }
    
    # Redirect all other HTTP requests to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name healthapp.gagneet.com;

    # SSL Configuration (Let's Encrypt certificates)
    ssl_certificate /etc/letsencrypt/live/healthapp.gagneet.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthapp.gagneet.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Client body size limit for file uploads
    client_max_body_size 50M;

    # Main application proxy to Docker app on port 3002
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Next.js static files optimization
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /_next/image {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        # Rate limiting (requires zone to be defined in nginx.conf)
        # limit_req zone=api burst=20 nodelay;
        # limit_req_status 429;

        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Authentication endpoints with stricter rate limiting
    location ~* /api/(auth|sign-in|sign-up|register) {
        # Rate limiting (requires zone to be defined in nginx.conf)
        # limit_req zone=login burst=5 nodelay;
        # limit_req_status 429;

        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }

    # File upload endpoints
    location /api/upload {
        client_max_body_size 50M;
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 600s;
    }

    # Health check endpoint
    location /api/health {
        access_log off;
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_read_timeout 5s;
        proxy_connect_timeout 5s;
    }

    # Error pages
    error_page 502 503 504 /502.html;
    location = /502.html {
        root /var/www/html;
        internal;
    }

    # Logging
    access_log /var/log/nginx/healthapp_access.log;
    error_log /var/log/nginx/healthapp_error.log;
}
EOF
    
    # Replace the configuration with the fixed one if SSL certificates exist
    if [ -d "$CERTBOT_PATH" ]; then
        mv "$NGINX_SITES_AVAILABLE/${DOMAIN}.fixed" "$NGINX_SITES_AVAILABLE/$DOMAIN"
    else
        rm "$NGINX_SITES_AVAILABLE/${DOMAIN}.fixed"
    fi
fi

# Test nginx configuration
echo -e "${GREEN}Testing nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Configuration test passed!${NC}"
    
    # Reload nginx
    echo -e "${GREEN}Reloading nginx...${NC}"
    systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configuration completed successfully!${NC}"
    echo -e "${GREEN}Your site should now be accessible at:${NC}"
    
    if [ -d "$CERTBOT_PATH" ]; then
        echo -e "${GREEN}  https://$DOMAIN${NC}"
    else
        echo -e "${YELLOW}  http://$DOMAIN (SSL not configured yet)${NC}"
        echo -e "${YELLOW}To enable SSL, run: sudo certbot --nginx -d $DOMAIN${NC}"
    fi
    
    # Check if the application is running
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/health | grep -q "200"; then
        echo -e "${GREEN}✅ Application is running on port 3002${NC}"
    else
        echo -e "${YELLOW}⚠️  Application doesn't seem to be running on port 3002${NC}"
        echo -e "${YELLOW}Make sure your Docker containers are running${NC}"
    fi
else
    echo -e "${RED}Configuration test failed! Please check the error messages above.${NC}"
    exit 1
fi