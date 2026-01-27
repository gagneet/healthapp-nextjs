#!/bin/bash

# deploy-unified.sh - Comprehensive Deployment Script with Docker/PM2 Choice
# Usage: ./scripts/deploy-unified.sh [MODE] [OPTIONS]
# Purpose: Unified deployment supporting both Docker Swarm and PM2 methods

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

# Deployment mode
DEPLOY_MODE=""  # docker or pm2

# Common options
ENVIRONMENT="prod"
MIGRATE=true
SEED=false
CHECK_SCHEMA=true
CREATE_MIGRATION=false
MIGRATION_NAME=""
AUTO_YES=false
DEBUG=false

# Docker-specific options
CLEAN_BUILD=true
CLEANUP_VOLUMES=false
SKIP_TESTS=false
DOCKERFILE="docker/Dockerfile.production.fixed"
STACK_NAME="healthapp-prod"
REPLICAS=2

# PM2-specific options
SKIP_INSTALL=false
SKIP_BUILD=false
PM2_APP_NAME="healthapp-nextjs"

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
🚀 HealthApp Unified Deployment Script
=======================================

Supports both Docker Swarm and PM2 deployment methods.

Usage: ./scripts/deploy-unified.sh [MODE] [OPTIONS]

DEPLOYMENT MODES:
  docker              Deploy using Docker Swarm (containerized, scalable)
  pm2                 Deploy using PM2 on host (simple, direct)

COMMON OPTIONS:
  --no-migrate        Skip database migrations
  --seed              Run database seeders
  --no-schema-check   Skip Prisma schema validation
  --create-migration  Create migration if schema drift detected
  --migration-name    Name for new migration
  --auto-yes          Skip all confirmation prompts
  --debug             Enable debug output
  --help              Show this help

DOCKER-SPECIFIC OPTIONS:
  --no-clean          Skip clean build
  --cleanup-volumes   DANGER: Delete all data volumes
  --skip-tests        Skip validation tests
  --replicas N        Number of app replicas (default: 2)

PM2-SPECIFIC OPTIONS:
  --skip-install      Skip npm install
  --skip-build        Skip build step

EXAMPLES:
  # Deploy with Docker Swarm
  ./scripts/deploy-unified.sh docker

  # Deploy with PM2 (simple)
  ./scripts/deploy-unified.sh pm2

  # Quick PM2 restart
  ./scripts/deploy-unified.sh pm2 --skip-install --skip-build

  # Docker with migration
  ./scripts/deploy-unified.sh docker --create-migration --migration-name "add_fields"

  # PM2 with seeding
  ./scripts/deploy-unified.sh pm2 --seed

  # Docker with custom replicas
  ./scripts/deploy-unified.sh docker --replicas 4

EOF
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    if [ $# -eq 0 ]; then
        print_usage
        exit 1
    fi

    # First argument must be deployment mode
    DEPLOY_MODE="$1"
    shift

    if [[ ! "$DEPLOY_MODE" =~ ^(docker|pm2)$ ]]; then
        log_error "Invalid deployment mode: $DEPLOY_MODE"
        log_error "Must be 'docker' or 'pm2'"
        print_usage
        exit 1
    fi

    # Parse remaining arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
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
            # Docker-specific
            --no-clean)
                CLEAN_BUILD=false
                shift
                ;;
            --cleanup-volumes)
                CLEANUP_VOLUMES=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --replicas)
                REPLICAS="$2"
                shift 2
                ;;
            # PM2-specific
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
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

    cd "$PROJECT_ROOT"

    # Common checks
    if [ ! -f "package.json" ]; then
        log_error "Must run from project root"
        exit 1
    fi

    if [ ! -f ".env" ]; then
        log_error ".env file not found"
        exit 1
    fi
    log_success ".env file found"

    if ! command -v node &> /dev/null; then
        log_error "Node.js not installed"
        exit 1
    fi
    log_success "Node.js $(node --version) installed"

    if ! command -v npm &> /dev/null; then
        log_error "npm not installed"
        exit 1
    fi
    log_success "npm $(npm --version) installed"

    # Mode-specific checks
    if [ "$DEPLOY_MODE" = "docker" ]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker not installed"
            exit 1
        fi
        log_success "Docker installed"

        if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
            log_error "Docker Swarm not active. Run: docker swarm init"
            exit 1
        fi
        log_success "Docker Swarm active"
    elif [ "$DEPLOY_MODE" = "pm2" ]; then
        if ! command -v pm2 &> /dev/null; then
            log_error "PM2 not installed. Run: npm install -g pm2"
            exit 1
        fi
        log_success "PM2 $(pm2 --version) installed"
    fi

    # Load environment
    set -a
    source .env
    set +a

    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log_error "NEXTAUTH_SECRET not in .env"
        exit 1
    fi
    log_success "Environment variables loaded"

    log_success "All prerequisites met"
}

# ============================================================================
# Schema Validation Functions (Shared)
# ============================================================================

