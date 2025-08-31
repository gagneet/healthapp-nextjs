#!/bin/bash

# deploy.sh - Universal HealthApp Deployment Script
# Usage: ./scripts/deploy.sh [dev|test|prod] [COMMAND] [OPTIONS]
# Purpose: Unified deployment for dev, test, and production environments using Docker Swarm

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
# Environment File Check
# ============================================================================

check_env_file() {
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ ERROR: .env file not found in application root!${NC}"
        echo -e "${YELLOW}📋 Required .env file is missing from the application root directory.${NC}"
        echo ""
        echo -e "${CYAN}Please copy the correct .env file to the application root before deployment:${NC}"
        echo -e "   ${GREEN}cp path/to/your/.env.dev .env${NC}     # For development environment"
        echo -e "   ${GREEN}cp path/to/your/.env.test .env${NC}    # For test environment"
        echo -e "   ${GREEN}cp path/to/your/.env.prod .env${NC}    # For production environment"
        echo ""
        echo -e "${RED}Deployment cannot continue without the .env file.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ .env file found in application root${NC}"
    fi
}

# Run environment file check immediately
echo -e "${BLUE}🔍 Checking for .env file...${NC}"
check_env_file

# ============================================================================
# Default Configuration Values
# ============================================================================

DEFAULT_PORT_FRONTEND=3002
DEFAULT_PORT_BACKEND=5001
DEFAULT_PORT_DB=5432
DEFAULT_PORT_REDIS=6379
DEFAULT_PORT_PGADMIN=5050

DEFAULT_REPLICAS_DEV=1
DEFAULT_REPLICAS_TEST=2
DEFAULT_REPLICAS_PROD=2

DEFAULT_DOMAIN="localhost"
DEFAULT_ENV_FILE=".env"

# Runtime Variables
ENVIRONMENT=""
COMMAND=""
DOMAIN="$DEFAULT_DOMAIN"
ENV_FILE="$DEFAULT_ENV_FILE"

PORT_FRONTEND="$DEFAULT_PORT_FRONTEND"
PORT_BACKEND="$DEFAULT_PORT_BACKEND"
PORT_DB="$DEFAULT_PORT_DB"
PORT_REDIS="$DEFAULT_PORT_REDIS"
PORT_PGLADMIN="$DEFAULT_PORT_PGADMIN"

REPLICAS=""
MIGRATE=false
SEED=false
CLEANUP=false
CLEANUP_VOLUMES=false
AUTO_YES=false
SKIP_BUILD=false
SKIP_IMAGE_PULL=false
EARLY_DB_START=true
DB_ALREADY_DEPLOYED=false

# ============================================================================
# Helper Functions
# ============================================================================

print_usage() {
    cat << EOF
🚀 HealthApp Consolidated Deployment Script
=============================================

Usage: ./scripts/deploy.sh [ENVIRONMENT] [COMMAND] [OPTIONS]

ENVIRONMENTS:
  dev          Development environment (local development)
  test         Test environment (QA and testing)  
  prod         Production environment (live deployment)

COMMANDS:
  deploy       Deploy complete stack to Docker Swarm
  update       Update running services with latest code
  stop         Remove stack from swarm (keeps data volumes)
  restart      Stop and redeploy stack
  logs         Show service logs (specify service name or see all)
  status       Show comprehensive service status and health
  ps           Show running containers and tasks
  migrate      Run database migrations only
  seed         Run database seeders only
  backup       Backup database
  cleanup      Clean up environment (removes compiled files, Docker stacks, networks)
  scale        Scale specific service up/down

OPTIONS:
  --domain DOMAIN            Domain/IP for the application (default: auto-detect or localhost)
  --env-file FILE            Environment file to load (default: .env)
  --port-frontend PORT       Frontend port (default: 3002)
  --port-backend PORT        Backend port (default: 5001)
  --port-db PORT             Database port (default: 5432)
  --port-redis PORT          Redis port (default: 6379)
  --port-pgadmin PORT        PgAdmin port (default: 5050)
  --replicas N               Number of app replicas (default: dev=1, test=2, prod=2)
  --migrate                  Run database migrations after deployment
  --seed                     Run database seeders after deployment
  --cleanup                  Clean up before deployment (compiled files + Docker resources)
  --cleanup-volumes          DANGER: Also remove data volumes during cleanup (data loss!)
  --no-early-db              Don't start database services early (default: start early)
  --skip-build              Skip Docker image building
  --skip-image-pull         Skip pulling base images
  --auto-yes                Skip all confirmation prompts
  --debug                   Enable debug output

EXAMPLES:
  ./scripts/deploy.sh dev deploy --migrate --seed
  ./scripts/deploy.sh test deploy --domain test.healthapp.com --migrate --seed
  ./scripts/deploy.sh prod deploy --domain healthapp.com --migrate
  ./scripts/deploy.sh test stop

EOF
}

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

