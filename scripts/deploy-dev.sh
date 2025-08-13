#!/bin/bash

# deploy-dev.sh - Development environment deployment
# Usage: ./scripts/deploy-dev.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-dev"
STACK_FILE="docker/docker-stack.dev.yml"

# Default values
APP_NAME="healthapp"
STACK_NAME="$APP_NAME-dev"
DOMAIN="localhost"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'master')"
SCALE_APP=2
SCALE_DB=1
SCALE_REDIS=1
SCALE_PGADMIN=1

# Default ports
PORT_APP=3002
PORT_DB=5432
PORT_REDIS=6379
PORT_PGADMIN=5050

# Default domains (same as main domain by default)
DOMAIN_DB="$DOMAIN"
DOMAIN_REDIS="$DOMAIN" 
DOMAIN_PGADMIN="$DOMAIN"

# Flags
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false

# Help function
show_help() {
    echo "🏥 HealthApp Development Environment Deployment"
    echo "=============================================="
    echo ""
    echo "Environment: Development server deployment"
    echo "Architecture: Next.js 14 + Node.js backend + PostgreSQL + Redis"
    echo "Deployment: Docker Swarm with load balancing"
    echo "Ports: Frontend(3002), Backend(3005), PostgreSQL(5432), Redis(6379), PgAdmin(5050)"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy development stack to swarm"
    echo "  update    Update running services"
    echo "  stop      Remove stack from swarm"
    echo "  logs      Show service logs"
    echo "  status    Show service status and health"
    echo "  scale     Scale specific service"
    echo "  migrate   Run database migrations"
    echo "  seed      Run database seeders"
    echo "  backup    Backup development database"
    echo ""
    echo "Scaling Options:"
    echo "  --scale N               Scale app service to N replicas (default: 2)"
    echo "  --scale-db N            Scale database to N replicas (default: 1)"
    echo "  --scale-redis N         Scale Redis to N replicas (default: 1)"
    echo "  --scale-pgadmin N       Scale PgAdmin to N replicas (default: 1)"
    echo ""
    echo "Migration & Seeding:"
    echo "  --migrate               Run database migrations (idempotent)"
    echo "  --seed                  Run database seeders (idempotent)"
    echo ""
    echo "Network Configuration:"
    echo "  --domain DOMAIN         Main application domain (default: localhost)"
    echo "  --domain-db DOMAIN      Database domain/IP (default: same as --domain)"
    echo "  --domain-redis DOMAIN   Redis domain/IP (default: same as --domain)"
    echo "  --domain-pgadmin DOMAIN PgAdmin domain/IP (default: same as --domain)"
    echo ""
    echo "Port Configuration:"
    echo "  --port-app PORT         Application port (default: 3002)"
    echo "  --port-db PORT          Database port (default: 5432)"
    echo "  --port-redis PORT       Redis port (default: 6379)"
    echo "  --port-pgadmin PORT     PgAdmin port (default: 5050)"
    echo ""
    echo "Application Configuration:"
    echo "  --app-name NAME         Stack and service name prefix (default: healthapp)"
    echo "  --branch BRANCH         Git branch to deploy (default: current)"
    echo ""
    echo "Safety Options:"
    echo "  --auto-yes              Skip confirmation prompts"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --migrate --seed"
    echo "  $0 deploy --host-ip 192.168.1.100"
    echo "  $0 scale frontend 3"
    echo "  $0 logs backend"
    echo "  $0 backup"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --scale)
                SCALE_APP="$2"
                shift 2
                ;;
            --scale-db)
                SCALE_DB="$2"
                shift 2
                ;;
            --scale-redis)
                SCALE_REDIS="$2"
                shift 2
                ;;
            --scale-pgadmin)
                SCALE_PGADMIN="$2"
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
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --domain-db)
                DOMAIN_DB="$2"
                shift 2
                ;;
            --domain-redis)
                DOMAIN_REDIS="$2"
                shift 2
                ;;
            --domain-pgadmin)
                DOMAIN_PGADMIN="$2"
                shift 2
                ;;
            --port-app)
                PORT_APP="$2"
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
            --app-name)
                APP_NAME="$2"
                STACK_NAME="$APP_NAME-dev"
                shift 2
                ;;
            --branch)
                BRANCH="$2"
                shift 2
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

# Check Docker Swarm
check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        echo -e "${YELLOW}[WARNING]${NC} Docker Swarm not active. Initializing..."
        docker swarm init
        echo -e "${GREEN}[SUCCESS]${NC} Docker Swarm initialized!"
    fi
}