check_schema_drift() {
    if [ "$CHECK_SCHEMA" = false ]; then
        log_info "Skipping schema validation"
        return 0
    fi

    log_step "Validating Prisma Schema"

    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "prisma/schema.prisma not found"
        exit 1
    fi

    log_info "Validating schema syntax..."
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
            log_error "  1. Use --create-migration --migration-name \"desc\""
            log_error "  2. Create manually: npx prisma migrate dev"
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

        local latest=$(ls -t prisma/migrations 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            log_info "Migration: prisma/migrations/$latest"
            log_warning "Remember to commit migration files!"
        fi

        npx prisma generate
    else
        log_error "Migration creation failed"
        exit 1
    fi
}

# ============================================================================
# Docker Deployment Functions
# ============================================================================

deploy_docker() {
    log_step "Docker Swarm Deployment"

    # Clean build artifacts if requested
    if [ "$CLEAN_BUILD" = true ]; then
        log_info "Cleaning build artifacts..."
        rm -rf .next 2>/dev/null || true
        rm -rf prisma/generated 2>/dev/null || true
    fi

    # Check if stack exists and remove it
    if docker stack ls --format "{{.Name}}" | grep -q "^$STACK_NAME$"; then
        log_info "Removing existing stack: $STACK_NAME"
        confirm "Remove existing stack?"
        docker stack rm "$STACK_NAME"
        sleep 15
    fi

    # Handle volume cleanup if requested
    if [ "$CLEANUP_VOLUMES" = true ]; then
        log_warning "⚠️  Volume cleanup requested - DATA WILL BE DELETED!"
        confirm "Delete all data volumes?"

        for volume in $(docker volume ls --format "{{.Name}}" | grep "^${STACK_NAME}_"); do
            log_info "Removing volume: $volume"
            docker volume rm "$volume" 2>/dev/null || true
        done
    fi

    # Install dependencies and generate Prisma
    log_info "Installing dependencies..."
    npm install

    log_info "Generating Prisma client..."
    npx prisma generate

    # Build Docker image
    log_step "Building Docker Image"

    # Clean Docker build cache
    log_info "Cleaning Docker build cache..."
    docker buildx prune -f > /dev/null 2>&1 || true

    log_info "Building application image..."
    if docker build \
        -t "healthapp:prod" \
        -f "$DOCKERFILE" \
        --build-arg DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}" \
        --progress=plain \
        .; then
        log_success "✅ Image built successfully"
    else
        log_error "Docker build failed"
        exit 1
    fi

    # Deploy stack
    log_step "Deploying to Docker Swarm"

    export ENVIRONMENT="prod"
    export STACK_NAME="$STACK_NAME"
    export APP_IMAGE="healthapp:prod"
    export REPLICAS_FRONTEND="$REPLICAS"
    export NODE_ENV="production"

    if docker stack deploy -c docker/docker-stack.yml "$STACK_NAME"; then
        log_success "✅ Stack deployed"
    else
        log_error "Stack deployment failed"
        exit 1
    fi

    # Wait for services
    log_info "Waiting for services to start..."
    sleep 30

    # Run migrations in container
    if [ "$MIGRATE" = true ]; then
        log_info "Running migrations in container..."
        local container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)

        if [ -n "$container_id" ]; then
            docker exec "$container_id" npx prisma migrate deploy
            log_success "✅ Migrations applied"
        else
            log_warning "Could not find container for migrations"
        fi
    fi

    # Print summary
    log_step "Docker Deployment Complete"
    echo ""
    echo -e "${GREEN}🎉 Docker Swarm Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}Stack: $STACK_NAME${NC}"
    docker stack services "$STACK_NAME"
    echo ""
    echo -e "${CYAN}Access:${NC}"
    echo -e "  Frontend: http://localhost:${PORT:-3002}"
    echo ""
}

# ============================================================================
# PM2 Deployment Functions
# ============================================================================

deploy_pm2() {
    log_step "PM2 Deployment"

    # Install dependencies
    if [ "$SKIP_INSTALL" = false ]; then
        log_info "Installing dependencies..."
        npm install
    fi

    # Generate Prisma
    log_info "Generating Prisma client..."
    npx prisma generate

    # Build application
    if [ "$SKIP_BUILD" = false ]; then
        log_info "Building application..."
        npm run build
    fi

    # Run migrations
    if [ "$MIGRATE" = true ]; then
        log_info "Running migrations..."
        npx prisma migrate deploy
        log_success "✅ Migrations applied"
    fi

    # Run seeding
    if [ "$SEED" = true ]; then
        log_warning "Seeding database..."
        confirm "Run seeding?"
        npx prisma db seed || log_warning "Seeding failed"
    fi

    # Manage PM2
    log_info "Managing PM2 process..."

    if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
        log_info "Restarting PM2 app..."
        pm2 restart "$PM2_APP_NAME"
    else
        log_info "Starting PM2 app..."
        pm2 start ecosystem.config.cjs
    fi

    pm2 save > /dev/null 2>&1 || true

    # Print summary
    log_step "PM2 Deployment Complete"
    echo ""
    echo -e "${GREEN}🎉 PM2 Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}Status:${NC}"
    pm2 list | grep "$PM2_APP_NAME"
    echo ""
    echo -e "${CYAN}Access:${NC}"
    echo -e "  Frontend: http://localhost:${PORT:-3002}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "  Logs:    pm2 logs $PM2_APP_NAME"
    echo -e "  Monitor: pm2 monit"
    echo ""
}

# ============================================================================
# Main Function
# ============================================================================

main() {
    echo ""
    echo -e "${GREEN}🚀 HealthApp Unified Deployment${NC}"
    echo -e "${GREEN}Mode: ${DEPLOY_MODE^^}${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""

    parse_args "$@"

    check_prerequisites

    # Schema validation (shared)
    if check_schema_drift; then
        log_info "Schema validation passed"
    else
        create_migration
    fi

    # Deploy based on mode
    if [ "$DEPLOY_MODE" = "docker" ]; then
        deploy_docker
    elif [ "$DEPLOY_MODE" = "pm2" ]; then
        deploy_pm2
    fi

    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
