#!/bin/bash

# deploy-production.sh - Clean Production Deployment Script
# Usage: ./scripts/deploy-production.sh [OPTIONS]
# Purpose: Clean build and deployment for production environment

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
ENVIRONMENT="prod"
STACK_NAME="healthapp-prod"

# Options with defaults
CLEAN_BUILD=true
CLEANUP_VOLUMES=false
MIGRATE=true
SEED=false
SKIP_TESTS=false
AUTO_YES=false
DEBUG=false
CHECK_SCHEMA=true
CREATE_MIGRATION=false
MIGRATION_NAME=""

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
        log_error "Operation cancelled by user"
        exit 1
    fi
}

print_usage() {
    cat << EOF
🚀 HealthApp Production Deployment Script
==========================================

Clean build and deployment for production environment.

Usage: ./scripts/deploy-production.sh [OPTIONS]

OPTIONS:
  --no-clean              Skip clean build (use existing build artifacts)
  --cleanup-volumes       DANGER: Delete all data volumes (data loss!)
  --no-migrate           Skip database migrations
  --seed                 Run database seeders after deployment
  --skip-tests           Skip validation tests before deployment
  --no-schema-check      Skip Prisma schema drift detection
  --create-migration     Create new migration if schema changes detected
  --migration-name NAME  Name for new migration (requires --create-migration)
  --auto-yes             Skip all confirmation prompts
  --debug                Enable debug output
  --help                 Show this help message

EXAMPLES:
  # Standard production deployment with clean build and migrations
  ./scripts/deploy-production.sh

  # Create migration for schema changes during deployment
  ./scripts/deploy-production.sh --create-migration --migration-name "add_user_fields"

  # Deploy with schema check but skip migration creation (safe mode)
  ./scripts/deploy-production.sh

  # Clean deployment with seeding
  ./scripts/deploy-production.sh --seed

  # Deploy without clean build (faster, use existing build)
  ./scripts/deploy-production.sh --no-clean

  # Skip schema validation (not recommended)
  ./scripts/deploy-production.sh --no-schema-check

  # Complete fresh start with data wipe (DANGEROUS!)
  ./scripts/deploy-production.sh --cleanup-volumes

  # Skip all prompts for CI/CD
  ./scripts/deploy-production.sh --auto-yes

EOF
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-clean)
                CLEAN_BUILD=false
                shift
                ;;
            --cleanup-volumes)
                CLEANUP_VOLUMES=true
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
            --skip-tests)
                SKIP_TESTS=true
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

    # Check if running from project root
    if [ ! -f "package.json" ]; then
        log_error "Must run from project root directory"
        exit 1
    fi

    # Check for .env file
    if [ ! -f ".env" ]; then
        log_error ".env file not found in project root"
        log_info "Please ensure you have the correct .env file for production"
        exit 1
    fi

    log_success ".env file found"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is installed"

    # Check Docker Swarm
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        log_error "Docker Swarm is not active"
        log_info "Initialize swarm with: docker swarm init"
        exit 1
    fi
    log_success "Docker Swarm is active"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    log_success "Node.js $(node --version) is installed"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm --version) is installed"

    # Load environment variables
    set -a
    source .env
    set +a

    # Validate critical environment variables
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log_error "NEXTAUTH_SECRET not found in .env file"
        exit 1
    fi
    log_success "NEXTAUTH_SECRET is configured"

    if [ -z "${POSTGRES_PASSWORD:-}" ]; then
        log_error "POSTGRES_PASSWORD not found in .env file"
        exit 1
    fi
    log_success "POSTGRES_PASSWORD is configured"

    if [ -z "${DOMAIN:-}" ]; then
        log_warning "DOMAIN not configured in .env, using localhost"
        export DOMAIN="localhost"
    else
        log_success "DOMAIN is configured: $DOMAIN"
    fi

    log_success "All prerequisites met"
}

# ============================================================================
# Cleanup Functions
# ============================================================================

