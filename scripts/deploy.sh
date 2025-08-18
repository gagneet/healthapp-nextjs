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
  --auto-yes                Skip all confirmation prompts

EXAMPLES:
  # Deploy test environment with custom domain and scaling
  ./scripts/deploy.sh test deploy --domain demo.adhere.live --replicas 2 --migrate --seed

  # Deploy production with cleanup
  ./scripts/deploy.sh prod deploy --cleanup --migrate --auto-yes

  # Scale test environment
  ./scripts/deploy.sh test scale --replicas 3

  # View production logs
  ./scripts/deploy.sh prod logs frontend

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

    # Parse remaining arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
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
            --auto-yes)
                AUTO_YES=true
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

    # Load environment file if it exists
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading environment from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    elif [ "$ENV_FILE" != ".env" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi

    # Auto-detect domain if not specified and not localhost
    if [ "$DOMAIN" = "localhost" ] && [ -n "${PUBLIC_DOMAIN:-}" ]; then
        DOMAIN="$PUBLIC_DOMAIN"
        log_info "Auto-detected domain: $DOMAIN"
    fi

    # Set environment-specific variables
    export APP_NAME="healthapp"
    export STACK_NAME="healthapp-$ENVIRONMENT"
    export DOCKER_STACK_FILE="docker/docker-stack.$ENVIRONMENT.yml"
    
    # Port configuration
    export HOST_PORT_FRONTEND="$PORT_FRONTEND"
    export HOST_PORT_BACKEND="$PORT_BACKEND"
    export HOST_PORT_DB="$PORT_DB"
    export HOST_PORT_REDIS="$PORT_REDIS"
    export HOST_PORT_PGADMIN="$PORT_PGADMIN"

    # Application configuration
    export NODE_ENV=$([ "$ENVIRONMENT" = "prod" ] && echo "production" || echo "development")
    export FRONTEND_URL="http://$DOMAIN:$PORT_FRONTEND"
    export BACKEND_URL="http://$DOMAIN:$PORT_BACKEND"
    export NEXT_PUBLIC_API_URL="$BACKEND_URL/api"

    # Database configuration
    export POSTGRES_DB="healthapp_$ENVIRONMENT"
    export DATABASE_URL="postgresql://${POSTGRES_USER:-healthapp_user}:${POSTGRES_PASSWORD:-secure_password}@tasks.${STACK_NAME}_postgres:5432/$POSTGRES_DB?schema=public"

    # NextAuth configuration (replacing JWT)
    export NEXTAUTH_URL="$FRONTEND_URL"
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        export NEXTAUTH_SECRET="${ENVIRONMENT}-nextauth-secret-$(date +%Y)-secure-key"
        log_warning "Using generated NEXTAUTH_SECRET. Set NEXTAUTH_SECRET env var for production!"
    fi

    # Scaling configuration
    export REPLICAS_FRONTEND="$REPLICAS"  # App service replicas (Next.js full-stack)
    export REPLICAS_POSTGRES="1"  # Always 1 for database
    export REPLICAS_REDIS="1"     # Always 1 for Redis
    export REPLICAS_PGADMIN="1"   # Always 1 for PgAdmin

    log_success "Environment setup complete"
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

        # Clean up networks and volumes if needed
        docker network prune -f >/dev/null 2>&1 || true
        docker volume prune -f >/dev/null 2>&1 || true

        log_success "Cleanup complete"
    fi
}

build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping image build"
        return
    fi

    log_info "Building Docker image..."
    
    # Build single Next.js full-stack application image
    docker build -t "healthapp:$ENVIRONMENT" -f docker/Dockerfile.production .
    
    log_success "Image built successfully"
}

deploy_stack() {
    log_info "Deploying stack: $STACK_NAME"
    
    if [ ! -f "$DOCKER_STACK_FILE" ]; then
        log_error "Stack file not found: $DOCKER_STACK_FILE"
        exit 1
    fi

    # Deploy the stack
    docker stack deploy -c "$DOCKER_STACK_FILE" "$STACK_NAME"
    
    log_success "Stack deployed: $STACK_NAME"
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 10
    
    # Show deployment status
    show_status
}

# ============================================================================
# Database Functions
# ============================================================================

run_migrations() {
    if [ "$MIGRATE" = true ]; then
        log_info "Running database migrations..."
        
        # Get running app container ID
        local container_id=$(docker ps --filter "name=$STACK_NAME"_app --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found"
            exit 1
        fi
        
        # Run migrations in the app container (Next.js full-stack)
        docker exec "$container_id" npx prisma migrate deploy
        
        log_success "Migrations completed"
    fi
}

run_seeds() {
    if [ "$SEED" = true ]; then
        log_info "Running database seeds..."
        
        # Get running app container ID
        local container_id=$(docker ps --filter "name=$STACK_NAME"_app --format "{{.ID}}" | head -1)
        
        if [ -z "$container_id" ]; then
            log_error "No running app containers found"
            exit 1
        fi
        
        # Run seeds in the app container (Next.js full-stack)
        docker exec "$container_id" npx prisma db seed
        
        log_success "Seeds completed"
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
    run_migrations
    run_seeds
    
    echo
    log_success "Deployment complete!"
    echo "Frontend: http://$DOMAIN:$PORT_FRONTEND"
    echo "Backend API: http://$DOMAIN:$PORT_BACKEND/api"
    echo "PgAdmin: http://$DOMAIN:$PORT_PGADMIN"
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
    MIGRATE=true
    run_migrations
}

handle_seed() {
    SEED=true  
    run_seeds
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