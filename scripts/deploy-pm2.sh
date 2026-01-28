#!/bin/bash

# deploy-pm2.sh - Simple PM2 Deployment Script
# Usage: ./scripts/deploy-pm2.sh [OPTIONS]
# Purpose: Quick deployment using PM2 process manager on host machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PM2_APP_NAME="healthapp-nextjs"

# Options with defaults
SKIP_INSTALL=false
SKIP_BUILD=false
MIGRATE=true
SEED=false
CHECK_SCHEMA=true
CREATE_MIGRATION=false
MIGRATION_NAME=""
AUTO_YES=false
DEBUG=false

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================================${NC}"
}

log_debug() {
    if [ "$DEBUG" = true ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

confirm() {
    if [ "$AUTO_YES" = true ]; then
        return 0
    fi

    echo -e "${YELLOW}[CONFIRM]${NC} $1"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Operation cancelled"
        exit 1
    fi
}

print_usage() {
    cat << EOF
🚀 HealthApp PM2 Deployment Script (Simple)
============================================

Quick deployment using PM2 process manager on host machine.

Usage: ./scripts/deploy-pm2.sh [OPTIONS]

OPTIONS:
  --skip-install         Skip npm install
  --skip-build          Skip build step (use existing build)
  --no-migrate          Skip database migrations
  --seed                Run database seeders
  --no-schema-check     Skip Prisma schema validation
  --create-migration    Create migration if schema drift detected
  --migration-name NAME Name for new migration
  --auto-yes            Skip confirmation prompts
  --debug               Enable debug output
  --help                Show this help

EXAMPLES:
  # Standard deployment
  ./scripts/deploy-pm2.sh

  # Quick restart (skip install and build)
  ./scripts/deploy-pm2.sh --skip-install --skip-build

  # With schema migration
  ./scripts/deploy-pm2.sh --create-migration --migration-name "add_fields"

  # Fast deployment without prompts
  ./scripts/deploy-pm2.sh --auto-yes

EOF
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --no-migrate)
                MIGRATE=false
                shift
                ;;
            --seed)
                SEED=true
                shift
                ;;
            --no-schema-check)
                CHECK_SCHEMA=false
                shift
                ;;
            --create-migration)
                CREATE_MIGRATION=true
                shift
                ;;
            --migration-name)
                MIGRATION_NAME="$2"
                shift 2
                ;;
            --auto-yes)
                AUTO_YES=true
                shift
                ;;
            --debug)
                DEBUG=true
                shift
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Validate migration options
    if [ "$CREATE_MIGRATION" = true ] && [ -z "$MIGRATION_NAME" ]; then
        log_error "--create-migration requires --migration-name"
        exit 1
    fi
}

# ============================================================================
# Validation Functions
# ============================================================================

check_prerequisites() {
    log_step "Checking Prerequisites"

    # Check if in project root
    if [ ! -f "package.json" ]; then
        log_error "Must run from project root directory"
        exit 1
    fi

    # Check .env file
    if [ ! -f ".env" ]; then
        log_error ".env file not found"
        exit 1
    fi
    log_success ".env file found"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    log_success "Node.js $(node --version) installed"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm --version) installed"

    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Install with: npm install -g pm2"
        exit 1
    fi
    log_success "PM2 $(pm2 --version) installed"

    # Load environment
    set -a
    source .env
    set +a

    # Validate critical env vars
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log_error "NEXTAUTH_SECRET not found in .env"
        exit 1
    fi
    log_success "Environment variables loaded"

    log_success "All prerequisites met"
}

# ============================================================================
# Schema Validation Functions
# ============================================================================

check_schema_drift() {
    if [ "$CHECK_SCHEMA" = false ]; then
        log_info "Skipping schema validation"
        return 0
    fi

    log_step "Checking Prisma Schema"

    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "prisma/schema.prisma not found"
        exit 1
    fi

    log_info "Validating schema..."
    if npx prisma validate; then
        log_success "✅ Schema syntax valid"
    else
        log_error "Schema validation failed"
        exit 1
    fi

    log_info "Checking migration status..."
    local migrate_output
    migrate_output=$(npx prisma migrate status 2>&1)

    if echo "$migrate_output" | grep -q "Database schema is up to date"; then
        log_success "✅ Schema in sync"
        return 0
    elif echo "$migrate_output" | grep -q "database schema is not in sync\|drift detected"; then
        log_warning "⚠️  Schema drift detected!"

        if [ "$CREATE_MIGRATION" = true ]; then
            return 1  # Signal to create migration
        else
            log_error "Schema changes detected without migration"
            log_error "Options:"
            log_error "  1. Use --create-migration --migration-name \"description\""
            log_error "  2. Create manually: npx prisma migrate dev --name <name>"
            log_error "  3. Use --no-schema-check to skip"

            if [ "$AUTO_YES" = true ]; then
                exit 1
            fi

            confirm "Continue anyway?"
            return 0
        fi
    fi

    return 0
}