log_deploy() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

log_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
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

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    if [ $# -eq 0 ]; then
        print_usage
        exit 1
    fi

    # First argument must be environment
    ENVIRONMENT="$1"
    shift

    if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Must be one of: dev, test, prod"
        exit 1
    fi

    # Second argument must be command
    if [ $# -eq 0 ]; then
        log_error "Command required"
        print_usage
        exit 1
    fi

    COMMAND="$1"
    shift

    # Initialize variables to track command line overrides
    CMD_LINE_DOMAIN=""

    # Parse remaining arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                CMD_LINE_DOMAIN="$2"
                DOMAIN="$2"
                shift 2
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --port-frontend)
                PORT_FRONTEND="$2"
                shift 2
                ;;
            --port-backend)
                PORT_BACKEND="$2"
                shift 2
                ;;
            --port-db)
                PORT_DB="$2"
                shift 2
                ;;
            --port-redis)
                PORT_REDIS="$2"
                shift 2
                ;;
            --port-pgadmin)
                PORT_PGADMIN="$2"
                shift 2
                ;;
            --replicas)
                REPLICAS="$2"
                shift 2
                ;;
            --migrate)
                MIGRATE=true
                shift
                ;;
            --seed)
                SEED=true
                shift
                ;;
            --cleanup)
                CLEANUP=true
                shift
                ;;
            --cleanup-volumes)
                CLEANUP_VOLUMES=true
                CLEANUP=true
                shift
                ;;
            --no-early-db)
                EARLY_DB_START=false
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-image-pull)
                SKIP_IMAGE_PULL=true
                shift
                ;;
            --auto-yes)
                AUTO_YES=true
                shift
                ;;
            --debug)
                export DEBUG=true
                shift
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Set default replicas based on environment if not specified
    if [ -z "$REPLICAS" ]; then
        case $ENVIRONMENT in
            dev)
                REPLICAS="$DEFAULT_REPLICAS_DEV"
                ;;
            test)
                REPLICAS="$DEFAULT_REPLICAS_TEST"
                ;;
            prod)
                REPLICAS="$DEFAULT_REPLICAS_PROD"
                ;;
        esac
    fi
}

# ============================================================================
# Environment Setup Functions
# ============================================================================

