#!/bin/bash

# deploy.sh - Universal HealthApp Deployment Script
# Usage: ./scripts/deploy.sh [dev|test|prod] [COMMAND] [OPTIONS]
# Purpose: Unified deployment for dev, test, and production environments using Docker Swarm
#
# IMPORTANT: Ensure your docker-stack.*.yml files use consistent PostgreSQL versions
# The script defaults to PostgreSQL 17. Set POSTGRES_VERSION in your .env file to override.
#
# Key Features:
# - Early database startup: PostgreSQL and Redis start during app build
# - Volume cleanup control: --cleanup-volumes flag for explicit data deletion
# - Enhanced migration handling: Better connectivity checks and error recovery
# - Robust health checks: Multiple verification methods for service readiness
# - Debug mode: --debug flag for detailed troubleshooting output

set -e

# ============================================================================
# Environment File Check
# ============================================================================

# Function to check for .env file
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
        echo -e "${YELLOW}The .env file should contain required environment variables like:${NC}"
        echo -e "   DATABASE_URL=postgresql://..."
        echo -e "   NEXTAUTH_SECRET=..."
        echo -e "   NEXTAUTH_URL=..."
        echo -e "   And other environment-specific configurations"
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
CLEANUP_VOLUMES=false  # New flag for volume cleanup
AUTO_YES=false
SKIP_BUILD=false
SKIP_IMAGE_PULL=false
EARLY_DB_START=true    # New flag to start DB early
DB_ALREADY_DEPLOYED=false  # Track if DB was deployed early

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
  
  --replicas N               Number of replicas for all services
  --migrate                  Run database migrations after deployment
  --seed                     Run database seeders after deployment
  --cleanup                  Clean up before deployment (compiled files + Docker resources)
  --cleanup-volumes          DANGER: Also remove data volumes during cleanup (data loss!)
  --no-early-db              Don't start database services early (default: start early)
  --skip-build              Skip Docker image building
  --skip-image-pull         Skip pulling base images
  --auto-yes                Skip all confirmation prompts
  --debug                   Enable debug output

DOCKER SWARM NOTES:
  For single-node swarms (development/testing):
    - Local images can be used directly
    - No registry required
  
  For multi-node swarms (production):
    - Images must be accessible to all nodes
    - Configure DOCKER_REGISTRY in .env file:
      DOCKER_REGISTRY=your.registry.com
    - Or run a local registry:
      docker run -d -p 5000:5000 --name registry registry:2
      DOCKER_REGISTRY=localhost:5000

IMPORTANT: docker-stack.*.yml files must use environment variables for images:
  app:
    image: \${APP_IMAGE:-healthapp:test}

EXAMPLES:
  # Deploy test environment with custom domain and scaling
  ./scripts/deploy.sh test deploy --domain healthapp.gagneet.com --replicas 2 --migrate --seed

  # Deploy test with full cleanup including volumes (DANGER: data loss!)
  ./scripts/deploy.sh test deploy --cleanup --cleanup-volumes --migrate --seed

  # Deploy production with cleanup (preserving volumes)
  ./scripts/deploy.sh prod deploy --cleanup --migrate --auto-yes

  # Scale test environment
  ./scripts/deploy.sh test scale --replicas 3

  # View production logs
  ./scripts/deploy.sh prod logs app

ENVIRONMENT DEFAULTS:
  Dev:  1 replica,  ports as specified
  Test: 2 replicas, ports as specified  
  Prod: 2 replicas, ports as specified

WARNING: --cleanup-volumes will DELETE ALL DATA in PostgreSQL and Redis volumes!
         Use with extreme caution, especially in production.

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