create_migration() {
    if [ "$CREATE_MIGRATION" = false ]; then
        return 0
    fi

    log_step "Creating Migration"

    if [ -z "$MIGRATION_NAME" ]; then
        log_error "Migration name required"
        exit 1
    fi

    log_warning "Creating migration: $MIGRATION_NAME"
    confirm "Create this migration?"

    if npx prisma migrate dev --name "$MIGRATION_NAME" --skip-generate; then
        log_success "✅ Migration created: $MIGRATION_NAME"

        local latest=$(ls -t prisma/migrations | head -1)
        if [ -n "$latest" ]; then
            log_info "Migration file: prisma/migrations/$latest"
            log_warning "Remember to commit migration files!"
        fi
    else
        log_error "Migration creation failed"
        exit 1
    fi
}

# ============================================================================
# Build Functions
# ============================================================================

install_dependencies() {
    if [ "$SKIP_INSTALL" = true ]; then
        log_info "Skipping dependency installation"
        return 0
    fi

    log_step "Installing Dependencies"

    log_info "Running npm install..."
    if npm install; then
        log_success "Dependencies installed"
    else
        log_error "npm install failed"
        exit 1
    fi

    # Ensure critical Tailwind CSS plugins are installed
    log_info "Ensuring Tailwind CSS plugins are installed..."
    if npm install @tailwindcss/forms @tailwindcss/typography --save-dev; then
        log_success "Tailwind CSS plugins verified"
    else
        log_warning "Failed to install Tailwind CSS plugins (may already exist)"
    fi
}

generate_prisma() {
    log_step "Generating Prisma Client"

    log_info "Running prisma generate..."
    if npx prisma generate; then
        log_success "Prisma client generated"
    else
        log_error "Prisma generate failed"
        exit 1
    fi
}

build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping build step"
        return 0
    fi

    log_step "Building Application"

    log_info "Running Next.js build..."
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# ============================================================================
# Database Functions
# ============================================================================

run_migrations() {
    if [ "$MIGRATE" = false ]; then
        log_info "Skipping migrations"
        return 0
    fi

    log_step "Running Database Migrations"

    log_info "Applying migrations..."
    if npx prisma migrate deploy; then
        log_success "✅ Migrations applied"
    else
        log_error "Migration deployment failed"
        exit 1
    fi
}

run_seed() {
    if [ "$SEED" = false ]; then
        log_info "Skipping seeding"
        return 0
    fi

    log_step "Seeding Database"

    log_warning "Seeding database..."
    confirm "Run database seeding?"

    if npx prisma db seed; then
        log_success "Seeding completed"
    else
        log_warning "Seeding failed (may already have data)"
    fi
}

# ============================================================================
# PM2 Functions
# ============================================================================

manage_pm2() {
    log_step "Managing PM2 Process"

    # Check if app is running
    if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
        log_info "App already running, restarting..."

        if pm2 restart "$PM2_APP_NAME"; then
            log_success "✅ PM2 app restarted"
        else
            log_error "PM2 restart failed"
            exit 1
        fi
    else
        log_info "Starting app with PM2..."

        if [ -f "ecosystem.config.cjs" ]; then
            if pm2 start ecosystem.config.cjs; then
                log_success "✅ PM2 app started"
            else
                log_error "PM2 start failed"
                exit 1
            fi
        else
            log_error "ecosystem.config.cjs not found"
            exit 1
        fi
    fi

    # Save PM2 configuration
    pm2 save > /dev/null 2>&1 || true

    # Show status
    log_info "PM2 Status:"
    pm2 describe "$PM2_APP_NAME" | grep -E "status|uptime|restarts|memory"
}

# ============================================================================
# Summary Function
# ============================================================================

print_summary() {
    log_step "Deployment Summary"

    echo ""
    echo -e "${GREEN}🎉 PM2 Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}Application Status:${NC}"
    pm2 list | grep "$PM2_APP_NAME"
    echo ""
    echo -e "${CYAN}Access Points:${NC}"
    echo -e "  Frontend:     http://localhost:${PORT:-3002}"
    echo -e "  API:          http://localhost:${PORT:-3002}/api"
    echo -e "  Health:       http://localhost:${PORT:-3002}/api/health"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:    pm2 logs $PM2_APP_NAME"
    echo -e "  Monitor:      pm2 monit"
    echo -e "  Restart:      pm2 restart $PM2_APP_NAME"
    echo -e "  Stop:         pm2 stop $PM2_APP_NAME"
    echo ""
}

# ============================================================================
# Main Function
# ============================================================================

main() {
    echo ""
    echo -e "${GREEN}🚀 HealthApp PM2 Deployment${NC}"
    echo -e "${GREEN}============================${NC}"
    echo ""

    parse_args "$@"

    cd "$PROJECT_ROOT"

    check_prerequisites

    # Schema validation and migration
    if check_schema_drift; then
        log_info "Schema validation passed"
    else
        create_migration
    fi

    install_dependencies
    generate_prisma
    build_application
    run_migrations
    run_seed
    manage_pm2
    print_summary

    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
