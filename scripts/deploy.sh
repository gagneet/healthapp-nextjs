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
# Default Configuration Values
# ============================================================================

# Default Port Configuration (Standardized)
DEFAULT_PORT_FRONTEND=3002
DEFAULT_PORT_BACKEND=5001
DEFAULT_PORT_DB=5432
DEFAULT_PORT_REDIS=6379
DEFAULT_PORT_PGADMIN=5050

# Default Scaling Configuration
DEFAULT_REPLICAS_DEV=1
DEFAULT_REPLICAS_TEST=2
DEFAULT_REPLICAS_PROD=2

# Default Domain Configuration
DEFAULT_DOMAIN="localhost"
DEFAULT_ENV_FILE=".env"

# Runtime Variables (will be set by parse_args)
ENVIRONMENT=""
COMMAND=""
DOMAIN="$DEFAULT_DOMAIN"
ENV_FILE="$DEFAULT_ENV_FILE"

PORT_FRONTEND="$DEFAULT_PORT_FRONTEND"
PORT_BACKEND="$DEFAULT_PORT_BACKEND"
PORT_DB="$DEFAULT_PORT_DB"
PORT_REDIS="$DEFAULT_PORT_REDIS"
PORT_PGADMIN="$DEFAULT_PGADMIN"

REPLICAS=""
MIGRATE=false
SEED=false
CLEANUP=false
AUTO_YES=false
SKIP_BUILD=false
SKIP_IMAGE_PULL=false

# ============================================================================
# Helper Functions
# ============================================================================

