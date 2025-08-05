#!/bin/bash

# HealthApp Docker Deployment Script
# Usage: ./scripts/deploy.sh [development|production|staging] [--build] [--migrate] [--seed]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
ENVIRONMENT="development"
BUILD_IMAGES=false
RUN_MIGRATIONS=false
RUN_SEEDERS=false
COMPOSE_FILE="docker-compose.yml"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|production|staging)
            ENVIRONMENT="$1"
            shift
            ;;
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        --seed)
            RUN_SEEDERS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [development|production|staging] [--build] [--migrate] [--seed]"
            echo ""
            echo "Options:"
            echo "  development    Deploy in development mode (default)"
            echo "  production     Deploy in production mode"
            echo "  staging        Deploy in staging mode"
            echo "  --build        Force rebuild of Docker images"
            echo "  --migrate      Run database migrations after deployment"
            echo "  --seed         Run database seeders after deployment"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

log_info "Starting HealthApp deployment for environment: $ENVIRONMENT"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set environment file based on deployment environment
ENV_FILE="env_files/.env.docker.$ENVIRONMENT"

if [[ ! -f "$ENV_FILE" ]]; then
    log_error "Environment file $ENV_FILE not found!"
    exit 1
fi

log_info "Using environment configuration: $ENV_FILE"

# Export environment variables
set -a
source "$ENV_FILE"
set +a

# Validate required environment variables for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    required_vars=("DB_PASSWORD" "JWT_SECRET" "STRIPE_SECRET_KEY")
    for var in "${required_vars[@]}"; do
        if [[ "${!var}" == *"CHANGE_THIS"* ]] || [[ -z "${!var}" ]]; then
            log_error "Production environment variable $var must be set to a secure value"
            exit 1
        fi
    done
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down

# Build images if requested or if they don't exist
if [[ "$BUILD_IMAGES" == true ]]; then
    log_info "Building Docker images..."
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --no-cache
elif [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Building production images..."
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build
fi

# Start services
log_info "Starting services..."
if [[ "$ENVIRONMENT" == "development" ]]; then
    # Start with pgAdmin for development
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile tools up -d
else
    # Production deployment without pgAdmin
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
fi

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
timeout=120
elapsed=0

while [[ $elapsed -lt $timeout ]]; do
    if docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
        log_warn "Some services are still starting up... ($elapsed/${timeout}s)"
        sleep 5
        elapsed=$((elapsed + 5))
    else
        break
    fi
done

if [[ $elapsed -ge $timeout ]]; then
    log_error "Services failed to start within $timeout seconds"
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs
    exit 1
fi

log_info "Services are running successfully!"

# Run migrations if requested
if [[ "$RUN_MIGRATIONS" == true ]]; then
    log_info "Running database migrations..."
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec backend npm run migrate
fi

# Run seeders if requested
if [[ "$RUN_SEEDERS" == true ]]; then
    log_info "Running database seeders..."
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec backend npm run seed
fi

# Show status
log_info "Deployment complete! Services status:"
docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

# Show access URLs
log_info "Access URLs:"
log_info "  Frontend: http://localhost:${FRONTEND_PORT:-3002}"
log_info "  Backend API: http://localhost:${BACKEND_PORT:-3001}"

if [[ "$ENVIRONMENT" == "development" ]]; then
    log_info "  pgAdmin: http://localhost:${PGADMIN_PORT:-5050}"
fi

log_info "To view logs: docker-compose --env-file $ENV_FILE logs -f [service_name]"
log_info "To stop: docker-compose --env-file $ENV_FILE down"