#!/bin/bash

# deploy-local.sh - Local Development Deployment Script  
# Usage: ./scripts/deploy-local.sh [COMMAND] [OPTIONS]
# Purpose: Local development using Docker Compose for debugging and development

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

# Default Port Configuration for Local Development
DEFAULT_PORT_FRONTEND=3002
DEFAULT_PORT_BACKEND=5001
DEFAULT_PORT_DB=5432
DEFAULT_PORT_REDIS=6379
DEFAULT_PORT_PGADMIN=5050

# Default Configuration
DEFAULT_DOMAIN="localhost"
DEFAULT_ENV_FILE=".env.local"
DEFAULT_PROJECT_NAME="healthapp-local"

# Runtime Variables (will be set by parse_args)
COMMAND=""
DOMAIN="$DEFAULT_DOMAIN"
ENV_FILE="$DEFAULT_ENV_FILE"
PROJECT_NAME="$DEFAULT_PROJECT_NAME"

PORT_FRONTEND="$DEFAULT_PORT_FRONTEND"
PORT_BACKEND="$DEFAULT_PORT_BACKEND"
PORT_DB="$DEFAULT_PORT_DB"
PORT_REDIS="$DEFAULT_PORT_REDIS"
PORT_PGADMIN="$DEFAULT_PORT_PGADMIN"

MIGRATE=false
SEED=false
CLEANUP=false
AUTO_YES=false
DETACH=true

# ============================================================================
# Helper Functions
# ============================================================================

print_usage() {
    cat << EOF
🛠️  HealthApp Local Development Deployment
========================================

Usage: ./scripts/deploy-local.sh [COMMAND] [OPTIONS]

COMMANDS:
  up           Start all services (default: detached)
  down         Stop and remove all services  
  start        Start existing services
  stop         Stop services without removing
  restart      Restart all services
  logs         Show service logs (specify service or see all)
  ps           Show running containers
  migrate      Run database migrations only
  seed         Run database seeders only
  build        Build/rebuild images
  clean        Clean up everything (containers, volumes, networks)

OPTIONS:
  --domain DOMAIN            Domain for the application (default: localhost)
  --env-file FILE            Environment file to load (default: .env.local)
  --project PROJECT          Docker Compose project name (default: healthapp-local)
  
  --port-frontend PORT       Frontend port (default: 3002)
  --port-backend PORT        Backend port (default: 5001)
  --port-db PORT             Database port (default: 5432)
  --port-redis PORT          Redis port (default: 6379)
  --port-pgadmin PORT        PgAdmin port (default: 5050)
  
  --migrate                  Run database migrations after startup
  --seed                     Run database seeders after startup
  --cleanup                  Clean up before starting
  --foreground               Run in foreground (not detached)
  --auto-yes                Skip all confirmation prompts

EXAMPLES:
  # Start local development environment
  ./scripts/deploy-local.sh up --migrate --seed

  # Start with custom ports
  ./scripts/deploy-local.sh up --port-frontend 3010 --port-backend 5010

  # View logs
  ./scripts/deploy-local.sh logs frontend

  # Clean restart
  ./scripts/deploy-local.sh restart --cleanup --migrate

  # Stop everything
  ./scripts/deploy-local.sh down

LOCAL DEVELOPMENT URLS:
  Frontend:    http://localhost:3002
  Backend API: http://localhost:5001/api
  PgAdmin:     http://localhost:5050
  Database:    postgresql://healthapp_user:local_password@localhost:5432/healthapp_local

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

log_local() {
    echo -e "${CYAN}[LOCAL]${NC} $1"
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
        COMMAND="up"
    else
        COMMAND="$1"
        shift
    fi

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
            --project)
                PROJECT_NAME="$2"
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
            --foreground)
                DETACH=false
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
}

# ============================================================================
# Environment Setup Functions
# ============================================================================

setup_environment() {
    log_info "Setting up local development environment..."

    # Load environment file if it exists
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading environment from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    elif [ "$ENV_FILE" != ".env.local" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi

    # Set local environment variables
    export COMPOSE_PROJECT_NAME="$PROJECT_NAME"
    export DOCKER_COMPOSE_FILE="docker/docker-compose.local.yml"
    
    # Port configuration
    export HOST_PORT_FRONTEND="$PORT_FRONTEND"
    export HOST_PORT_BACKEND="$PORT_BACKEND"
    export HOST_PORT_DB="$PORT_DB"
    export HOST_PORT_REDIS="$PORT_REDIS"
    export HOST_PORT_PGADMIN="$PORT_PGADMIN"

    # Application configuration
    export NODE_ENV="development"
    export FRONTEND_URL="http://$DOMAIN:$PORT_FRONTEND"
    export BACKEND_URL="http://$DOMAIN:$PORT_BACKEND"
    export NEXT_PUBLIC_API_URL="$BACKEND_URL/api"

    # Database configuration
    export POSTGRES_DB="healthapp_local"
    export POSTGRES_USER="${POSTGRES_USER:-healthapp_user}"
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-local_password}"
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$PORT_DB/$POSTGRES_DB?schema=public"

    # NextAuth configuration
    export NEXTAUTH_URL="$FRONTEND_URL"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-nextauth-secret-2025-dev}"

    # Redis configuration  
    export REDIS_URL="redis://localhost:$PORT_REDIS"

    log_success "Local environment setup complete"
}

