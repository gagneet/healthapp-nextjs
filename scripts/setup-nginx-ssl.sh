#!/bin/bash

# Script to set up Nginx reverse proxy with SSL for healthapp.gagneet.com
# This script handles both Let's Encrypt and self-signed certificate options

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="healthapp.gagneet.com"
APP_PORT="3002"
NGINX_CONF_DIR="/etc/nginx"
SSL_DIR="/etc/nginx/ssl"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Install nginx if not already installed
install_nginx() {
    print_status "Checking if Nginx is installed..."
    
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        apt-get update
        apt-get install -y nginx
        print_success "Nginx installed successfully"
    else
        print_success "Nginx is already installed"
    fi
}

# Install certbot for Let's Encrypt
install_certbot() {
    print_status "Checking if Certbot is installed..."
    
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
        print_success "Certbot installed successfully"
    else
        print_success "Certbot is already installed"
    fi
}

# Create SSL directory
create_ssl_directory() {
    print_status "Creating SSL directory..."
    mkdir -p "$SSL_DIR"
    chmod 755 "$SSL_DIR"
    print_success "SSL directory created at $SSL_DIR"
}

# Generate self-signed certificate
generate_self_signed_cert() {
    print_status "Generating self-signed SSL certificate for $DOMAIN..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/$DOMAIN.key" \
        -out "$SSL_DIR/$DOMAIN.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    chmod 600 "$SSL_DIR/$DOMAIN.key"
    chmod 644 "$SSL_DIR/$DOMAIN.crt"
    
    print_success "Self-signed certificate generated successfully"
}

# Generate Let's Encrypt certificate
generate_letsencrypt_cert() {
    print_status "Generating Let's Encrypt SSL certificate for $DOMAIN..."
    
    # Stop nginx temporarily to allow certbot to bind to port 80
    systemctl stop nginx
    
# Stop nginx temporarily to allow certbot to bind to port 80
    systemctl stop nginx
    if certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email; then
        # Create symbolic links to Let's Encrypt certificates
        ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
        ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
        print_success "Let's Encrypt certificate generated successfully"
    else
        print_error "Failed to generate Let's Encrypt certificate"
        exit 1
    fi
    
    # Start nginx again
    systemctl start nginx
}

# Create nginx configuration
    
    # Create symbolic links to Let's Encrypt certificates
    ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
    ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
    
    # Start nginx again
print_status "Generating Let's Encrypt SSL certificate for $DOMAIN..."
    
    # Stop nginx temporarily to allow certbot to bind to port 80
    systemctl stop nginx || { print_error "Failed to stop nginx"; return 1; }
    
    # Ensure nginx is restarted even if the script fails
    trap 'systemctl start nginx' EXIT
    
    if ! certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email; then
        print_error "Failed to generate Let's Encrypt certificate"
        return 1
    fi
    
    # Create symbolic links to Let's Encrypt certificates
    ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
    ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
    
    # Start nginx again
    systemctl start nginx || { print_error "Failed to start nginx"; return 1; }
    
    # Remove the trap as nginx has been successfully started
    trap - EXIT
    
    print_success "Let's Encrypt certificate generated successfully"
}
    
    print_success "Let's Encrypt certificate generated successfully"
}

# Create nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration for $DOMAIN..."
    
    cat > "$NGINX_SITES_AVAILABLE/$DOMAIN" << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name healthapp.gagneet.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name healthapp.gagneet.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/healthapp.gagneet.com.crt;
    ssl_certificate_key /etc/nginx/ssl/healthapp.gagneet.com.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Client body size limit for file uploads
    client_max_body_size 50M;

    # WebSocket support
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    # Main application proxy
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        proxy_redirect off;
    }

    # API routes with longer timeout
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }

    # Next.js specific routes
    location /_next/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets with caching
    location /_next/static/ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 1y;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/api/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # Error pages
    error_page 502 503 504 /502.html;
    location = /502.html {
        root /usr/share/nginx/html;
        internal;
    }

    # Logging
    access_log /var/log/nginx/healthapp.gagneet.com.access.log;
    error_log /var/log/nginx/healthapp.gagneet.com.error.log;
}
EOF
    
    print_success "Nginx configuration created at $NGINX_SITES_AVAILABLE/$DOMAIN"
}

