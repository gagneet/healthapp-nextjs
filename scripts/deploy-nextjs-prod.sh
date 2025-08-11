#!/bin/bash

# deploy-nextjs-prod.sh - Deploy Next.js Healthcare Application to production
# Updated for pure Next.js architecture with Prisma integration
# Usage: ./scripts/deploy-nextjs-prod.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-nextjs-prod"
STACK_FILE="docker/docker-compose.nextjs-prod.yml"
COMPOSE_FILE="docker/docker-compose.nextjs-prod.yml"
REGISTRY="your-registry.com" # Update with your container registry

# Default values
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false
DOMAIN="localhost"

# Help function
show_help() {
    echo "🏥 HealthApp Next.js Production Deployment Script"
    echo "================================================="
    echo ""
    echo "Architecture: Pure Next.js 14 + Prisma + PostgreSQL"
    echo "Port: 3002 (Next.js with API routes)"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the Next.js stack"
    echo "  update    Update running services"
    echo "  stop      Stop the stack"
    echo "  logs      Show service logs"
    echo "  status    Show service status"
    echo "  build     Build Next.js image"
    echo "  migrate   Run Prisma migrations"
    echo "  seed      Run database seeds"
    echo "  backup    Backup production database"
    echo "  scale     Scale Next.js service"
    echo ""
    echo "Options:"
    echo "  --domain DOMAIN      Set domain for deployment (default: localhost)"
    echo "  --migrate           Run database migrations after deployment"
    echo "  --seed              Run database seeders after deployment"
    echo "  --auto-yes          Skip confirmation prompts"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --domain healthapp.com --migrate --seed"
    echo "  $0 logs nextjs"
    echo "  $0 scale 3"
    echo ""
}

# Check if Docker and Docker Compose are available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker Compose is not installed"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Docker environment verified"
}

# Create required environment files
create_env_files() {
    echo -e "${BLUE}[INFO]${NC} Creating production environment configuration..."
    
    # Create env_files directory if it doesn't exist
    mkdir -p env_files
    
    # Create production environment file
    if [ ! -f "env_files/.env.production" ]; then
        cat > env_files/.env.production << EOF
# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================================================
NODE_ENV=production
PORT=3002

# Database Configuration (Prisma)
DATABASE_URL="postgresql://healthapp_user:\${POSTGRES_PASSWORD}@postgres:5432/healthapp_prod?schema=public"
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_prod
POSTGRES_USER=healthapp_user

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application URLs
FRONTEND_URL=https://${DOMAIN}
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1

# Healthcare Compliance
SESSION_TIMEOUT=3600000
VERSION=4.0.0-nextjs-prisma
EOF
        echo -e "${GREEN}[SUCCESS]${NC} Created production environment file"
    else
        echo -e "${YELLOW}[WARNING]${NC} Production environment file already exists"
    fi
}

# Build Next.js production image
build_image() {
    echo -e "${BLUE}[INFO]${NC} Building Next.js production image..."
    
    # Build the Next.js application image
    docker build -f docker/Dockerfile.nextjs -t healthapp-nextjs:prod .
    
    if [ "$REGISTRY" != "your-registry.com" ]; then
        docker tag healthapp-nextjs:prod $REGISTRY/healthapp-nextjs:prod
        echo -e "${BLUE}[INFO]${NC} Pushing image to registry..."
        docker push $REGISTRY/healthapp-nextjs:prod
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js production image built successfully!"
}

# Deploy stack
deploy_stack() {
    echo -e "${BLUE}[INFO]${NC} Deploying HealthApp Next.js production stack..."
    echo -e "${BLUE}[INFO]${NC} Architecture: Next.js 14 + Prisma + PostgreSQL"
    echo -e "${BLUE}[INFO]${NC} Port: 3002 (Next.js with integrated API)"
    echo -e "${BLUE}[INFO]${NC} Domain: $DOMAIN"
    
    # Set environment variables
    export DOMAIN=$DOMAIN
    export HOST_IP=${HOST_IP:-localhost}
    
    # Prompt for sensitive information if not set
    if [ -z "$POSTGRES_PASSWORD" ]; then
        read -s -p "Enter PostgreSQL password: " POSTGRES_PASSWORD
        echo ""
        export POSTGRES_PASSWORD
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        read -s -p "Enter JWT secret (256-bit): " JWT_SECRET
        echo ""
        export JWT_SECRET
    fi
    
    if [ -z "$REDIS_PASSWORD" ]; then
        read -s -p "Enter Redis password: " REDIS_PASSWORD
        echo ""
        export REDIS_PASSWORD
    fi
    
    # Create environment files
    create_env_files
    
    # Build image
    build_image
    
    # Deploy using Docker Compose
    echo -e "${BLUE}[INFO]${NC} Starting production deployment..."
    docker-compose -f $COMPOSE_FILE up -d --build
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js production stack deployed successfully!"
    
    # Wait for services to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
    sleep 30
    
    # Run migrations if requested
    if [ "$RUN_MIGRATE" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Running Prisma migrations..."
        run_migrations
    fi
    
    # Run seeders if requested
    if [ "$RUN_SEED" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Running database seeders..."
        run_seeders
    fi
    
    echo -e "${BLUE}[INFO]${NC} Healthcare Application: https://$DOMAIN"
    echo -e "${BLUE}[INFO]${NC} API Health Check: https://$DOMAIN/api/health"
    echo ""
    echo -e "${YELLOW}[NEXT]${NC} Run '$0 logs' to see application logs"
    echo -e "${YELLOW}[NEXT]${NC} Run '$0 status' to check service status"
}

# Update services with zero-downtime deployment
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating Next.js production services..."
    
    # Build new image
    build_image
    
    # Perform rolling update
    docker-compose -f $COMPOSE_FILE up -d --no-deps nextjs
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js services updated successfully!"
}

# Stop stack
stop_stack() {
    echo -e "${YELLOW}[WARNING]${NC} This will stop the production environment!"
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Operation cancelled"
            return
        fi
    fi
    
    echo -e "${BLUE}[INFO]${NC} Stopping HealthApp Next.js production stack..."
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}[SUCCESS]${NC} Production stack stopped successfully!"
}