print_usage() {
    cat << EOF
🚀 HealthApp Universal Deployment Script
==========================================

Usage: ./scripts/deploy.sh [ENVIRONMENT] [COMMAND] [OPTIONS]

ENVIRONMENTS:
  dev          Deploy to development environment
  test         Deploy to test environment  
  prod         Deploy to production environment

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
  cleanup      Clean up environment (removes everything)
  scale        Scale specific service up/down

OPTIONS:
  --domain DOMAIN            Domain/IP for the application (default: auto-detect or localhost)
  --env-file FILE            Environment file to load (default: .env)
  
  --port-frontend PORT       Frontend port (default: 3002)
  --port-backend PORT        Backend port (default: 5001)
  --port-db PORT             Database port (default: 5432)
  --port-redis PORT          Redis port (default: 6379)
  --port-pgadmin PORT        PgAdmin port (default: 5050)
  
  --replicas N               Number of replicas for all services
  --migrate                  Run database migrations after deployment
  --seed                     Run database seeders after deployment
  --cleanup                  Clean up before deployment
  --skip-build              Skip Docker image building
  --skip-image-pull         Skip pulling base images
  --auto-yes                Skip all confirmation prompts
  --debug                   Enable debug output

EXAMPLES:
  # Deploy test environment with custom domain and scaling
  ./scripts/deploy.sh test deploy --domain healthapp.gagneet.com --replicas 2 --migrate --seed

  # Deploy production with cleanup
  ./scripts/deploy.sh prod deploy --cleanup --migrate --auto-yes

  # Scale test environment
  ./scripts/deploy.sh test scale --replicas 3

  # View production logs
  ./scripts/deploy.sh prod logs app

ENVIRONMENT DEFAULTS:
  Dev:  1 replica,  ports as specified
  Test: 2 replicas, ports as specified  
  Prod: 2 replicas, ports as specified

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

    # Load environment-specific file if it exists (overrides base .env)
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

    # Restore the deployment environment (command-line takes precedence)
    export ENVIRONMENT="$DEPLOYMENT_ENV"

    # Command line --domain parameter takes precedence over .env files
    if [ -n "$CMD_LINE_DOMAIN" ]; then
        export DOMAIN="$CMD_LINE_DOMAIN"
        log_info "Using domain from command line: $DOMAIN"
    elif [ -n "${DOMAIN:-}" ] && [ "$DOMAIN" != "localhost" ]; then
        log_info "Using domain from .env file: $DOMAIN"
    else
        log_error "DOMAIN not specified in .env file or command line"
        exit 1
    fi

    # Set derived variables (computed from .env values)
    export APP_NAME="${STACK_NAME_PREFIX:-healthapp}"
    export STACK_NAME="${STACK_NAME_PREFIX:-healthapp}-$ENVIRONMENT"
    export DOCKER_STACK_FILE="docker/docker-stack.$ENVIRONMENT.yml"
    
    # Port configuration (use .env values)
    export HOST_PORT_FRONTEND="${PORT_FRONTEND:-3002}"
    export HOST_PORT_BACKEND="${PORT_BACKEND:-3002}"  # Same for Next.js full-stack
    export HOST_PORT_DB="${PORT_DB:-5432}"
    export HOST_PORT_REDIS="${PORT_REDIS:-6379}"
    export HOST_PORT_PGADMIN="${PORT_PGADMIN:-5050}"

    # Application URLs (use .env DOMAIN)
    export FRONTEND_URL="${FRONTEND_URL:-http://$DOMAIN:$HOST_PORT_FRONTEND}"
    export BACKEND_URL="${BACKEND_URL:-$FRONTEND_URL}"  # Next.js full-stack uses same URL
    export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-$FRONTEND_URL/api}"

    # Environment-specific database name
    if [[ "$DATABASE_URL" == *"healthapp_dev"* ]] && [ "$ENVIRONMENT" != "dev" ]; then
        # Update database name in DATABASE_URL for non-dev environments
        export POSTGRES_DB="healthapp_$ENVIRONMENT"
        export DATABASE_URL=$(echo "$DATABASE_URL" | sed "s/healthapp_dev/healthapp_$ENVIRONMENT/")
        log_info "Updated DATABASE_URL for $ENVIRONMENT environment"
    fi

    # Auth.js configuration (use .env values)
    export NEXTAUTH_URL="${NEXTAUTH_URL:-$FRONTEND_URL}"
    export AUTH_SECRET="${AUTH_SECRET:-$NEXTAUTH_SECRET}"
    
    # Validate required Auth.js variables
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log_error "NEXTAUTH_SECRET not found in .env file. Please add it."
        exit 1
    fi

    # Service scaling (use .env values or defaults)
    export REPLICAS_FRONTEND="${REPLICAS:-$(eval echo \$REPLICAS_$(echo $ENVIRONMENT | tr '[:lower:]' '[:upper:]'))}"
    export REPLICAS_POSTGRES="1"  # Always 1 for database
    export REPLICAS_REDIS="1"     # Always 1 for Redis
    export REPLICAS_PGADMIN="1"   # Always 1 for PgAdmin

    # Ensure default replica count
    if [ -z "${REPLICAS_FRONTEND:-}" ]; then
        case $ENVIRONMENT in
            dev) export REPLICAS_FRONTEND="1" ;;
            test) export REPLICAS_FRONTEND="2" ;;
            prod) export REPLICAS_FRONTEND="2" ;;
        esac
    fi

    log_success "Environment setup complete"
    log_info "Using configuration:"
    log_info "  - Domain: $DOMAIN"
    log_info "  - Frontend URL: $FRONTEND_URL"
    log_info "  - Database: ${POSTGRES_DB:-healthapp_test}"
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
            
            # Wait for services to be fully removed
            local max_wait=60
            local wait_time=0
            while docker stack ps "$STACK_NAME" 2>/dev/null | grep -q "Running\|Ready"; do
                if [ $wait_time -ge $max_wait ]; then
                    log_warning "Cleanup taking longer than expected, continuing..."
                    break
                fi
                sleep 5
                wait_time=$((wait_time + 5))
                log_info "Waiting for services to stop... ($wait_time/${max_wait}s)"
            done
        fi

        # Clean up networks and volumes if needed
        docker network prune -f >/dev/null 2>&1 || true
        docker volume prune -f >/dev/null 2>&1 || true

        log_success "Cleanup complete"
    fi
}

# ============================================================================
# Enhanced Image Management Functions
# ============================================================================