log_sanitized_db_url() {
    local container_id="$1"
    log_debug "Checking DATABASE_URL inside the container..."
    docker exec "$container_id" sh -c 'echo "DATABASE_URL (sanitized): $(echo ${DATABASE_URL} | sed -E "s/(postgresql.*):(.*)@/\1:<password>@/")"' || log_warning "Could not get DATABASE_URL from container."
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
                CLEANUP=true  # Cleanup volumes implies general cleanup
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

    # Set PostgreSQL version (default to 17 if not specified)
    export POSTGRES_VERSION="${POSTGRES_VERSION:-17}"
    log_debug "Using PostgreSQL version: $POSTGRES_VERSION"

    # Set derived variables (computed from .env values)
    export APP_NAME="${STACK_NAME_PREFIX:-healthapp}"
    export STACK_NAME="${STACK_NAME_PREFIX:-healthapp}-$ENVIRONMENT"
    export DOCKER_STACK_FILE="docker/docker-stack.$ENVIRONMENT.yml"
    
    # Docker registry configuration (for multi-node swarms)
    export DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
    if [ -n "$DOCKER_REGISTRY" ]; then
        log_info "Docker registry configured: $DOCKER_REGISTRY"
    fi
    
    # The image name will be set during build
    export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"
    
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

    # Replace localhost with postgres for container networking
    if [[ "$DATABASE_URL" == *"@localhost"* ]]; then
        export DATABASE_URL=${DATABASE_URL//@localhost/@postgres}
        log_info "Updated DATABASE_URL for container networking to use 'postgres' host"
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
    log_info "  - PostgreSQL Version: $POSTGRES_VERSION"
    log_info "  - Replicas: $REPLICAS_FRONTEND"
    if [ -n "$DOCKER_REGISTRY" ]; then
        log_info "  - Registry: $DOCKER_REGISTRY"
    fi
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
    
    # Check if it's a single-node or multi-node swarm
    local node_count=$(docker node ls --format "{{.ID}}" 2>/dev/null | wc -l)
    if [ "$node_count" -eq 1 ]; then
        log_info "Single-node swarm detected - local images can be used"
        export SWARM_MODE="single"
    else
        log_info "Multi-node swarm detected ($node_count nodes)"
        export SWARM_MODE="multi"
        
        # Check if registry is configured for multi-node deployment
        if [ -z "${DOCKER_REGISTRY:-}" ] && [ "$ENVIRONMENT" = "prod" ]; then
            log_warning "No DOCKER_REGISTRY configured for multi-node production deployment"
            log_warning "Local images will not be available on other nodes"
            log_info "To configure a registry, add to your .env file:"
            log_info "  DOCKER_REGISTRY=your.registry.com"
            log_info "  or"
            log_info "  DOCKER_REGISTRY=localhost:5000  (for local registry)"
        fi
    fi
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

        # Handle volume cleanup if requested
        if [ "$CLEANUP_VOLUMES" = true ]; then
            log_warning "⚠️  Volume cleanup requested - THIS WILL DELETE ALL DATA!"
            
            # Extra confirmation for production
            if [ "$ENVIRONMENT" = "prod" ]; then
                echo -e "${RED}================================================${NC}"
                echo -e "${RED}⚠️  PRODUCTION VOLUME DELETION WARNING ⚠️${NC}"
                echo -e "${RED}You are about to delete ALL production data!${NC}"
                echo -e "${RED}This includes:${NC}"
                echo -e "${RED}  - All PostgreSQL databases and tables${NC}"
                echo -e "${RED}  - All Redis cache data${NC}"
                echo -e "${RED}  - All PgAdmin configurations${NC}"
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
            
            # List and remove volumes with the stack prefix
            for volume in $(docker volume ls --format "{{.Name}}" | grep "^$volume_prefix"); do
                log_info "Removing volume: $volume"
                docker volume rm "$volume" 2>/dev/null || log_warning "Could not remove volume: $volume"
            done
            
            # Also remove any volumes that might use the app name prefix
            local app_volume_prefix="${APP_NAME}_"
            for volume in $(docker volume ls --format "{{.Name}}" | grep "^$app_volume_prefix"); do
                log_info "Removing volume: $volume"
                docker volume rm "$volume" 2>/dev/null || log_warning "Could not remove volume: $volume"
            done
            
            log_success "Volume cleanup complete"
        fi

        # Clean up networks and dangling resources
        docker network prune -f >/dev/null 2>&1 || true
        
        # Only prune unused volumes if not doing specific volume cleanup
        if [ "$CLEANUP_VOLUMES" != true ]; then
            docker volume prune -f >/dev/null 2>&1 || true
        fi

        log_success "Docker cleanup complete"
    fi
}

cleanup_compiled_files() {
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up compiled TypeScript files..."
        
        # Check if npm is available and package.json exists
        if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
            log_info "Running npm clean script..."
            if npm run clean 2>/dev/null; then
                log_success "Compiled files cleaned via npm script"
            else
                log_info "npm clean script failed, using manual cleanup..."
                manual_cleanup_compiled_files
            fi
        else
            log_info "npm not available, using manual cleanup..."
            manual_cleanup_compiled_files
        fi
    fi
}

manual_cleanup_compiled_files() {
    log_info "Manually removing compiled TypeScript files..."
    
    # Whitelist of legitimate JS files to preserve
    PRESERVE_JS_FILES=("seed.js" "seed.cjs" "migrate.js" "config.js")
    
    # Build find exclusion arguments
    FIND_EXCLUDE_ARGS=""
    for fname in "${PRESERVE_JS_FILES[@]}"; do
        FIND_EXCLUDE_ARGS+=" -not -name '$fname'"
    done
    
    # Remove compiled JS files from lib/ (except whitelisted files)
    eval "find lib -name '*.js' $FIND_EXCLUDE_ARGS -delete 2>/dev/null || true"
    
    # Remove compiled JS files from app/ (except whitelisted files)
    eval "find app -name '*.js' $FIND_EXCLUDE_ARGS -delete 2>/dev/null || true"
    
    # Remove compiled JS files from scripts/ (except whitelisted files)
    eval "find scripts -name '*.js' $FIND_EXCLUDE_ARGS -delete 2>/dev/null || true"
    
    # Count remaining JS files to verify cleanup
    local remaining_js=$(eval "find lib app scripts -name '*.js' $FIND_EXCLUDE_ARGS 2>/dev/null" | wc -l)
    
    if [ "$remaining_js" -eq 0 ]; then
        log_success "All compiled TypeScript files removed"
    else
        log_warning "Some compiled files may remain ($remaining_js files)"
    fi
}

# ============================================================================
# Enhanced Image Management Functions with Early DB Start
# ============================================================================

pull_base_images() {
    if [ "$SKIP_IMAGE_PULL" = true ]; then
        log_info "Skipping base image pulls"
        return
    fi

    log_info "Pulling base images for containers..."
    
    # Determine PostgreSQL version from environment or use default
    local POSTGRES_VERSION="${POSTGRES_VERSION:-17}"
    
    # Define base images used in the stack
    local BASE_IMAGES=(
        "node:22-alpine"                        # Application base image
        "postgres:${POSTGRES_VERSION}-alpine"   # PostgreSQL database
        "redis:7.2-alpine"                      # Redis cache
        "dpage/pgadmin4:latest"                 # PgAdmin interface
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

start_database_services_early() {
    if [ "$EARLY_DB_START" != true ]; then
        log_info "Early database start disabled"
        return
    fi
    
    log_deploy "Starting database services early (before app build)..."
    
    # Check if main stack already has database services running
    if docker service ls --filter "name=${STACK_NAME}_postgres" --format "{{.Name}}" | grep -q "^${STACK_NAME}_postgres$"; then
        log_info "Database services already running in main stack"
        return
    fi
    
    # Use the actual docker stack file but deploy only database services
    if [ ! -f "$DOCKER_STACK_FILE" ]; then
        log_warning "Stack file not found, skipping early database start"
        return
    fi
    
    # Set environment variables for the stack deployment
    export APP_IMAGE="busybox:latest"  # Placeholder image for app service during DB-only deployment
    export POSTGRES_IMAGE="postgres:${POSTGRES_VERSION:-17}-alpine"
    export REDIS_IMAGE="redis:7.2-alpine"
    export PGADMIN_IMAGE="dpage/pgadmin4:latest"
    
    # Deploy the full stack early (services will be updated later)
    log_info "Deploying database services from main stack: ${STACK_NAME}"
    docker stack deploy -c "$DOCKER_STACK_FILE" "$STACK_NAME"
    
    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to initialize (this typically takes 30-60 seconds)..."
    if wait_for_postgres_ready 120 "$STACK_NAME"; then
        log_success "Database services started successfully and are ready"
        # Mark that we've already deployed the database
        export DB_ALREADY_DEPLOYED=true
    else
        log_warning "Database services may not be fully ready yet"
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
    
    # Start database services early if enabled
    if [ "$EARLY_DB_START" = true ]; then
        start_database_services_early
    fi
    
    # Build single Next.js full-stack application image
    log_info "Building application container: healthapp:$ENVIRONMENT"
    if docker build -t "healthapp:$ENVIRONMENT" -f docker/Dockerfile.production . ; then
        log_success "Application image built successfully"
    else
        log_error "Failed to build application image"
        exit 1
    fi
    
    # Check if we're in a multi-node swarm
    local node_count=$(docker node ls --format "{{.ID}}" 2>/dev/null | wc -l)
    if [ "$node_count" -gt 1 ]; then
        log_warning "Multi-node swarm detected ($node_count nodes)"
        log_warning "Local images are not automatically available to other swarm nodes"
        
        # Option 1: Use a registry if configured
        if [ -n "${DOCKER_REGISTRY:-}" ]; then
            log_info "Pushing image to registry: $DOCKER_REGISTRY"
            local tagged_image="${DOCKER_REGISTRY}/healthapp:$ENVIRONMENT"
            docker tag "healthapp:$ENVIRONMENT" "$tagged_image"
            if docker push "$tagged_image"; then
                log_success "Image pushed to registry"
                # Update the image name for deployment
                export DEPLOY_IMAGE="$tagged_image"
            else
                log_error "Failed to push image to registry"
                exit 1
            fi
        else
            log_warning "No DOCKER_REGISTRY configured for multi-node deployment"
            log_info "Options:"
            log_info "  1. Set DOCKER_REGISTRY in your .env file"
            log_info "  2. Manually distribute the image to all nodes"
            log_info "  3. Use a single-node swarm for testing"
            
            # For single-node testing, we can continue
            if [ "$node_count" -eq 1 ] || [ "$ENVIRONMENT" = "test" ]; then
                log_info "Continuing with local image for single-node/test deployment"
                export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"
            else
                log_error "Cannot proceed with multi-node deployment without a registry"
                exit 1
            fi
        fi
    else
        log_info "Single-node swarm detected, using local image"
        export DEPLOY_IMAGE="healthapp:$ENVIRONMENT"
    fi
    
    # Ensure the image is available locally on this node
    if ! docker image inspect "$DEPLOY_IMAGE" >/dev/null 2>&1; then
        log_error "Image $DEPLOY_IMAGE not found locally"
        exit 1
    fi
    
    # Don't remove database services - they'll be updated by the main deployment
    if [ "${DB_ALREADY_DEPLOYED:-false}" = true ]; then
        log_info "Database services will be updated during main deployment"
    fi
}

# ============================================================================
# Enhanced Deployment with Better Database Readiness
# ============================================================================

deploy_stack() {
    log_info "Deploying stack: $STACK_NAME"
    
    if [ ! -f "$DOCKER_STACK_FILE" ]; then
        log_error "Stack file not found: $DOCKER_STACK_FILE"
        exit 1
    fi

    # Set the application image name for the stack
    export APP_IMAGE="${DEPLOY_IMAGE:-healthapp:$ENVIRONMENT}"
    log_info "Using application image: $APP_IMAGE"
    
    # Verify the image exists locally or in registry
    if ! docker image inspect "$APP_IMAGE" >/dev/null 2>&1; then
        log_warning "Image $APP_IMAGE not found locally, checking registry..."
        if ! docker pull "$APP_IMAGE" 2>/dev/null; then
            log_error "Image $APP_IMAGE not found locally or in registry"
            log_error "Please ensure the image is built and available"
            exit 1
        fi
    fi

    # Deploy/update the stack with the image environment variable
    if [ "${DB_ALREADY_DEPLOYED:-false}" = true ]; then
        log_info "Updating existing stack with application services..."
    else
        log_info "Deploying Docker stack..."
    fi
    
    # Export all necessary environment variables for the stack
    export POSTGRES_IMAGE="postgres:${POSTGRES_VERSION:-17}-alpine"
    export REDIS_IMAGE="redis:7.2-alpine"
    export PGADMIN_IMAGE="dpage/pgadmin4:latest"
    
    # Deploy with environment variables
    docker stack deploy -c "$DOCKER_STACK_FILE" "$STACK_NAME" \
        --with-registry-auth
    
    log_success "Stack deployment initiated: $STACK_NAME"
    
    # Enhanced orchestration: Wait for services in strict dependency order
    log_deploy "Verifying services in dependency order..."
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
    log_deploy "Phase 1: Ensuring PostgreSQL database is ready..."
    if [ "${DB_ALREADY_DEPLOYED:-false}" = true ]; then
        log_info "PostgreSQL was started early and should be ready"
        # Still verify it's accessible
        if ! wait_for_postgres_ready 60 "$STACK_NAME"; then
            log_error "PostgreSQL is not accessible. Cannot proceed with deployment."
            show_service_logs "postgres" 50
            exit 1
        fi
    else
        if ! wait_for_postgres_ready 180 "$STACK_NAME"; then
            log_error "PostgreSQL failed to start. Cannot proceed with deployment."
            show_service_logs "postgres" 50
            exit 1
        fi
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
        
        # Additional debugging for image issues
        log_error "Checking image availability on nodes..."
        docker node ls --format "table {{.Hostname}}\t{{.Status}}\t{{.Availability}}"
        
        log_error "Checking if image exists locally..."
        docker images | grep healthapp || log_error "No healthapp images found"
        
        exit 1
    fi
    
    # Additional wait for app to fully initialize
    log_info "Waiting for application to fully initialize..."
    sleep 10
    
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
    local stack_prefix="${2:-$STACK_NAME}"
    local service_full_name="${stack_prefix}_postgres"
    
    log_info "Waiting for PostgreSQL to be fully ready..."
    log_info "This includes: container running, database initialized, and accepting connections"
    log_debug "Looking for service: $service_full_name"
    
    local start_time=$(date +%s)
    local timeout_time=$((start_time + max_wait_seconds))
    local check_count=0
    
    while [ "$(date +%s)" -lt "$timeout_time" ]; do
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
        
        # Step 3: Find the PostgreSQL container (try multiple patterns)
        local container_id=""
        # Try exact service name first
        container_id=$(docker ps --filter "label=com.docker.swarm.service.name=$service_full_name" --format "{{.ID}}" | head -1)
        
        # If not found, try name patterns
        if [ -z "$container_id" ]; then
            for pattern in "${service_full_name}" "${stack_prefix}_postgres" "${STACK_NAME}_postgres" "postgres"; do
                container_id=$(docker ps --filter "name=$pattern" --format "{{.ID}}" | head -1)
                if [ -n "$container_id" ]; then
                    log_debug "Found container with pattern: $pattern"
                    break
                fi
            done
        fi
        
        if [ -z "$container_id" ]; then
            log_debug "PostgreSQL container not found yet, waiting..."
            log_debug "Current containers:"
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i postgres || true
            sleep 5
            continue
        fi
        
        # Step 4: Enhanced PostgreSQL readiness check
        log_debug "Found PostgreSQL container: $container_id"
        
        # First check if the container is healthy
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no health check")
        log_debug "Container health status: $health_status"
        
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
    log_debug "Final service status:"
    docker service ls --filter "name=postgres" || true
    log_debug "Final container status:"
    docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}" || true
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
    
    # Use pg_isready for health check
    if docker exec "$container_id" pg_isready -U "${POSTGRES_USER:-healthapp_user}" -d "${POSTGRES_DB:-healthapp_test}" >/dev/null 2>&1; then
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
# Enhanced Database Functions with Better Error Handling
# ============================================================================

run_migrations() {
    local should_migrate="${1:-false}"
    
    if [ "$should_migrate" = true ]; then
        log_info "Running database migrations..."
        
        # Find running app container
        local container_id=""
        local max_retries=5
        local retry_count=0
        
        while [ $retry_count -lt $max_retries ] && [ -z "$container_id" ]; do
            container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
            
            if [ -z "$container_id" ]; then
                container_id=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
            fi
            
            if [ -z "$container_id" ]; then
                ((retry_count++))
                log_warning "No app container found, attempt $retry_count/$max_retries"
                sleep 5
            fi
        done
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found for migrations after $max_retries attempts"
            exit 1
        fi
        
        log_info "Found app container: $container_id"
        
        # Ensure database is ready before migrations
        log_info "Verifying database connectivity before migrations..."
        local max_db_retries=30
        local db_retry_count=0
        local database_ready=false
        
        while [ $db_retry_count -lt $max_db_retries ]; do
            # Use psql with explicit parameters for robustness
            if docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$container_id" \
                psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "Database connectivity verified after $((db_retry_count * 5)) seconds"
                database_ready=true
                break
            fi
            
            ((db_retry_count++))
            log_debug "Database not ready for migrations, retry $db_retry_count/$max_db_retries"
            
            # Every 5 retries, show more debug info
            if [ $((db_retry_count % 5)) -eq 0 ]; then
                log_warning "Database connectivity check failing. Dumping debug info..."
                log_sanitized_db_url "$container_id"
                
                log_debug "Testing network connectivity from app container to postgres..."
                docker exec "$container_id" sh -c 'nc -zv postgres 5432' || log_warning "Network connectivity test to postgres:5432 failed."
            fi
            
            sleep 5
        done
        
        if [ "$database_ready" = false ]; then
            log_error "Database connectivity check failed after $((max_db_retries * 5)) seconds"
            log_error "Checking DATABASE_URL in container..."
            docker exec "$container_id" sh -c 'echo "DATABASE_URL: ${DATABASE_URL}"' || true
            
            # Try running migration anyway with verbose output for debugging
            log_warning "Attempting migration despite connectivity check failure..."
        fi
        
        # Run migrations in the app container
        log_info "Running Prisma migrations..."
        
        log_info "Checking for existing Prisma migrations..."
        if docker exec "$container_id" sh -c '[ -d "prisma/migrations" ] && [ -n "$(ls -A "prisma/migrations")" ]'; then
            log_info "Migrations exist. Running 'prisma migrate deploy'..."
            if docker exec "$container_id" npx prisma migrate deploy; then
                log_success "Migrations applied successfully."
            else
                log_error "Migration deploy failed."
                exit 1
            fi
        else
            log_info "No migrations found. Running 'prisma db push' to sync schema..."
            if docker exec "$container_id" npx prisma db push --accept-data-loss; then
                log_success "Schema pushed successfully."
            else
                log_error "Schema push failed."
                exit 1
            fi
        fi
    fi
}

run_seeds() {
    local should_seed="${1:-false}"
    
    if [ "$should_seed" = true ]; then
        log_info "Running database seeds..."
        
        # Find running app container
        local container_id=""
        container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            container_id=$(docker ps --filter "name=app" --format "{{.ID}}" | head -1)
        fi
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found for seeding"
            exit 1
        fi
        
        log_info "Found app container: $container_id"
        
        # Ensure database is ready before seeding
        log_info "Verifying database connectivity before seeding..."
        local max_retries=10
        local retry_count=0
        local database_ready=false
        
        while [ $retry_count -lt $max_retries ]; do
            # Use psql with explicit parameters for robustness
            if docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$container_id" \
                psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "Database connectivity verified for seeding"
                database_ready=true
                break
            fi
            ((retry_count++))
            log_debug "Database not ready for seeding, retry $retry_count/$max_retries"

            # On every 3rd retry, show debug info
            if [ $((retry_count % 3)) -eq 0 ]; then
                log_warning "Database connectivity check for seeding failing. Dumping debug info..."
                log_sanitized_db_url "$container_id"
            fi

            sleep 3
        done
        
        if [ "$database_ready" = false ]; then
            log_error "Database connectivity check failed for seeding after $((max_retries * 3)) seconds"
            return 1
        fi
        
        # Run seeds in the app container using a script for better error handling
        log_info "Running database seeds..."
        
        docker exec "$container_id" sh -c 'cat > /tmp/seed.sh << "EOF"
#!/bin/sh
set -e

echo "Starting seed process..."

# Try Prisma seed first
if npx prisma db seed 2>&1; then
    echo "Prisma seeds completed successfully"
    exit 0
fi

# Check if error is due to existing data
if npx prisma db seed 2>&1 | grep -q "Unique constraint\|already exists"; then
    echo "Some seed data already exists, continuing..."
    exit 0
fi

# Try manual seed files as fallback
echo "Trying manual seed execution..."

# Check for CommonJS seed file
if [ -f lib/seed.cjs ]; then
    echo "Running CommonJS seed file..."
    if node lib/seed.cjs; then
        echo "Manual seeds (CommonJS) completed"
        exit 0
    fi
fi

# Check for regular JS seed file
if [ -f lib/seed.js ]; then
    echo "Running JavaScript seed file..."
    if node lib/seed.js; then
        echo "Manual seeds (JS) completed"
        exit 0
    fi
fi

# Check for TypeScript compiled seed
if [ -f prisma/seed.js ]; then
    echo "Running compiled seed file..."
    if node prisma/seed.js; then
        echo "Compiled seeds completed"
        exit 0
    fi
fi

echo "Warning: No seed files found or seeding failed"
echo "This may be expected if data already exists"
exit 0
EOF
chmod +x /tmp/seed.sh
/tmp/seed.sh
'
        
        if [ $? -eq 0 ]; then
            log_success "Database seeding process completed"
        else
            log_warning "Seeding encountered issues - this may be expected if data already exists"
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
    
    echo
    log_info "Volume Status:"
    docker volume ls --filter "name=${STACK_NAME}" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
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
    echo "Early DB Start: $EARLY_DB_START"
    echo "Cleanup Volumes: $CLEANUP_VOLUMES"
    echo "================================================"
    
    if [ "$CLEANUP_VOLUMES" = true ]; then
        echo -e "${RED}⚠️  WARNING: Volume cleanup is enabled!${NC}"
        echo -e "${RED}This will DELETE ALL DATA in the database!${NC}"
    fi
    
    confirm "Deploy with above configuration?"
    
    check_swarm
    cleanup_compiled_files
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

handle_cleanup() {
    log_info "Running cleanup for $ENVIRONMENT environment..."
    
    if [ "$CLEANUP_VOLUMES" = true ]; then
        log_warning "Volume cleanup requested - data will be deleted!"
        confirm "Delete all Docker volumes for $ENVIRONMENT?"
    fi
    
    cleanup_compiled_files
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