setup_environment() {
    log_info "Setting up $ENVIRONMENT environment..."

    # Store the command-line environment parameter
    local DEPLOYMENT_ENV="$ENVIRONMENT"

    # Load base environment file first
    if [ -f ".env" ]; then
        log_info "Loading base environment from .env"
        set -a
        source ".env"
        set +a
    fi

    # Load environment-specific file if it exists
    local env_specific_file=".env.$DEPLOYMENT_ENV"
    if [ -f "$env_specific_file" ]; then
        log_info "Loading environment-specific config from $env_specific_file"
        set -a
        source "$env_specific_file"
        set +a
    elif [ "$ENV_FILE" != ".env" ] && [ -f "$ENV_FILE" ]; then
        log_info "Loading environment from custom file: $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    fi

    # Restore the deployment environment
    export ENVIRONMENT="$DEPLOYMENT_ENV"

    # Command line --domain parameter takes precedence
    if [ -n "$CMD_LINE_DOMAIN" ]; then
        export DOMAIN="$CMD_LINE_DOMAIN"
        log_info "Using domain from command line: $DOMAIN"
    elif [ -n "${DOMAIN:-}" ] && [ "$DOMAIN" != "localhost" ]; then
        log_info "Using domain from .env file: $DOMAIN"
    else
        log_error "DOMAIN not specified in .env file or command line"
        exit 1
    fi

    # Set PostgreSQL version
    export POSTGRES_VERSION="${POSTGRES_VERSION:-17}"
    log_debug "Using PostgreSQL version: $POSTGRES_VERSION"

    # Set derived variables
    export APP_NAME="${STACK_NAME_PREFIX:-healthapp}"
    export STACK_NAME="${STACK_NAME_PREFIX:-healthapp}-$ENVIRONMENT"
    export DOCKER_STACK_FILE="docker/docker-stack.yml"

    # Docker registry configuration
    export DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
    if [ -n "$DOCKER_REGISTRY" ]; then
        log_info "Docker registry configured: $DOCKER_REGISTRY"
    fi

    # The image name will be set during build
    export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"

    # Port configuration
    export HOST_PORT_FRONTEND="${PORT_FRONTEND:-3002}"
    export HOST_PORT_BACKEND="${PORT_BACKEND:-3002}"
    export HOST_PORT_DB="${PORT_DB:-5432}"
    export HOST_PORT_REDIS="${PORT_REDIS:-6379}"
    export HOST_PORT_PGADMIN="${PORT_PGADMIN:-5050}"

    # Application URLs
    export FRONTEND_URL="${FRONTEND_URL:-http://$DOMAIN:$HOST_PORT_FRONTEND}"
    export BACKEND_URL="${BACKEND_URL:-$FRONTEND_URL}"
    export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-$FRONTEND_URL/api}"

    # Environment-specific database name
    if [[ "$DATABASE_URL" == *"healthapp_dev"* ]] && [ "$ENVIRONMENT" != "dev" ]; then
        export POSTGRES_DB="healthapp_$ENVIRONMENT"
        export DATABASE_URL=$(echo "$DATABASE_URL" | sed "s/healthapp_dev/healthapp_$ENVIRONMENT/")
        log_info "Updated DATABASE_URL for $ENVIRONMENT environment"
    fi

    # Replace localhost with postgres for container networking
    if [[ "$DATABASE_URL" == *"@localhost"* ]]; then
        export DATABASE_URL=${DATABASE_URL//@localhost/@postgres}
        log_info "Updated DATABASE_URL for container networking"
    fi

    # Auth.js configuration
    export NEXTAUTH_URL="${NEXTAUTH_URL:-$FRONTEND_URL}"
    export AUTH_SECRET="${AUTH_SECRET:-$NEXTAUTH_SECRET}"

    # Validate required variables
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log_error "NEXTAUTH_SECRET not found in .env file. Please add it."
        exit 1
    fi

    # Environment-specific defaults
    case $ENVIRONMENT in
        dev)
            export NODE_ENV="development"
            export LOG_LEVEL="${LOG_LEVEL:-debug}"
            export DEBUG="${DEBUG:-true}"
            export POSTGRES_MEMORY_LIMIT="${POSTGRES_MEMORY_LIMIT:-512M}"
            export POSTGRES_MEMORY_RESERVATION="${POSTGRES_MEMORY_RESERVATION:-256M}"
            export REDIS_MEMORY_LIMIT="${REDIS_MEMORY_LIMIT:-256M}"
            export REDIS_MEMORY_RESERVATION="${REDIS_MEMORY_RESERVATION:-128M}"
            export APP_MEMORY_LIMIT="${APP_MEMORY_LIMIT:-1024M}"
            export APP_MEMORY_RESERVATION="${APP_MEMORY_RESERVATION:-512M}"
            export PGADMIN_MEMORY_LIMIT="${PGADMIN_MEMORY_LIMIT:-256M}"
            export PGADMIN_MEMORY_RESERVATION="${PGADMIN_MEMORY_RESERVATION:-128M}"
            export POSTGRES_LOG_STATEMENT="${POSTGRES_LOG_STATEMENT:-all}"
            export PGADMIN_SERVER_MODE="${PGADMIN_SERVER_MODE:-False}"
            export NETWORK_ENCRYPTED="${NETWORK_ENCRYPTED:-false}"
            ;;
        test)
            export NODE_ENV="production"
            export LOG_LEVEL="${LOG_LEVEL:-info}"  
            export DEBUG="${DEBUG:-false}"
            export POSTGRES_MEMORY_LIMIT="${POSTGRES_MEMORY_LIMIT:-512M}"
            export POSTGRES_MEMORY_RESERVATION="${POSTGRES_MEMORY_RESERVATION:-256M}"
            export REDIS_MEMORY_LIMIT="${REDIS_MEMORY_LIMIT:-256M}"
            export REDIS_MEMORY_RESERVATION="${REDIS_MEMORY_RESERVATION:-128M}"
            export APP_MEMORY_LIMIT="${APP_MEMORY_LIMIT:-1024M}"
            export APP_MEMORY_RESERVATION="${APP_MEMORY_RESERVATION:-512M}"
            export PGADMIN_MEMORY_LIMIT="${PGADMIN_MEMORY_LIMIT:-256M}"
            export PGADMIN_MEMORY_RESERVATION="${PGADMIN_MEMORY_RESERVATION:-128M}"
            export POSTGRES_LOG_STATEMENT="${POSTGRES_LOG_STATEMENT:-none}"
            export PGADMIN_SERVER_MODE="${PGADMIN_SERVER_MODE:-True}"
            export NETWORK_ENCRYPTED="${NETWORK_ENCRYPTED:-false}"
            ;;
        prod)
            export NODE_ENV="production"
            export LOG_LEVEL="${LOG_LEVEL:-warn}"
            export DEBUG="${DEBUG:-false}"
            export POSTGRES_MEMORY_LIMIT="${POSTGRES_MEMORY_LIMIT:-1024M}"
            export POSTGRES_MEMORY_RESERVATION="${POSTGRES_MEMORY_RESERVATION:-512M}"
            export REDIS_MEMORY_LIMIT="${REDIS_MEMORY_LIMIT:-512M}"
            export REDIS_MEMORY_RESERVATION="${REDIS_MEMORY_RESERVATION:-256M}"
            export APP_MEMORY_LIMIT="${APP_MEMORY_LIMIT:-2048M}"
            export APP_MEMORY_RESERVATION="${APP_MEMORY_RESERVATION:-1024M}"
            export PGADMIN_MEMORY_LIMIT="${PGADMIN_MEMORY_LIMIT:-256M}"
            export PGADMIN_MEMORY_RESERVATION="${PGADMIN_MEMORY_RESERVATION:-128M}"
            export POSTGRES_LOG_STATEMENT="${POSTGRES_LOG_STATEMENT:-none}"
            export PGADMIN_SERVER_MODE="${PGADMIN_SERVER_MODE:-True}"
            export PGADMIN_MASTER_PASSWORD_REQUIRED="${PGADMIN_MASTER_PASSWORD_REQUIRED:-True}"
            export NETWORK_ENCRYPTED="${NETWORK_ENCRYPTED:-true}"
            export POSTGRES_MAX_CONNECTIONS="${POSTGRES_MAX_CONNECTIONS:-500}"
            export POSTGRES_SHARED_BUFFERS="${POSTGRES_SHARED_BUFFERS:-256MB}"
            export POSTGRES_EFFECTIVE_CACHE="${POSTGRES_EFFECTIVE_CACHE:-512MB}"
            export POSTGRES_MAINTENANCE_MEM="${POSTGRES_MAINTENANCE_MEM:-64MB}"
            export REDIS_MAX_MEMORY="${REDIS_MAX_MEMORY:-512mb}"
            ;;
    esac

    # Service scaling
    export REPLICAS_FRONTEND="${REPLICAS:-2}"
    export REPLICAS_POSTGRES="1"
    export REPLICAS_REDIS="1"
    export REPLICAS_PGADMIN="1"

    # Set Docker images with environment-specific tags
    export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"
    export APP_IMAGE="${APP_IMAGE:-healthapp:$ENVIRONMENT}"
    export POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:${POSTGRES_VERSION:-17}-alpine}"
    export REDIS_IMAGE="${REDIS_IMAGE:-redis:7.4-alpine}"
    export PGADMIN_IMAGE="${PGADMIN_IMAGE:-dpage/pgadmin4:latest}"

    # Configure Redis URL
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        export REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"
    else
        export REDIS_URL="redis://redis:6379"
    fi

    log_success "Environment setup complete"
    log_info "Using configuration:"
    log_info "  - Domain: $DOMAIN"
    log_info "  - Frontend URL: $FRONTEND_URL"
    log_info "  - Database: ${POSTGRES_DB:-healthapp_test}"
    log_info "  - PostgreSQL Version: $POSTGRES_VERSION"
    log_info "  - Replicas: $REPLICAS_FRONTEND"
}