pull_base_images() {
    if [ "$SKIP_IMAGE_PULL" = true ]; then
        log_info "Skipping base image pulls"
        return
    fi

    log_info "Pulling base images for containers..."
    
    # Define base images used in the stack
    local BASE_IMAGES=(
        "node:22-alpine"           # Application base image
        "postgres:15-alpine"       # PostgreSQL database
        "redis:7-alpine"          # Redis cache
        "dpage/pgadmin4:latest"   # PgAdmin interface
    )
    
    local failed_pulls=0
    
    for image in "${BASE_IMAGES[@]}"; do
        log_info "Pulling image: $image"
        if docker pull "$image"; then
            log_success "Successfully pulled: $image"
        else
            log_warning "Failed to pull: $image (will use local cache if available)"
            ((failed_pulls++))
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
    
    # First pull base images to ensure we have the latest
    pull_base_images
    
    # Build single Next.js full-stack application image
    log_info "Building application container: healthapp:$ENVIRONMENT"
    if docker build -t "healthapp:$ENVIRONMENT" -f docker/Dockerfile.production . ; then
        log_success "Application image built successfully"
    else
        log_error "Failed to build application image"
        exit 1
    fi
}

# ============================================================================
# Enhanced Deployment with Strict Orchestration
# ============================================================================

deploy_stack() {
    log_info "Deploying stack: $STACK_NAME"
    
    if [ ! -f "$DOCKER_STACK_FILE" ]; then
        log_error "Stack file not found: $DOCKER_STACK_FILE"
        exit 1
    fi

    # Deploy the stack
    log_info "Deploying Docker stack..."
    docker stack deploy -c "$DOCKER_STACK_FILE" "$STACK_NAME"
    
    log_success "Stack deployment initiated: $STACK_NAME"
    
    # Enhanced orchestration: Wait for services in strict dependency order
    log_deploy "Starting services in dependency order..."
    echo "================================================"
    echo "Service Startup Order:"
    echo "1. PostgreSQL Database (Primary dependency)"
    echo "2. Redis Cache"
    echo "3. Application Container(s)"
    echo "4. Database Migrations (if enabled)"
    echo "5. Database Seeds (if enabled)"
    echo "6. PgAdmin Interface"
    echo "================================================"
    
    # Phase 1: PostgreSQL must be fully ready first
    log_deploy "Phase 1: Starting PostgreSQL database..."
    if ! wait_for_postgres_ready 120; then
        log_error "PostgreSQL failed to start. Cannot proceed with deployment."
        show_service_logs "postgres" 50
        exit 1
    fi
    
    # Phase 2: Redis cache
    log_deploy "Phase 2: Starting Redis cache..."
    if ! wait_for_service_ready "redis" 60; then
        log_warning "Redis failed to start. Application may have limited functionality."
        show_service_logs "redis" 30
    fi
    
    # Phase 3: Application containers (depends on PostgreSQL and Redis)
    log_deploy "Phase 3: Starting application containers..."
    if ! wait_for_service_ready "app" 180; then
        log_error "Application containers failed to start."
        show_service_logs "app" 50
        exit 1
    fi
    
    # Phase 4: Run migrations if enabled
    if [ "$MIGRATE" = true ]; then
        log_deploy "Phase 4: Running database migrations..."
        run_migrations true
    else
        log_info "Phase 4: Skipping migrations (not requested)"
    fi
    
    # Phase 5: Run seeds if enabled
    if [ "$SEED" = true ]; then
        log_deploy "Phase 5: Running database seeds..."
        run_seeds true
    else
        log_info "Phase 5: Skipping seeds (not requested)"
    fi
    
    # Phase 6: PgAdmin (optional, non-critical)
    log_deploy "Phase 6: Starting PgAdmin interface..."
    if ! wait_for_service_ready "pgadmin" 60; then
        log_warning "PgAdmin failed to start. This is non-critical."
    fi
    
    # Show final deployment status
    echo
    log_success "Deployment orchestration complete!"
    show_status
}

# ============================================================================
# Enhanced PostgreSQL Readiness Check
# ============================================================================