# ============================================================================
# Docker Compose Functions
# ============================================================================

cleanup_environment() {
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up local environment..."
        
        # Stop and remove containers
        docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" down --volumes --remove-orphans 2>/dev/null || true
        
        # Clean up dangling resources
        docker system prune -f >/dev/null 2>&1 || true
        
        log_success "Cleanup complete"
    fi
}

compose_up() {
    log_local "Starting local development environment..."
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi

    local flags=""
    if [ "$DETACH" = true ]; then
        flags="$flags -d"
    fi

    # Start services
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" up $flags --build
    
    if [ "$DETACH" = true ]; then
        log_success "Services started successfully"
        show_status
    fi
}

compose_down() {
    log_info "Stopping local development environment..."
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" down
    log_success "Services stopped"
}

compose_start() {
    log_info "Starting existing services..."
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" start
    log_success "Services started"
}

compose_stop() {
    log_info "Stopping services..."
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" stop
    log_success "Services stopped"
}

compose_restart() {
    log_info "Restarting services..."
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" restart
    log_success "Services restarted"
}

compose_build() {
    log_info "Building images..."
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" build
    log_success "Images built"
}

# ============================================================================
# Database Functions
# ============================================================================

run_migrations() {
    if [ "$MIGRATE" = true ]; then
        log_info "Running database migrations..."
        
        # Wait for database to be ready
        sleep 5
        
        # Run migrations
        docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" exec backend npx prisma migrate deploy
        
        log_success "Migrations completed"
    fi
}

run_seeds() {
    if [ "$SEED" = true ]; then
        log_info "Running database seeds..."
        
        # Run seeds
        docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" exec backend npx prisma db seed
        
        log_success "Seeds completed"
    fi
}

# ============================================================================
# Utility Functions
# ============================================================================

show_status() {
    log_info "Local Development Status:"
    docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" ps
    
    echo
    log_info "Service URLs:"
    echo "Frontend:    http://$DOMAIN:$PORT_FRONTEND"
    echo "Backend API: http://$DOMAIN:$PORT_BACKEND/api"
    echo "PgAdmin:     http://$DOMAIN:$PORT_PGADMIN"
    echo "Database:    postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$DOMAIN:$PORT_DB/$POSTGRES_DB"
}

show_logs() {
    local service_name="$1"
    if [ -n "$service_name" ]; then
        docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" logs -f "$service_name"
    else
        docker-compose -p "$PROJECT_NAME" -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# ============================================================================
# Command Handlers
# ============================================================================

handle_up() {
    log_local "Starting HealthApp Local Development"
    echo "===================================="
    echo "Project: $PROJECT_NAME"
    echo "Domain: $DOMAIN"
    echo "Frontend: http://$DOMAIN:$PORT_FRONTEND"
    echo "Backend: http://$DOMAIN:$PORT_BACKEND"
    echo "Database: $PORT_DB"
    echo "===================================="
    
    if [ "$AUTO_YES" = false ]; then
        confirm "Start local development environment?"
    fi
    
    cleanup_environment
    compose_up
    run_migrations
    run_seeds
    
    if [ "$DETACH" = true ]; then
        echo
        log_success "Local development environment ready!"
        echo "Frontend: http://$DOMAIN:$PORT_FRONTEND"
        echo "Backend API: http://$DOMAIN:$PORT_BACKEND/api"
    fi
}

handle_down() {
    confirm "Stop local development environment?"
    compose_down
}

handle_start() {
    compose_start
}

handle_stop() {
    compose_stop
}

handle_restart() {
    if [ "$CLEANUP" = true ]; then
        handle_down
        handle_up
    else
        compose_restart
        run_migrations
        run_seeds
    fi
}

handle_logs() {
    shift # Remove 'logs' command
    show_logs "$1"
}

handle_ps() {
    show_status
}

handle_build() {
    compose_build
}

handle_clean() {
    confirm "Clean up all local development data?"
    CLEANUP=true
    cleanup_environment
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
        up)
            handle_up
            ;;
        down)
            handle_down
            ;;
        start)
            handle_start
            ;;
        stop)
            handle_stop
            ;;
        restart)
            handle_restart
            ;;
        logs)
            handle_logs "$@"
            ;;
        ps)
            handle_ps
            ;;
        build)
            handle_build
            ;;
        clean)
            handle_clean
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