# Build development images
build_images() {
    echo -e "${BLUE}[INFO]${NC} Building development images..."
    
    docker build -f docker/Dockerfile.local --target backend-dev -t healthapp-backend:dev .
    docker build -f docker/Dockerfile.local --target frontend-dev -t healthapp-frontend:dev .
    
    echo -e "${GREEN}[SUCCESS]${NC} Development images built!"
}

# Deploy stack
deploy_stack() {
    echo -e "${BLUE}[INFO]${NC} Deploying HealthApp development stack..."
    echo -e "${BLUE}[INFO]${NC} Host IP: $HOST_IP"
    
    export HOST_IP
    export FRONTEND_URL="http://$HOST_IP:3002"
    export BACKEND_URL="http://$HOST_IP:3005"
    export POSTGRES_HOST="$HOST_IP"
    export REDIS_HOST="$HOST_IP"
    
    # Set development environment variables
    export POSTGRES_DB=healthapp_dev
    export POSTGRES_USER=healthapp_user
    export POSTGRES_PASSWORD=dev_password
    export JWT_SECRET=dev_jwt_secret_key_2024
    export REDIS_PASSWORD=dev_redis_password
    
    build_images
    docker stack deploy -c $STACK_FILE $STACK_NAME
    
    echo -e "${GREEN}[SUCCESS]${NC} Development stack deployed!"
    echo -e "${BLUE}[INFO]${NC} Frontend: http://$HOST_IP:3002"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://$HOST_IP:3005"
    echo -e "${BLUE}[INFO]${NC} PgAdmin: http://$HOST_IP:5050"
    
    if [ "$RUN_MIGRATE" = true ] || [ "$RUN_SEED" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
        sleep 30
        
        if [ "$RUN_MIGRATE" = true ]; then
            run_migrations
        fi
        
        if [ "$RUN_SEED" = true ]; then
            run_seeders
        fi
    fi
}

# Update services
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating development services..."
    build_images
    docker service update --force ${STACK_NAME}_backend
    docker service update --force ${STACK_NAME}_frontend
    echo -e "${GREEN}[SUCCESS]${NC} Services updated!"
}

# Stop stack
stop_stack() {
    echo -e "${BLUE}[INFO]${NC} Removing development stack..."
    docker stack rm $STACK_NAME
    echo -e "${GREEN}[SUCCESS]${NC} Stack removed!"
}

# Show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        echo -e "${BLUE}[INFO]${NC} Showing logs for all services..."
        for svc in $(docker service ls --filter name=${STACK_NAME} --format "{{.Name}}"); do
            echo -e "${YELLOW}=== $svc ===${NC}"
            docker service logs --tail 50 $svc
            echo ""
        done
    else
        echo -e "${BLUE}[INFO]${NC} Showing logs for ${STACK_NAME}_$service..."
        docker service logs -f ${STACK_NAME}_$service
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}[INFO]${NC} Development Stack Status:"
    echo ""
    docker stack services $STACK_NAME
    echo ""
    echo -e "${BLUE}[INFO]${NC} Service Tasks:"
    docker stack ps $STACK_NAME --no-trunc
}

# Scale service
scale_service() {
    local service=$1
    local replicas=$2
    
    if [ -z "$service" ] || [ -z "$replicas" ]; then
        echo -e "${RED}[ERROR]${NC} Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    echo -e "${BLUE}[INFO]${NC} Scaling ${STACK_NAME}_$service to $replicas replicas..."
    docker service scale ${STACK_NAME}_$service=$replicas
    echo -e "${GREEN}[SUCCESS]${NC} Service scaled!"
}

# Run migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running database migrations..."
    
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID npm run migrations:build
    docker exec $CONTAINER_ID npm run migrate
    echo -e "${GREEN}[SUCCESS]${NC} Migrations completed!"
}

# Run seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders..."
    
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID npm run migrations:build
    docker exec $CONTAINER_ID npm run seed
    echo -e "${GREEN}[SUCCESS]${NC} Seeders completed!"
}

# Backup database
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating development database backup..."
    
    BACKUP_FILE="healthapp_dev_backup_$(date +%Y%m%d_%H%M%S).sql"
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} PostgreSQL container not found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID pg_dump -U healthapp_user healthapp_dev > $BACKUP_FILE
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $BACKUP_FILE"
}

# Main function
main() {
    parse_args "$@"
    check_swarm
    
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
        scale)
            scale_service $2 $3
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
            show_help
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"