wait_for_postgres_ready() {
    local max_wait_seconds="${1:-120}"
    local service_full_name="${STACK_NAME}_postgres"
    
    log_info "Waiting for PostgreSQL to be fully ready..."
    log_info "This includes: container running, database initialized, and accepting connections"
    
    local start_time=$(date +%s)
    local timeout_time=$((start_time + max_wait_seconds))
    local check_count=0
    
local timeout_time=$((start_time + max_wait_seconds))
    local check_count=0
    
    while [ "$(date +%s)" -lt "$timeout_time" ]; do
        ((check_count++))
        log_debug "PostgreSQL readiness check #$check_count"
        ((check_count++))
        log_debug "PostgreSQL readiness check #$check_count"
        
        # Step 1: Check if service exists
        if ! docker service ls --filter "name=$service_full_name" --format "{{.Name}}" | grep -q "^$service_full_name$"; then
            log_debug "PostgreSQL service not yet created, waiting..."
            sleep 5
            continue
        fi
        
        # Step 2: Check service convergence
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
        
        # Step 3: Find the PostgreSQL container
        local container_id=""
        for pattern in "${service_full_name}" "${STACK_NAME}_postgres" "postgres"; do
            container_id=$(docker ps --filter "name=$pattern" --format "{{.ID}}" | head -1)
            if [ -n "$container_id" ]; then
                break
            fi
        done
        
        if [ -z "$container_id" ]; then
            log_debug "PostgreSQL container not found yet, waiting..."
            sleep 5
            continue
        fi
        
        # Step 4: Enhanced PostgreSQL readiness check
        log_debug "Found PostgreSQL container: $container_id"
        
        # Check if PostgreSQL is accepting connections
        if docker exec "$container_id" pg_isready -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" >/dev/null 2>&1; then
            # Additional verification: can we actually connect and run a query?
            if docker exec "$container_id" psql -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "PostgreSQL is fully ready and accepting connections!"
                
                # Show PostgreSQL status
                log_info "PostgreSQL Status:"
                docker exec "$container_id" psql -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" -c "SELECT version();" 2>/dev/null || true
                
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

# ============================================================================
# Enhanced Service Health Checking
# ============================================================================

wait_for_service_ready() {
    local service_name="$1"
    local max_wait_seconds="$2"
    local service_full_name="${STACK_NAME}_${service_name}"
    
    log_info "Waiting for service $service_name to be ready (max ${max_wait_seconds}s)..."
    
    local start_time=$(date +%s)
    local timeout_time=$((start_time + max_wait_seconds))
    
    while [ $(date +%s) -lt $timeout_time ]; do
        # Check if service exists
        if ! docker service ls --filter "name=$service_full_name" --format "{{.Name}}" | grep -q "^$service_full_name$"; then
            log_debug "Service $service_full_name not found, waiting..."
            sleep 5
            continue
        fi
        
        # Check service convergence (desired vs running replicas)
        local service_status=$(docker service ls --filter "name=$service_full_name" --format "{{.Replicas}}")
        log_debug "Service $service_name status: $service_status"
        
        if [[ "$service_status" =~ ^([0-9]+)/([0-9]+)$ ]]; then
            local running="${BASH_REMATCH[1]}"
            local desired="${BASH_REMATCH[2]}"
            
            if [ "$running" -eq "$desired" ] && [ "$running" -gt 0 ]; then
                # Service has desired replicas, now check basic readiness
                if check_service_ready "$service_name" "$service_full_name"; then
                    log_success "Service $service_name is ready ($running/$desired replicas running)"
                    return 0
                fi
            else
                log_debug "Service $service_name: $running/$desired replicas running"
            fi
        fi
        
        sleep 5
    done
    
    log_error "Service $service_name failed to become ready within ${max_wait_seconds} seconds"
    
    # Show debugging information
    log_error "Service status:"
    docker service ps "$service_full_name" --no-trunc
    
    log_error "Service logs (last 20 lines):"
    docker service logs --tail 20 "$service_full_name" 2>/dev/null || log_warning "Could not retrieve logs"
    
    return 1
}

check_service_ready() {
    local service_name="$1"
    local service_full_name="$2"
    
    # Find running container using multiple methods
    local container_id=""
    
    # Method 1: Direct container search by service name
    container_id=$(docker ps --filter "name=${service_full_name}" --format "{{.ID}}" | head -1)
    
    # Method 2: Try with stack name pattern
    if [ -z "$container_id" ]; then
        container_id=$(docker ps --filter "name=${STACK_NAME}_${service_name}" --format "{{.ID}}" | head -1)
    fi
    
    # Method 3: Try partial name match
    if [ -z "$container_id" ]; then
        container_id=$(docker ps --filter "name=${service_name}" --format "{{.ID}}" | head -1)
    fi
    
    if [ -z "$container_id" ]; then
        log_debug "No running container found for $service_name"
        return 1
    fi
    
    log_debug "Found container for $service_name: $container_id"
    
    # Check readiness based on service type
    case $service_name in
        postgres)
            check_postgres_health "$container_id"
            ;;
        redis)
            check_redis_health "$container_id"
            ;;
        app)
            check_app_health "$container_id"
            ;;
        pgadmin)
            check_pgadmin_health "$container_id"
            ;;
        *)
            log_warning "Unknown service type: $service_name"
            return 1
            ;;
    esac
}