cleanup_old_deployment() {
    log_step "Cleaning Up Old Deployment"

    # Check if stack exists
    if docker stack ls --format "{{.Name}}" | grep -q "^$STACK_NAME$"; then
        log_info "Found existing stack: $STACK_NAME"
        confirm "Remove existing stack?"

        log_info "Removing stack..."
        docker stack rm "$STACK_NAME"

        log_info "Waiting for stack removal to complete..."
        local wait_time=0
        local max_wait=60
        while docker stack ls --format "{{.Name}}" | grep -q "^$STACK_NAME$"; do
            sleep 2
            wait_time=$((wait_time + 2))
            if [ $wait_time -ge $max_wait ]; then
                log_warning "Stack removal taking longer than expected"
                break
            fi
        done

        # Additional wait for cleanup
        sleep 10
        log_success "Stack removed"
    else
        log_info "No existing stack found"
    fi

    # Handle volume cleanup if requested
    if [ "$CLEANUP_VOLUMES" = true ]; then
        echo -e "${RED}================================================${NC}"
        echo -e "${RED}⚠️  PRODUCTION VOLUME DELETION WARNING ⚠️${NC}"
        echo -e "${RED}You are about to DELETE ALL PRODUCTION DATA!${NC}"
        echo -e "${RED}This includes database, uploads, and all persistent data${NC}"
        echo -e "${RED}================================================${NC}"

        if [ "$AUTO_YES" != true ]; then
            echo -e "${YELLOW}Type 'DELETE PRODUCTION DATA' to confirm:${NC}"
            read -r confirmation
            if [ "$confirmation" != "DELETE PRODUCTION DATA" ]; then
                log_error "Volume deletion cancelled"
                exit 1
            fi
        fi

        log_warning "Removing all production volumes..."
        local volume_prefix="${STACK_NAME}_"

        for volume in $(docker volume ls --format "{{.Name}}" | grep "^$volume_prefix"); do
            log_info "Removing volume: $volume"
            docker volume rm "$volume" 2>/dev/null || log_warning "Could not remove volume: $volume"
        done

        log_success "Volume cleanup complete"
    fi

    # Clean up dangling resources
    log_info "Cleaning up dangling Docker resources..."
    docker network prune -f >/dev/null 2>&1 || true
    if [ "$CLEANUP_VOLUMES" != true ]; then
        docker volume prune -f >/dev/null 2>&1 || true
    fi

    log_success "Cleanup complete"
}

clean_build_artifacts() {
    if [ "$CLEAN_BUILD" = true ]; then
        log_step "Cleaning Build Artifacts"

        # Remove Next.js build artifacts
        if [ -d ".next" ]; then
            log_info "Removing .next directory..."
            rm -rf .next
        fi

        # Remove compiled JavaScript files (keep seed.js)
        log_info "Removing compiled TypeScript files..."
        npm run clean 2>/dev/null || true

        # Remove Prisma generated client
        if [ -d "prisma/generated" ]; then
            log_info "Removing Prisma generated client..."
            rm -rf prisma/generated
        fi

        # Remove node_modules for truly clean build (optional, can be skipped)
        # Uncomment if you want completely fresh dependencies
        # if [ -d "node_modules" ]; then
        #     log_info "Removing node_modules..."
        #     rm -rf node_modules
        # fi

        log_success "Build artifacts cleaned"
    else
        log_info "Skipping clean build (using existing artifacts)"
    fi
}

# ============================================================================
# Build Functions
# ============================================================================

install_dependencies() {
    log_step "Installing Dependencies"

    log_info "Running npm install..."
    npm install

    log_success "Dependencies installed"
}

generate_prisma_client() {
    log_step "Generating Prisma Client"

    log_info "Running prisma generate..."
    npx prisma generate

    log_success "Prisma client generated"
}