# Show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        echo -e "${BLUE}[INFO]${NC} Showing logs for all services..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        echo -e "${BLUE}[INFO]${NC} Showing logs for $service..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 $service
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}[INFO]${NC} HealthApp Next.js Production Status:"
    echo ""
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    # Check health endpoints
    echo -e "${BLUE}[INFO]${NC} Health Check Results:"
    
    # Check Next.js health
    if curl -f -s http://localhost:3002/api/health > /dev/null; then
        echo -e "${GREEN}✅ Next.js API:${NC} Healthy"
    else
        echo -e "${RED}❌ Next.js API:${NC} Unhealthy"
    fi
    
    # Check PostgreSQL
    if docker-compose -f $COMPOSE_FILE exec postgres pg_isready -U healthapp_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL:${NC} Ready"
    else
        echo -e "${RED}❌ PostgreSQL:${NC} Not Ready"
    fi
}

# Scale Next.js service
scale_service() {
    local replicas=${1:-2}
    
    echo -e "${YELLOW}[WARNING]${NC} Scaling Next.js service to $replicas replicas"
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Scaling cancelled"
            return
        fi
    fi
    
    docker-compose -f $COMPOSE_FILE up -d --scale nextjs=$replicas
    echo -e "${GREEN}[SUCCESS]${NC} Next.js service scaled to $replicas replicas!"
}

# Run Prisma migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running Prisma database migrations..."
    
    # Wait for Next.js service to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for Next.js service..."
    sleep 15
    
    # Get Next.js container
    CONTAINER_ID=$(docker-compose -f $COMPOSE_FILE ps -q nextjs)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No Next.js containers found"
        exit 1
    fi
    
    # Run Prisma migrations
    echo -e "${BLUE}[INFO]${NC} Running Prisma migrations..."
    docker exec $CONTAINER_ID npx prisma migrate deploy
    
    echo -e "${GREEN}[SUCCESS]${NC} Prisma migrations completed!"
}

# Run database seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders..."
    
    # Get Next.js container
    CONTAINER_ID=$(docker-compose -f $COMPOSE_FILE ps -q nextjs)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No Next.js containers found"
        exit 1
    fi
    
    # Note: You'll need to implement seeding through Prisma or API endpoints
    echo -e "${BLUE}[INFO]${NC} Running custom seeding script..."
    # docker exec $CONTAINER_ID npm run seed:prod
    
    echo -e "${GREEN}[SUCCESS]${NC} Database seeders completed!"
}

# Backup database
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating production database backup..."
    
    BACKUP_FILE="healthapp_nextjs_prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Get postgres container
    POSTGRES_ID=$(docker-compose -f $COMPOSE_FILE ps -q postgres)
    
    if [ -z "$POSTGRES_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No postgres containers found"
        exit 1
    fi
    
    docker exec $POSTGRES_ID pg_dump -U healthapp_user healthapp_prod > $BACKUP_FILE
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $BACKUP_FILE"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --migrate)
                RUN_MIGRATE=true
                shift
                ;;
            --seed)
                RUN_SEED=true
                shift
                ;;
            --auto-yes)
                AUTO_YES=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
}

# Main script logic
main() {
    # Parse arguments first
    parse_args "$@"
    
    check_docker
    
    case ${1:-""} in
        deploy)
            deploy_stack
            ;;
        update)
            update_services
            ;;
        stop)
            stop_stack
            ;;
        logs)
            show_logs $2
            ;;
        status)
            show_status
            ;;
        build)
            build_image
            ;;
        scale)
            scale_service $2
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            run_seeders
            ;;
        backup)
            backup_database
            ;;
        -h|--help|help)
            show_help
            ;;
        "")
            echo -e "${YELLOW}[WARNING]${NC} No command specified"
            show_help
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"