# ============================================================================
# Docker Swarm Functions
# ============================================================================

check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        log_error "Docker Swarm is not active"
        log_info "Initialize swarm with: docker swarm init"
        exit 1
    fi
    log_success "Docker Swarm is active"
}

cleanup_environment() {
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up existing deployment..."

        # Remove existing stack
        if docker stack ls --format "table {{.Name}}" | grep -q "^$STACK_NAME$"; then
            log_info "Removing existing stack: $STACK_NAME"
            docker stack rm "$STACK_NAME"

            # Wait for cleanup
            log_info "Waiting for cleanup to complete..."
            sleep 15
        fi

        # Handle volume cleanup if requested
        if [ "$CLEANUP_VOLUMES" = true ]; then
            log_warning "⚠️  Volume cleanup requested - THIS WILL DELETE ALL DATA!"
            
            if [ "$ENVIRONMENT" = "prod" ]; then
                echo -e "${RED}================================================${NC}"
                echo -e "${RED}⚠️  PRODUCTION VOLUME DELETION WARNING ⚠️${NC}"
                echo -e "${RED}You are about to delete ALL production data!${NC}"
                echo -e "${RED}================================================${NC}"

                if [ "$AUTO_YES" != true ]; then
                    echo -e "${YELLOW}Type 'DELETE PRODUCTION DATA' to confirm:${NC}"
                    read -r confirmation
                    if [ "$confirmation" != "DELETE PRODUCTION DATA" ]; then
                        log_error "Volume deletion cancelled"
                        exit 1
                    fi
                fi
            else
                confirm "Delete all data volumes for $ENVIRONMENT environment?"
            fi

            # Remove stack-specific volumes
            log_info "Removing stack-specific volumes..."
            local volume_prefix="${STACK_NAME}_"

            for volume in $(docker volume ls --format "{{.Name}}" | grep "^$volume_prefix"); do
                log_info "Removing volume: $volume"
                docker volume rm "$volume" 2>/dev/null || log_warning "Could not remove volume: $volume"
            done

            log_success "Volume cleanup complete"
        fi

        # Clean up networks and dangling resources
        docker network prune -f >/dev/null 2>&1 || true
        if [ "$CLEANUP_VOLUMES" != true ]; then
            docker volume prune -f >/dev/null 2>&1 || true
        fi

        log_success "Docker cleanup complete"
    fi
}