# Enable nginx site
enable_nginx_site() {
    print_status "Enabling Nginx site..."
    
    # Create sites directories if they don't exist
    mkdir -p "$NGINX_SITES_AVAILABLE"
    mkdir -p "$NGINX_SITES_ENABLED"
    
    # Create symbolic link
    ln -sf "$NGINX_SITES_AVAILABLE/$DOMAIN" "$NGINX_SITES_ENABLED/$DOMAIN"
    
    # Remove default site if it exists
    rm -f "$NGINX_SITES_ENABLED/default"
    
    print_success "Nginx site enabled"
}

# Test nginx configuration
test_nginx_config() {
    print_status "Testing Nginx configuration..."
    
    if nginx -t; then
        print_success "Nginx configuration is valid"
        return 0
    else
        print_error "Nginx configuration is invalid"
        return 1
    fi
}

# Reload nginx
reload_nginx() {
    print_status "Reloading Nginx..."
    
    systemctl reload nginx
    systemctl enable nginx
    
    print_success "Nginx reloaded and enabled"
}

# Setup firewall rules
setup_firewall() {
    print_status "Setting up firewall rules..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3002/tcp
        print_success "Firewall rules configured"
    else
        print_warning "UFW not installed, skipping firewall configuration"
    fi
}

# Create systemd service for auto-renewal (Let's Encrypt)
create_renewal_service() {
    print_status "Creating certificate renewal service..."
    
    cat > /etc/systemd/system/certbot-renewal.service << 'EOF'
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"

[Install]
WantedBy=multi-user.target
EOF

    cat > /etc/systemd/system/certbot-renewal.timer << 'EOF'
[Unit]
Description=Run Certbot Renewal twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

    systemctl daemon-reload
    systemctl enable certbot-renewal.timer
    systemctl start certbot-renewal.timer
    
    print_success "Certificate renewal service created and enabled"
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if nginx is running
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Check if site is accessible
    if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
        print_success "Site is accessible via HTTPS"
    else
        print_warning "Site might not be accessible yet. Please check DNS settings and wait for propagation."
    fi
    
    # Check certificate
    if openssl x509 -in "$SSL_DIR/$DOMAIN.crt" -noout -text &> /dev/null; then
        print_success "SSL certificate is valid"
    else
        print_error "SSL certificate is invalid"
        return 1
    fi
    
    return 0
}

# Main setup function
main() {
    echo "========================================="
    echo "Nginx SSL Setup for $DOMAIN"
    echo "========================================="
    echo
    
    # Check root privileges
    check_root
    
    # Install nginx
    install_nginx
    
    # Create SSL directory
    create_ssl_directory
    
    # Ask user for certificate type
    echo
    print_status "Choose SSL certificate type:"
    echo "1) Self-signed certificate (for development/testing)"
    echo "2) Let's Encrypt certificate (for production - requires valid domain)"
    echo "3) Skip certificate generation (if you already have certificates)"
    read -p "Enter choice [1-3]: " cert_choice
    
    case $cert_choice in
        1)
            generate_self_signed_cert
            ;;
        2)
            install_certbot
            generate_letsencrypt_cert
            create_renewal_service
            ;;
        3)
            print_warning "Skipping certificate generation. Make sure certificates exist at:"
            print_warning "  - $SSL_DIR/$DOMAIN.crt"
            print_warning "  - $SSL_DIR/$DOMAIN.key"
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Create nginx configuration
    create_nginx_config
    
    # Enable site
    enable_nginx_site
    
    # Test configuration
    if test_nginx_config; then
        # Reload nginx
        reload_nginx
        
        # Setup firewall
        setup_firewall
        
        # Verify setup
        verify_setup
        
        echo
        print_success "========================================="
        print_success "Nginx SSL setup completed successfully!"
        print_success "========================================="
        echo
        print_status "Your application should now be accessible at:"
        print_status "  https://$DOMAIN"
        echo
        print_status "Important notes:"
        print_status "  1. Make sure your domain DNS points to this server's IP address"
        print_status "  2. Ensure the application is running on port $APP_PORT"
        print_status "  3. Check firewall settings if the site is not accessible"
        echo
        print_status "Nginx logs can be found at:"
        print_status "  - Access log: /var/log/nginx/$DOMAIN.access.log"
        print_status "  - Error log: /var/log/nginx/$DOMAIN.error.log"
    else
        print_error "Setup failed due to configuration errors"
        exit 1
    fi
}

# Run main function
main "$@"