check_schema_drift() {
    if [ "$CHECK_SCHEMA" = false ]; then
        log_info "Skipping schema drift detection"
        return 0
    fi

    log_step "Checking Prisma Schema for Changes"

    # Check if prisma schema file exists
    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "prisma/schema.prisma not found"
        exit 1
    fi

    log_info "Checking for unapplied schema changes..."

    # Check migration status
    log_info "Running prisma migrate status..."
    local migrate_status_output
    migrate_status_output=$(npx prisma migrate status 2>&1)
    local migrate_status_exit=$?

    log_debug "Migration status output:"
    log_debug "$migrate_status_output"

    # Check for various states
    if echo "$migrate_status_output" | grep -q "Database schema is up to date"; then
        log_success "✅ Schema is in sync - no changes detected"
        return 0
    elif echo "$migrate_status_output" | grep -q "Your database is not up to date"; then
        log_warning "⚠️  Database has pending migrations to apply"
        log_info "Migrations will be applied during deployment"
        return 0
    elif echo "$migrate_status_output" | grep -q "database schema is not in sync\|drift detected\|schema drift"; then
        log_warning "⚠️  SCHEMA DRIFT DETECTED!"
        log_warning "Your schema.prisma has changes not reflected in migrations"

        # Try to get detailed diff
        log_info "Getting schema diff..."
        local diff_output
        diff_output=$(npx prisma migrate diff \
            --from-schema-datamodel prisma/schema.prisma \
            --to-schema-datasource prisma/schema.prisma \
            --script 2>&1) || true

        if [ -n "$diff_output" ]; then
            log_info "Schema changes detected:"
            echo "$diff_output" | head -20
        fi

        if [ "$CREATE_MIGRATION" = true ]; then
            log_info "Creating new migration..."
            return 1  # Signal that migration needs to be created
        else
            log_error "Schema changes detected but --create-migration not specified"
            log_error "Options:"
            log_error "  1. Run with --create-migration --migration-name \"description\""
            log_error "  2. Create migration manually: npx prisma migrate dev --name <name>"
            log_error "  3. Use --no-schema-check to skip (NOT RECOMMENDED)"

            if [ "$AUTO_YES" = true ]; then
                log_error "Auto-yes mode: Aborting due to schema drift"
                exit 1
            fi

            confirm "Continue deployment anyway? (Schema drift will remain)"
            return 0
        fi
    elif echo "$migrate_status_output" | grep -q "No migration found"; then
        log_warning "⚠️  No migrations found in prisma/migrations directory"
        log_info "This might be a fresh setup"
        return 0
    else
        log_warning "Could not determine migration status"
        log_debug "Exit code: $migrate_status_exit"

        if [ "$AUTO_YES" != true ]; then
            confirm "Continue with deployment?"
        fi
        return 0
    fi
}

create_schema_migration() {
    if [ "$CREATE_MIGRATION" = false ]; then
        return 0
    fi

    log_step "Creating New Migration"

    if [ -z "$MIGRATION_NAME" ]; then
        log_error "Migration name is required for creating migrations"
        exit 1
    fi

    log_warning "⚠️  Creating migration in PRODUCTION environment"
    log_info "Migration name: $MIGRATION_NAME"

    if [ "$AUTO_YES" != true ]; then
        confirm "Create migration '$MIGRATION_NAME'?"
    fi

    log_info "Running prisma migrate dev..."

    # Create migration - this will:
    # 1. Compare schema.prisma with database
    # 2. Generate SQL migration file
    # 3. Apply migration to database
    # 4. Update _prisma_migrations table

    if npx prisma migrate dev --name "$MIGRATION_NAME" --skip-generate; then
        log_success "✅ Migration created successfully: $MIGRATION_NAME"

        # Show the generated migration file
        local latest_migration=$(ls -t prisma/migrations | head -1)
        if [ -n "$latest_migration" ]; then
            log_info "Migration file: prisma/migrations/$latest_migration"
            log_info "Migration SQL:"
            echo "================================================"
            cat "prisma/migrations/$latest_migration/migration.sql" || true
            echo "================================================"
        fi

        # Regenerate Prisma client with new schema
        log_info "Regenerating Prisma client..."
        npx prisma generate

        log_success "Migration created and applied"
        log_warning "⚠️  Remember to commit the new migration files to git!"
        log_info "  git add prisma/migrations"
        log_info "  git commit -m 'Add migration: $MIGRATION_NAME'"

        return 0
    else
        log_error "Failed to create migration"
        exit 1
    fi
}