check_postgres_health() {
    local container_id="$1"
    
    # Check if container is running
    if ! docker ps --filter "id=$container_id" --format "{{.ID}}" | grep -q "$container_id"; then
        log_debug "PostgreSQL container not running"
        return 1
    fi
    
    # Use the exact command that works (as confirmed by our debugging)
    if docker exec "$container_id" pg_isready -U "${POSTGRES_USER:-$DEFAULT_POSTGRES_USER}" -d "${POSTGRES_DB:-$DEFAULT_POSTGRES_DB}" >/dev/null 2>&1; then
        log_debug "PostgreSQL is ready"
        return 0
    else
        log_debug "PostgreSQL not ready yet"
        return 1
    fi
}

check_redis_health() {
    local container_id="$1"
    
    # Check if container is running
    if ! docker ps --filter "id=$container_id" --format "{{.ID}}" | grep -q "$container_id"; then
        log_debug "Redis container not running"
        return 1
    fi
    
    # Check Redis ping (try with and without password)
    if docker exec "$container_id" redis-cli ping >/dev/null 2>&1; then
        log_debug "Redis is ready (no auth)"
        return 0
    elif docker exec "$container_id" redis-cli --no-auth-warning -a "${REDIS_PASSWORD:-secure_test_redis}" ping >/dev/null 2>&1; then
        log_debug "Redis is ready (with auth)"
        return 0
    else
        log_debug "Redis not ready yet"
        return 1
    fi
}

check_app_health() {
    local container_id="$1"
    
    # Check if container is running
    if ! docker ps --filter "id=$container_id" --format "{{.ID}}" | grep -q "$container_id"; then
        log_debug "App container not running"
        return 1
    fi
    
    # Check if the application is responding
    if docker exec "$container_id" curl -f -s http://localhost:3002/api/health >/dev/null 2>&1; then
        log_debug "App is responding on health endpoint"
        return 0
    elif docker exec "$container_id" curl -f -s http://localhost:3002 >/dev/null 2>&1; then
        log_debug "App is responding on main endpoint"
        return 0
    else
        log_debug "App not responding yet"
        return 1
    fi
}

check_pgadmin_health() {
    local container_id="$1"
    
    # Check if container is running
    if ! docker ps --filter "id=$container_id" --format "{{.ID}}" | grep -q "$container_id"; then
        log_debug "PgAdmin container not running"
        return 1
    fi
    
    # PgAdmin just needs to be running
    log_debug "PgAdmin container is running"
    return 0
}

# ============================================================================
# Database Functions
# ============================================================================

run_migrations() {
    local should_migrate="${1:-false}"
    
    if [ "$should_migrate" = true ]; then
        log_info "Running database migrations..."
        
        # Find running app container using the same logic as health checks
        local container_id=""
        container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            container_id=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
        fi
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found for migrations"
            exit 1
        fi
        
        # Ensure database is ready before migrations
        log_info "Verifying database connectivity before migrations..."
        local max_retries=10
        local retry_count=0
        
        while [ $retry_count -lt $max_retries ]; do
            # Use psql to check connectivity; assumes DATABASE_URL is set in the container
            if docker exec "$container_id" bash -c 'psql "${DATABASE_URL}" -c "SELECT 1"' >/dev/null 2>&1; then
                log_success "Database connectivity verified"
                break
            fi
            ((retry_count++))
            log_debug "Database not ready for migrations, retry $retry_count/$max_retries"
            sleep 5
        done
        
        # Run migrations in the app container
        log_info "Running migrations in container: $container_id"
        if docker exec "$container_id" npx prisma migrate deploy; then
            log_success "Migrations completed successfully"
        else
            log_warning "Production migrations may not exist, trying db push instead..."
            if docker exec "$container_id" npx prisma db push --accept-data-loss; then
                log_success "Database schema synchronized using db push"
            else
                log_error "Migration/sync failed"
                exit 1
            fi
        fi
    fi
}