# ============================================================================
# Image Management Functions
# ============================================================================

pull_base_images() {
    if [ "$SKIP_IMAGE_PULL" = true ]; then
        log_info "Skipping base image pulls"
        return
    fi

    log_info "Pulling base images for containers..."

    local POSTGRES_VERSION="${POSTGRES_VERSION:-17}"

    local BASE_IMAGES=(
        "node:22-alpine"
        "postgres:${POSTGRES_VERSION}-alpine"
        "redis:7.4-alpine"
        "dpage/pgadmin4:latest"
    )

    local failed_pulls=0

    for image in "${BASE_IMAGES[@]}"; do
        log_info "Pulling image: $image"
        if docker pull "$image"; then
            log_success "Successfully pulled: $image"
        else
            log_warning "Failed to pull: $image (will use local cache if available)"
            failed_pulls=$((failed_pulls + 1))
        fi
    done

    if [ $failed_pulls -gt 0 ]; then
        log_warning "$failed_pulls image(s) failed to pull, using local cache"
    else
        log_success "All base images pulled successfully"
    fi
}

build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping image build"
        return
    fi

    log_info "Building Docker image for application..."

    # First pull base images
    pull_base_images

    # Build Next.js application image
    log_info "Building application container: healthapp:$ENVIRONMENT"
    if docker build -t "healthapp:$ENVIRONMENT" -f docker/Dockerfile.production . ; then
        log_success "Application image built successfully"
    else
        log_error "Failed to build application image"
        exit 1
    fi

    # Set the deploy image
    export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"
    export APP_IMAGE="healthapp:$ENVIRONMENT"

    log_info "Using application image: $APP_IMAGE"
}

# ============================================================================
# Deployment Functions
# ============================================================================