validate_schema_consistency() {
    log_step "Validating Schema Consistency"

    log_info "Validating Prisma schema syntax..."
    if npx prisma validate; then
        log_success "✅ Schema syntax is valid"
    else
        log_error "Schema validation failed"
        exit 1
    fi

    log_info "Checking schema format..."
    if npx prisma format --check; then
        log_success "✅ Schema formatting is correct"
    else
        log_warning "⚠️  Schema formatting issues detected"
        log_info "Run 'npx prisma format' to auto-format"

        if [ "$AUTO_YES" != true ]; then
            confirm "Continue despite formatting issues?"
        fi
    fi

    log_success "Schema validation complete"
}

run_validation() {
    if [ "$SKIP_TESTS" = false ]; then
        log_step "Running Validation"

        log_info "Running linter..."
        npm run lint:check || log_warning "Linting found issues"

        log_info "Running type check..."
        npm run type-check || log_warning "Type check found issues"

        log_success "Validation complete"
    else
        log_info "Skipping validation tests"
    fi
}

build_docker_images() {
    log_step "Building Docker Images"

    log_info "Pulling base images..."
    docker pull node:22-alpine || log_warning "Failed to pull node:22-alpine"
    docker pull postgres:17-alpine || log_warning "Failed to pull postgres:17-alpine"
    docker pull redis:7.4-alpine || log_warning "Failed to pull redis:7.4-alpine"
    docker pull dpage/pgadmin4:latest || log_warning "Failed to pull pgadmin4"

    log_info "Building production application image..."
    if docker build \
        -t "healthapp:prod" \
        -f docker/Dockerfile.production \
        --build-arg DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}" \
        .; then
        log_success "Application image built successfully"
    else
        log_error "Failed to build application image"
        exit 1
    fi

    # Tag with timestamp for backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    docker tag "healthapp:prod" "healthapp:prod-${timestamp}"
    log_info "Tagged image as healthapp:prod-${timestamp}"

    log_success "Docker images built"
}

# ============================================================================
# Deployment Functions
# ============================================================================

deploy_stack() {
    log_step "Deploying to Docker Swarm"

    # Set environment variables for stack deployment
    export ENVIRONMENT="prod"
    export STACK_NAME="$STACK_NAME"
    export APP_IMAGE="healthapp:prod"
    export POSTGRES_IMAGE="postgres:17-alpine"
    export REDIS_IMAGE="redis:7.4-alpine"
    export PGADMIN_IMAGE="dpage/pgadmin4:latest"
    export DEPLOY_IMAGE="healthapp:prod"

    # Set defaults from .env or use sensible defaults
    export NODE_ENV="production"
    export PORT="${PORT:-3002}"
    export HOST_PORT_FRONTEND="${PORT:-3002}"
    export HOST_PORT_DB="${POSTGRES_PORT:-5432}"
    export HOST_PORT_REDIS="${REDIS_PORT:-6379}"
    export HOST_PORT_PGADMIN="${PGADMIN_PORT:-8084}"
    export REPLICAS_FRONTEND="${REPLICAS:-2}"
    export REPLICAS_POSTGRES="1"
    export REPLICAS_REDIS="1"
    export REPLICAS_PGADMIN="1"

    # Memory limits for production
    export POSTGRES_MEMORY_LIMIT="${POSTGRES_MEMORY_LIMIT:-1024M}"
    export POSTGRES_MEMORY_RESERVATION="${POSTGRES_MEMORY_RESERVATION:-512M}"
    export REDIS_MEMORY_LIMIT="${REDIS_MEMORY_LIMIT:-512M}"
    export REDIS_MEMORY_RESERVATION="${REDIS_MEMORY_RESERVATION:-256M}"
    export APP_MEMORY_LIMIT="${APP_MEMORY_LIMIT:-2048M}"
    export APP_MEMORY_RESERVATION="${APP_MEMORY_RESERVATION:-1024M}"
    export PGADMIN_MEMORY_LIMIT="${PGADMIN_MEMORY_LIMIT:-256M}"
    export PGADMIN_MEMORY_RESERVATION="${PGADMIN_MEMORY_RESERVATION:-128M}"

    log_info "Deployment configuration:"
    log_info "  Stack Name: $STACK_NAME"
    log_info "  Domain: ${DOMAIN:-localhost}"
    log_info "  Frontend Port: $HOST_PORT_FRONTEND"
    log_info "  App Replicas: $REPLICAS_FRONTEND"
    log_info "  Database: ${POSTGRES_DB:-healthapp_prod}"

    confirm "Deploy with above configuration?"

    # Deploy the stack
    log_info "Deploying stack to Docker Swarm..."
    if docker stack deploy -c docker/docker-stack.yml "$STACK_NAME"; then
        log_success "Stack deployment initiated"
    else
        log_error "Stack deployment failed"
        exit 1
    fi

    log_success "Deployment initiated"
}