run_seeds() {
    local should_seed="${1:-false}"
    
    if [ "$should_seed" = true ]; then
        log_info "Running database seeds..."
        
        # Find running app container using the same logic as health checks
        local container_id=""
        container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            container_id=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
        fi
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found for seeding"
            exit 1
        fi
        
        # Run seeds in the app container
        log_info "Running seeds in container: $container_id"
        if docker exec "$container_id" npm run seed; then
            log_success "Seeds completed successfully"
        else
            log_warning "Seeding failed - this may be expected if data already exists"
        fi
    fi
}

# ============================================================================
# Utility Functions
# ============================================================================

show_status() {
    log_info "Service Status for $STACK_NAME:"
    docker stack ps "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Image}}\t{{.Node}}\t{{.DesiredState}}\t{{.CurrentState}}\t{{.Error}}"
    
    echo
    log_info "Service Details:"
    docker stack services "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}\t{{.Ports}}"
    
    echo
    log_info "Container Health Status:"
    for service in postgres redis app pgadmin; do
        local container_id=$(docker ps --filter "name=${STACK_NAME}_${service}" --format "{{.ID}}" | head -1)
        if [ -n "$container_id" ]; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no health check")
            echo "  - $service: $health"
        fi
    done
}

show_service_logs() {
    local service_name="$1"
    local lines="${2:-50}"
    
    log_info "Showing last $lines lines of $service_name logs:"
    docker service logs --tail "$lines" "${STACK_NAME}_${service_name}" 2>/dev/null || log_warning "Could not retrieve $service_name logs"
}

show_logs() {
    local service_name="$1"
    if [ -n "$service_name" ]; then
        docker service logs -f "$STACK_NAME"_"$service_name"
    else
        log_info "Available services:"
        docker stack services "$STACK_NAME" --format "table {{.Name}}"
    fi
}

scale_service() {
    local service_replicas="$REPLICAS"
    
    if [ -n "$service_replicas" ]; then
        log_info "Scaling app service to $service_replicas replicas..."
        
        docker service scale "$STACK_NAME"_app="$service_replicas"
        
        log_success "App service scaled to $service_replicas replicas"
    else
        log_error "No replica count specified"
        exit 1
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
    echo "Frontend Port: $PORT_FRONTEND"
    echo "Backend Port: $PORT_BACKEND"  
    echo "Database Port: $PORT_DB"
    echo "Replicas: $REPLICAS"
    echo "================================================"
    
    confirm "Deploy with above configuration?"
    
    check_swarm
    cleanup_environment
    build_images
    deploy_stack
    
    echo
    log_success "🎉 Deployment complete!"
    echo "================================================"
    echo "Access Points:"
    echo "  Frontend:    http://$DOMAIN:$PORT_FRONTEND"
    echo "  Backend API: http://$DOMAIN:$PORT_BACKEND/api"
    echo "  PgAdmin:     http://$DOMAIN:$PORT_PGADMIN"
    echo ""
    echo "Database:"
    echo "  Host: $DOMAIN"
    echo "  Port: $PORT_DB"
    echo "  Database: ${POSTGRES_DB:-healthapp_test}"
    echo "  User: ${POSTGRES_USER:-healthapp_user}"
    echo "================================================"
}

handle_stop() {
    confirm "Stop stack $STACK_NAME?"
    docker stack rm "$STACK_NAME"
    log_success "Stack $STACK_NAME stopped"
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
    show_logs "$@"
}

handle_scale() {
    scale_service
}

handle_migrate() {
    run_migrations true
}

handle_seed() {
    run_seeds true
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
        *)
            log_error "Unknown command: $COMMAND"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"