wait_for_postgres_ready() {
    local max_wait_seconds="${1:-120}"
    local stack_prefix="${2:-$STACK_NAME}"
    local service_full_name="${stack_prefix}_postgres"

    log_info "Waiting for PostgreSQL to be fully ready..."
    log_debug "Looking for service: $service_full_name"

    local start_time=$(date +%s)
    local timeout_time=$((start_time + max_wait_seconds))
    local check_count=0

    while [ "$(date +%s)" -lt "$timeout_time" ]; do
        check_count=$((check_count + 1))
        log_debug "PostgreSQL readiness check #$check_count"

        # Check if service exists
        if ! docker service ls --filter "name=$service_full_name" --format "{{.Name}}" | grep -q "^$service_full_name$"; then
            log_debug "PostgreSQL service not yet created, waiting..."
            sleep 5
            continue
        fi

        # Check service convergence
        local service_status=$(docker service ls --filter "name=$service_full_name" --format "{{.Replicas}}")
        if [[ "$service_status" =~ ^([0-9]+)/([0-9]+)$ ]]; then
            local running="${BASH_REMATCH[1]}"
            local desired="${BASH_REMATCH[2]}"

            if [ "$running" -ne "$desired" ] || [ "$running" -eq 0 ]; then
                log_debug "PostgreSQL service: $running/$desired replicas running"
                sleep 5
                continue
            fi
        fi

        # Find PostgreSQL container
        local container_id=""
        container_id=$(docker ps --filter "label=com.docker.swarm.service.name=$service_full_name" --format "{{.ID}}" | head -1)

        if [ -z "$container_id" ]; then
            for pattern in "${service_full_name}" "${stack_prefix}_postgres" "postgres"; do
                container_id=$(docker ps --filter "name=$pattern" --format "{{.ID}}" | head -1)
                if [ -n "$container_id" ]; then
                    log_debug "Found container with pattern: $pattern"
                    break
                fi
            done
        fi

        if [ -z "$container_id" ]; then
            log_debug "PostgreSQL container not found yet, waiting..."
            sleep 5
            continue
        fi

        # Check PostgreSQL readiness
        log_debug "Found PostgreSQL container: $container_id"

        if docker exec "$container_id" pg_isready -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" >/dev/null 2>&1; then
            if docker exec "$container_id" psql -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "PostgreSQL is fully ready and accepting connections!"
                
                # Additional wait
                local additional_wait="${POSTGRES_ADDITIONAL_WAIT:-60}"
                if [ "$additional_wait" -gt 0 ]; then
                    log_info "PostgreSQL is ready! Waiting additional ${additional_wait} seconds..."
                    sleep "$additional_wait"
                    log_success "Additional wait completed. PostgreSQL is fully stabilized!"
                fi

                return 0
            else
                log_debug "PostgreSQL is running but not yet accepting queries"
            fi
        else
            log_debug "PostgreSQL is not ready yet (pg_isready check failed)"
        fi

        sleep 5
    done

    log_error "PostgreSQL failed to become ready within ${max_wait_seconds} seconds"
    return 1
}

wait_for_service_ready() {
    local service_name="$1"
    local max_wait_seconds="$2"
    local service_full_name="${STACK_NAME}_${service_name}"

    log_info "Waiting for service $service_name to be ready (max ${max_wait_seconds}s)..."

    local start_time=$(date +%s)
    local timeout_time=$((start_time + max_wait_seconds))

    while [ "$(date +%s)" -lt "$timeout_time" ]; do
        # Check if service exists
        if ! docker service ls --filter "name=$service_full_name" --format "{{.Name}}" | grep -q "^$service_full_name$"; then
            log_debug "Service $service_full_name not found, waiting..."
            sleep 5
            continue
        fi

        # Check service convergence
        local service_status=$(docker service ls --filter "name=$service_full_name" --format "{{.Replicas}}")
        log_debug "Service $service_name status: $service_status"

        if [[ "$service_status" =~ ^([0-9]+)/([0-9]+)$ ]]; then
            local running="${BASH_REMATCH[1]}"
            local desired="${BASH_REMATCH[2]}"

            if [ "$running" -eq "$desired" ] && [ "$running" -gt 0 ]; then
                log_success "Service $service_name is ready ($running/$desired replicas running)"
                return 0
            else
                log_debug "Service $service_name: $running/$desired replicas running"
            fi
        fi

        sleep 5
    done

    log_error "Service $service_name failed to become ready within ${max_wait_seconds} seconds"
    return 1
}

