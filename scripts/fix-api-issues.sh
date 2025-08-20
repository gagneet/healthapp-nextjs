#!/bin/bash

# Script to diagnose and fix API routing issues in the Next.js application
# This script checks for common issues and provides fixes

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/app"
APP_PORT="3002"
DB_HOST="${DB_HOST_IP:-postgres}"
REDIS_HOST="${REDIS_HOST_IP:-redis}"

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

# Check database connectivity
check_database() {
    print_status "Checking database connectivity..."
    
    # Check if we can connect to PostgreSQL
    # Ensure .pgpass file exists with correct credentials and permissions
    PGPASS_FILE="${HOME}/.pgpass"
    PG_HOST="${DB_HOST}"
    PG_PORT="5432"
    PG_DB="${POSTGRES_DB:-healthapp_prod}"
    PG_USER="${POSTGRES_USER:-healthapp_user}"
    PG_PASSWORD="${POSTGRES_PASSWORD}"
    if [ ! -f "$PGPASS_FILE" ]; then
        echo "${PG_HOST}:${PG_PORT}:${PG_DB}:${PG_USER}:${PG_PASSWORD}" > "$PGPASS_FILE"
        chmod 600 "$PGPASS_FILE"
    fi
    
    # Check if we can connect to PostgreSQL
    if psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" &> /dev/null; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database"
        print_warning "Please check:"
        print_warning "  - Database is running"
        print_warning "  - Environment variables are set correctly"
        print_warning "  - Database credentials are correct"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    print_status "Checking Redis connectivity..."
    
    # Check if we can connect to Redis
    if redis-cli -h "$REDIS_HOST" -a "${REDIS_PASSWORD}" ping &> /dev/null; then
        print_success "Redis connection successful"
        return 0
    else
        print_warning "Cannot connect to Redis (not critical for basic operation)"
        return 0
    fi
}

# Check Prisma setup
check_prisma() {
    print_status "Checking Prisma setup..."
    
    # Check if Prisma client is generated
    if [ -d "node_modules/.prisma/client" ]; then
        print_success "Prisma client is generated"
    else
        print_warning "Prisma client not found, generating..."
        npx prisma generate
        print_success "Prisma client generated"
    fi
    
    # Check if database is migrated
    print_status "Checking database migrations..."
    if npx prisma migrate status &> /dev/null; then
        print_success "Database migrations are up to date"
    else
        print_warning "Database migrations might be pending"
        print_status "Running migrations..."
        npx prisma migrate deploy
        print_success "Migrations completed"
    fi
}

# Check API routes
check_api_routes() {
    print_status "Checking API routes structure..."
    
    # Check if app/api directory exists
    if [ -d "app/api" ]; then
        print_success "API directory exists"
        
        # List all route files
        print_status "Found API routes:"
        find app/api -name "route.ts" -o -name "route.js" | while read -r route; do
            echo "  - $route"
        done
    else
        print_error "API directory not found"
        return 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Array of endpoints to test
    endpoints=(
        "/api/health"
        "/api/auth/session"
        "/api/doctors/dashboard"
        "/api/doctors/recent-patients"
        "/api/doctors/critical-alerts"
        "/api/doctors/adherence-analytics"
        "/api/patients/pagination"
    )
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT$endpoint")
        if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "403" ]; then
            print_success "$endpoint - OK (HTTP $response)"
        else
            print_warning "$endpoint - Failed (HTTP $response)"
        fi
    done
}

# Fix Next.js build issues
fix_nextjs_build() {
    print_status "Checking Next.js build..."
    
    # Check if .next directory exists
    if [ -d ".next" ]; then
        print_status "Next.js build directory exists"
    else
        print_warning "Next.js build directory not found"
        print_status "Building application..."
        npm run build
        print_success "Application built successfully"
    fi
}

# Fix environment variables
fix_env_variables() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "All required environment variables are set"
    else
        print_error "Missing environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        
        # Try to fix common variables
        if [ -z "$DATABASE_URL" ]; then
            export DATABASE_URL="postgresql://${POSTGRES_USER:-healthapp_user}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB:-healthapp_prod}"
            print_status "Set DATABASE_URL to: $DATABASE_URL"
        fi
        
        if [ -z "$NEXTAUTH_URL" ]; then
            export NEXTAUTH_URL="http://localhost:$APP_PORT"
            print_status "Set NEXTAUTH_URL to: $NEXTAUTH_URL"
        fi
        
        if [ -z "$NEXTAUTH_SECRET" ]; then
            export NEXTAUTH_SECRET=$(openssl rand -base64 32)
            print_status "Generated NEXTAUTH_SECRET"
        fi
    fi
}