wait_for_services() {
    log_step "Waiting for Services to Start"

    log_info "Waiting for PostgreSQL..."
    local max_wait=180
    local wait_time=0
    local container_id=""

    while [ $wait_time -lt $max_wait ]; do
        container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -1)

        if [ -n "$container_id" ]; then
            if docker exec "$container_id" pg_isready -U "${POSTGRES_USER:-healthapp_user}" >/dev/null 2>&1; then
                log_success "PostgreSQL is ready"
                break
            fi
        fi

        sleep 5
        wait_time=$((wait_time + 5))
        log_debug "Waiting for PostgreSQL... ${wait_time}s"
    done

    if [ $wait_time -ge $max_wait ]; then
        log_error "PostgreSQL failed to start within ${max_wait} seconds"
        exit 1
    fi

    # Additional stabilization wait
    log_info "Waiting for PostgreSQL to stabilize..."
    sleep "${POSTGRES_ADDITIONAL_WAIT:-30}"

    log_info "Waiting for application containers..."
    wait_time=0
    max_wait=120

    while [ $wait_time -lt $max_wait ]; do
        local service_status=$(docker service ls --filter "name=${STACK_NAME}_app" --format "{{.Replicas}}")

        if [[ "$service_status" =~ ^([0-9]+)/([0-9]+)$ ]]; then
            local running="${BASH_REMATCH[1]}"
            local desired="${BASH_REMATCH[2]}"

            if [ "$running" -eq "$desired" ] && [ "$running" -gt 0 ]; then
                log_success "Application containers are ready ($running/$desired)"
                break
            fi
        fi

        sleep 5
        wait_time=$((wait_time + 5))
        log_debug "Waiting for app containers... ${wait_time}s"
    done

    if [ $wait_time -ge $max_wait ]; then
        log_error "Application containers failed to start"
        exit 1
    fi

    # Additional wait for app initialization
    log_info "Waiting for application initialization..."
    sleep 20

    log_success "All services are running"
}

# ============================================================================
# Post-Deployment Functions
# ============================================================================

run_migrations() {
    if [ "$MIGRATE" = true ]; then
        log_step "Running Database Migrations"

        # Find app container
        local container_id=""
        local max_retries=10
        local retry_count=0

        while [ $retry_count -lt $max_retries ] && [ -z "$container_id" ]; do
            container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)

            if [ -z "$container_id" ]; then
                retry_count=$((retry_count + 1))
                log_debug "Looking for app container, attempt $retry_count/$max_retries"
                sleep 3
            fi
        done

        if [ -z "$container_id" ]; then
            log_error "No running app containers found for migrations"
            exit 1
        fi

        log_info "Found app container: $container_id"

        # Generate Prisma client first
        log_info "Generating Prisma client in container..."
        docker exec "$container_id" npx prisma generate || log_warning "Prisma generate failed"

        # Run migrations
        log_info "Running Prisma migrations..."
        if docker exec "$container_id" npx prisma migrate deploy; then
            log_success "Migrations completed successfully"
        else
            log_error "Migration failed"
            exit 1
        fi

        # Validate database connection
        log_info "Validating database connection..."
        if docker exec "$container_id" node -e "const { PrismaClient } = require('./prisma/generated/prisma'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); })"; then
            log_success "Database validation successful"
        else
            log_warning "Database validation failed"
        fi
    else
        log_info "Skipping database migrations"
    fi
}