deploy_stack() {
    log_info "Deploying stack: $STACK_NAME"

    if [ ! -f "$DOCKER_STACK_FILE" ]; then
        log_error "Stack file not found: $DOCKER_STACK_FILE"
        exit 1
    fi

    # Verify the image exists
    if ! docker image inspect "$APP_IMAGE" >/dev/null 2>&1; then
        log_error "Image $APP_IMAGE not found locally"
        exit 1
    fi

    # Deploy the stack
    log_info "Deploying Docker stack..."

    # Export all necessary environment variables
    export POSTGRES_IMAGE="postgres:${POSTGRES_VERSION:-17}-alpine"
    export REDIS_IMAGE="redis:7.4-alpine"
    export PGADMIN_IMAGE="dpage/pgladmin4:latest"
    export POSTGRES_DB="${POSTGRES_DB:-healthapp_$ENVIRONMENT}"

    if docker stack deploy -c "$DOCKER_STACK_FILE" "$STACK_NAME"; then
        log_success "Stack deployment initiated: $STACK_NAME"
    else
        log_error "Stack deployment failed"
        exit 1
    fi

    # Wait for services
    log_deploy "Verifying services in dependency order..."
    echo "================================================"
    echo "Service Startup Order:"
    echo "1. PostgreSQL Database"
    echo "2. Redis Cache"  
    echo "3. Application Containers"
    echo "4. PgAdmin Interface"
    echo "================================================"

    # Wait for PostgreSQL
    log_deploy "Phase 1: Ensuring PostgreSQL database is ready..."
    if ! wait_for_postgres_ready 180 "$STACK_NAME"; then
        log_error "PostgreSQL failed to start. Cannot proceed with deployment."
        docker service logs --tail 50 "${STACK_NAME}_postgres" 2>/dev/null || true
        exit 1
    fi

    # Wait for Redis
    log_deploy "Phase 2: Starting Redis cache..."
    if ! wait_for_service_ready "redis" 60; then
        log_warning "Redis failed to start. Application may have limited functionality."
    fi

    # Wait for Application
    log_deploy "Phase 3: Starting application containers..."
    if ! wait_for_service_ready "app" 180; then
        log_error "Application containers failed to start."
        docker service logs --tail 50 "${STACK_NAME}_app" 2>/dev/null || true
        exit 1
    fi

    # Wait for PgAdmin (optional)
    log_deploy "Phase 4: Starting PgAdmin interface..."
    if ! wait_for_service_ready "pgadmin" 60; then
        log_warning "PgAdmin failed to start. This is non-critical."
    fi

    log_success "All core services are running!"
}

run_basic_migration() {
    if [ "$MIGRATE" = true ]; then
        log_info "Running database migrations..."
        
        # Find app container
        local container_id=""
        local max_retries=5
        local retry_count=0

        while [ $retry_count -lt $max_retries ] && [ -z "$container_id" ]; do
            container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
            if [ -z "$container_id" ]; then
                container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
            fi
            if [ -z "$container_id" ]; then
                container_id=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
            fi

            if [ -z "$container_id" ]; then
                retry_count=$((retry_count + 1))
                log_warning "No app container found, attempt $retry_count/$max_retries"
                sleep 5
            fi
        done

        if [ -z "$container_id" ]; then
            log_error "No running app containers found for migrations"
            return 1
        fi

        log_info "Found app container: $container_id"

        # Run migration
        log_info "Running Prisma migrations..."
        if docker exec "$container_id" npx prisma migrate deploy; then
            log_success "Migrations completed successfully!"
        else
            log_warning "Migration failed, but continuing deployment"
        fi
    fi
}