# Create missing API routes
create_missing_routes() {
    print_status "Checking for missing API routes..."
    
    # Check if demo route exists (it was showing 404)
    if [ ! -f "app/demo/page.tsx" ] && [ ! -f "app/demo/page.js" ]; then
        print_warning "Demo page not found, creating placeholder..."
        mkdir -p app/demo
        cat > app/demo/page.tsx << 'EOF'
import { redirect } from 'next/navigation';

export default function DemoPage() {
  // Redirect to login for now
  redirect('/auth/login');
}
EOF
        print_success "Created demo page placeholder"
    fi
}

# Restart application
restart_application() {
    print_status "Restarting application..."
    
    # Check if running in Docker
    if [ -f /.dockerenv ]; then
        print_warning "Running in Docker container, cannot restart from within"
        print_status "Please restart the container from the host"
    else
        # Check if PM2 is being used
        if command -v pm2 &> /dev/null && pm2 list | grep -q "healthapp"; then
            pm2 restart healthapp
            print_success "Application restarted with PM2"
        # Check if systemd service exists
        elif systemctl list-units --full -all | grep -q "healthapp.service"; then
            sudo systemctl restart healthapp
            print_success "Application restarted with systemd"
        else
            print_warning "Could not determine how to restart the application"
            print_status "Please restart the application manually"
        fi
    fi
}

# Generate diagnostic report
generate_report() {
    print_status "Generating diagnostic report..."
    
    report_file="/tmp/healthapp-diagnostic-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "HealthApp Diagnostic Report"
        echo "Generated: $(date)"
        echo "================================"
        echo
        echo "Environment:"
        echo "  Node Version: $(node --version)"
        echo "  NPM Version: $(npm --version)"
        echo "  Current Directory: $(pwd)"
        echo
        echo "Database Connection:"
        if check_database &> /dev/null; then
            echo "  Status: Connected"
        else
            echo "  Status: Failed"
        fi
        echo
        echo "Redis Connection:"
        if check_redis &> /dev/null; then
            echo "  Status: Connected"
        else
            echo "  Status: Failed"
        fi
        echo
        echo "API Routes:"
        find app/api -name "route.ts" -o -name "route.js" | while read -r route; do
            echo "  - $route"
        done
        echo
        echo "Environment Variables:"
        echo "  DATABASE_URL: ${DATABASE_URL:+Set}"
        echo "  NEXTAUTH_URL: ${NEXTAUTH_URL:+Set}"
        echo "  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+Set}"
        echo
        echo "Process Information:"
        ps aux | grep -E "node|next" | grep -v grep
        echo
        echo "Port Usage:"
        netstat -tlnp 2>/dev/null | grep ":$APP_PORT" || ss -tlnp | grep ":$APP_PORT"
        echo
        echo "Recent Errors (last 50 lines):"
        if [ -f "logs/error.log" ]; then
            tail -50 logs/error.log
        else
            echo "  No error log found"
        fi
    } > "$report_file"
    
    print_success "Diagnostic report saved to: $report_file"
}

# Main diagnostic and fix function
main() {
    echo "========================================="
    echo "API Issues Diagnostic and Fix Script"
    echo "========================================="
    echo
    
    # Change to application directory if specified
    if [ -n "$1" ]; then
        cd "$1"
    fi
    
    # Run checks
    print_status "Starting diagnostics..."
    echo
    
    # Check environment variables
    fix_env_variables
    echo
    
    # Check database connectivity
    if ! check_database; then
        print_error "Database connection failed - this is likely causing the 500 errors"
        echo
    fi
    
    # Check Redis connectivity
    check_redis
    echo
    
    # Check Prisma setup
    check_prisma
    echo
    
    # Check API routes
    check_api_routes
    echo
    
    # Fix Next.js build
    fix_nextjs_build
    echo
    
    # Create missing routes
    create_missing_routes
    echo
    
    # Test API endpoints
    test_api_endpoints
    echo
    
    # Generate report
    generate_report
    echo
    
    print_success "========================================="
    print_success "Diagnostic completed!"
    print_success "========================================="
    echo
    print_status "Summary of issues found:"
    echo
    
    # Provide recommendations
    print_status "Recommendations:"
    print_status "1. If database connection failed, check your database container/service"
    print_status "2. If API routes are returning 404, ensure the application is properly built"
    print_status "3. For 500 errors, check the application logs for detailed error messages"
    print_status "4. Ensure all environment variables are properly set"
    echo
    print_status "To view detailed logs, run:"
    print_status "  docker logs healthapp-app-prod"
    print_status "  tail -f logs/error.log"
    echo
    print_status "After fixing issues, restart the application:"
    print_status "  docker-compose -f docker/docker-compose.production.yml restart app"
}

# Run main function
main "$@"