run_seed() {
    if [ "$SEED" = true ]; then
        log_step "Running Database Seeding"

        # Find app container
        local container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)

        if [ -z "$container_id" ]; then
            log_error "No running app containers found for seeding"
            exit 1
        fi

        log_info "Found app container: $container_id"

        log_warning "Seeding production database..."
        confirm "Run database seeding on PRODUCTION?"

        if docker exec "$container_id" npx prisma db seed; then
            log_success "Seeding completed successfully"
        else
            log_warning "Seeding failed (may already have data)"
        fi
    else
        log_info "Skipping database seeding"
    fi
}

verify_deployment() {
    log_step "Verifying Deployment"

    # Check service status
    log_info "Service status:"
    docker stack services "$STACK_NAME" --format "table {{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}"

    # Check if services are running
    local app_replicas=$(docker service ls --filter "name=${STACK_NAME}_app" --format "{{.Replicas}}")
    log_info "App service: $app_replicas"

    # Test health endpoint
    log_info "Testing health endpoint..."
    local health_url="http://${DOMAIN:-localhost}:${PORT:-3002}/api/health"

    sleep 5  # Brief wait before health check

    if curl -f -s "$health_url" > /dev/null; then
        log_success "Health check passed"
    else
        log_warning "Health check failed (service may still be starting)"
    fi

    log_success "Deployment verification complete"
}

print_deployment_summary() {
    log_step "Deployment Summary"

    echo ""
    echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}Access Points:${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo -e "  Frontend:     http://${DOMAIN:-localhost}:${PORT:-3002}"
    echo -e "  API:          http://${DOMAIN:-localhost}:${PORT:-3002}/api"
    echo -e "  Health Check: http://${DOMAIN:-localhost}:${PORT:-3002}/api/health"
    echo -e "  PgAdmin:      http://${DOMAIN:-localhost}:${PGADMIN_PORT:-8084}"
    echo ""
    echo -e "${CYAN}Database:${NC}"
    echo -e "  Host:         ${DOMAIN:-localhost}"
    echo -e "  Port:         ${POSTGRES_PORT:-5432}"
    echo -e "  Database:     ${POSTGRES_DB:-healthapp_prod}"
    echo -e "  User:         ${POSTGRES_USER:-healthapp_user}"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:    docker service logs -f ${STACK_NAME}_app"
    echo -e "  View status:  docker stack services ${STACK_NAME}"
    echo -e "  Scale app:    docker service scale ${STACK_NAME}_app=N"
    echo -e "  Stop stack:   docker stack rm ${STACK_NAME}"
    echo -e "${CYAN}================================================${NC}"
    echo ""
}

# ============================================================================
# Main Function
# ============================================================================

main() {
    echo ""
    echo -e "${GREEN}🚀 HealthApp Production Deployment${NC}"
    echo -e "${GREEN}====================================${NC}"
    echo ""

    parse_args "$@"

    check_prerequisites
    cleanup_old_deployment
    clean_build_artifacts

    if [ "$CLEAN_BUILD" = true ]; then
        install_dependencies
        generate_prisma_client

        # Schema validation and migration handling
        validate_schema_consistency

        # Check for schema drift and handle migration creation
        if check_schema_drift; then
            log_info "Schema check passed"
        else
            # Schema drift detected - create migration if requested
            create_schema_migration
        fi

        run_validation
    fi

    build_docker_images
    deploy_stack
    wait_for_services
    run_migrations
    run_seed
    verify_deployment
    print_deployment_summary

    log_success "Production deployment completed successfully!"
}

# Run main function
main "$@"