run_basic_seed() {
    if [ "$SEED" = true ]; then
        log_info "Running database seeds..."
        
        # Find app container  
        local container_id=""
        container_id=$(docker ps --filter "label=com.docker.swarm.service.name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
        fi
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found for seeding"
            return 1
        fi

        log_info "Found app container: $container_id"

        # Run seeding
        log_info "Running database seeds..."
        if docker exec "$container_id" npx prisma db seed; then
            log_success "Seeding completed successfully!"
        else
            log_warning "Seeding failed, but continuing deployment"
        fi
    fi
}

show_status() {
    log_info "Service Status for $STACK_NAME:"
    if docker stack ls --format "table {{.Name}}" | grep -q "^$STACK_NAME$"; then
        docker stack ps "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Image}}\t{{.Node}}\t{{.DesiredState}}\t{{.CurrentState}}\t{{.Error}}"
        
        echo
        log_info "Service Details:"
        docker stack services "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}\t{{.Ports}}"
    else
        log_warning "Stack $STACK_NAME is not running"
    fi
}

# ============================================================================
# Command Handlers
# ============================================================================

handle_deploy() {
    log_deploy "Deploying HealthApp $ENVIRONMENT Environment"
    echo "================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Stack: $STACK_NAME"
    echo "Domain: $DOMAIN"
    echo "Frontend Port: $HOST_PORT_FRONTEND"
    echo "Database Port: $HOST_PORT_DB"
    echo "App Replicas: $REPLICAS_FRONTEND"
    echo "Early DB Start: $EARLY_DB_START"
    echo "Migrate: $MIGRATE"
    echo "Seed: $SEED"
    echo "================================================"

    confirm "Deploy with above configuration?"

    check_swarm
    cleanup_environment
    build_images
    deploy_stack
    
    # Run migrations and seeding if requested
    run_basic_migration
    run_basic_seed

    echo
    log_success "🎉 Deployment complete!"
    echo "================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Access Points:"
    echo "  Frontend:    http://$DOMAIN:$HOST_PORT_FRONTEND"
    echo "  Backend API: http://$DOMAIN:$HOST_PORT_FRONTEND/api"
    echo "  PgAdmin:     http://$DOMAIN:$HOST_PORT_PGADMIN"
    echo ""
    echo "Database:"
    echo "  Host: $DOMAIN"
    echo "  Port: $HOST_PORT_DB"
    echo "  Database: ${POSTGRES_DB:-healthapp_$ENVIRONMENT}"
    echo "  User: ${POSTGRES_USER:-healthapp_user}"
    echo "================================================"
    
    show_status
}

handle_stop() {
    log_info "Stopping stack: $STACK_NAME"
    
    if docker stack ls --format "table {{.Name}}" | grep -q "^$STACK_NAME$"; then
        confirm "Stop stack $STACK_NAME?"
        docker stack rm "$STACK_NAME"
        log_success "Stack $STACK_NAME stopped"
    else
        log_warning "Stack $STACK_NAME is not running"
    fi
}

handle_restart() {
    handle_stop
    sleep 15
    handle_deploy
}

handle_status() {
    show_status
}

handle_logs() {
    shift # Remove 'logs' command
    local service_name="$1"
    if [ -n "$service_name" ]; then
        docker service logs -f "${STACK_NAME}_${service_name}"
    else
        log_info "Available services:"
        docker stack services "$STACK_NAME" --format "table {{.Name}}"
    fi
}

handle_scale() {
    if [ -n "$REPLICAS" ]; then
        log_info "Scaling app service to $REPLICAS replicas..."
        docker service scale "${STACK_NAME}_app=$REPLICAS"
        log_success "App service scaled to $REPLICAS replicas"
    else
        log_error "No replica count specified"
        exit 1
    fi
}

handle_migrate() {
    setup_environment
    run_basic_migration
}

handle_seed() {
    setup_environment
    run_basic_seed
}

handle_cleanup() {
    log_info "Running cleanup for $ENVIRONMENT environment..."

    if [ "$CLEANUP_VOLUMES" = true ]; then
        log_warning "Volume cleanup requested - data will be deleted!"
        confirm "Delete all Docker volumes for $ENVIRONMENT?"
    fi

    cleanup_environment
    log_success "Cleanup complete"
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
    parse_args "$@"
    setup_environment

    case $COMMAND in
        deploy)
            handle_deploy
            ;;
        stop)
            handle_stop
            ;;
        restart)
            handle_restart
            ;;
        status)
            handle_status
            ;;
        logs)
            handle_logs "$@"
            ;;
        scale)
            handle_scale
            ;;
        migrate)
            handle_migrate
            ;;
        seed)
            handle_seed
            ;;
        cleanup)
            handle_cleanup
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
