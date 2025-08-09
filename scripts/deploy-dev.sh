#!/bin/bash

# deploy-dev.sh - Deploy to development environment using Docker Swarm
# Usage: ./scripts/deploy-dev.sh [deploy|update|stop|logs|status]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-dev"
STACK_FILE="docker-stack.dev.yml"

# Help function
show_help() {
    echo "🏥 HealthApp Development Deployment Script"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the stack to swarm"
    echo "  update    Update running services"
    echo "  stop      Remove the stack from swarm"
    echo "  logs      Show service logs"
    echo "  status    Show service status"
    echo "  build     Build and push images"
    echo "  scale     Scale specific service"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy development stack"
    echo "  $0 logs backend              # Show backend service logs"
    echo "  $0 scale backend 3           # Scale backend to 3 replicas"
    echo ""
}

# Check if Docker Swarm is initialized
check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        echo -e "${YELLOW}[WARNING]${NC} Docker Swarm is not active. Initializing..."
        docker swarm init
        echo -e "${GREEN}[SUCCESS]${NC} Docker Swarm initialized!"
    fi
}

# Build and push images
build_images() {
    echo -e "${BLUE}[INFO]${NC} Building development images..."
    
    # Build backend image
    echo -e "${BLUE}[INFO]${NC} Building backend image..."
    docker build -f docker/Dockerfile.local --target backend-dev -t healthapp-backend:dev .
    
    # Build frontend image
    echo -e "${BLUE}[INFO]${NC} Building frontend image..."
    docker build -f docker/Dockerfile.local --target frontend-dev -t healthapp-frontend:dev .
    
    echo -e "${GREEN}[SUCCESS]${NC} Images built successfully!"
}

# Deploy stack
deploy_stack() {
    echo -e "${BLUE}[INFO]${NC} Deploying HealthApp development stack..."
    echo -e "${BLUE}[INFO]${NC} Using ports: Frontend 3002, Backend 3005, PostgreSQL 5432"
    
    docker stack deploy -c $STACK_FILE $STACK_NAME
    
    echo -e "${GREEN}[SUCCESS]${NC} Stack deployed successfully!"
    echo -e "${BLUE}[INFO]${NC} Frontend: http://localhost:3002"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://localhost:3005"
    echo -e "${BLUE}[INFO]${NC} PgAdmin: http://localhost:5050"
    echo ""
    echo -e "${YELLOW}[NEXT]${NC} Run './scripts/deploy-dev.sh logs' to see logs"
    echo -e "${YELLOW}[NEXT]${NC} Run './scripts/deploy-dev.sh status' to check service status"
}

# Update services
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating development services..."
    docker service update --force ${STACK_NAME}_backend
    docker service update --force ${STACK_NAME}_frontend
    echo -e "${GREEN}[SUCCESS]${NC} Services updated successfully!"
}

# Stop stack
stop_stack() {
    echo -e "${BLUE}[INFO]${NC} Removing HealthApp development stack..."
    docker stack rm $STACK_NAME
    echo -e "${GREEN}[SUCCESS]${NC} Stack removed successfully!"
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
    echo -e "${BLUE}[INFO]${NC} HealthApp Development Stack Status:"
    echo ""
    docker stack services $STACK_NAME
    echo ""
    echo -e "${BLUE}[INFO]${NC} Service Details:"
    docker service ps ${STACK_NAME} --no-trunc
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
    echo -e "${GREEN}[SUCCESS]${NC} Service scaled successfully!"
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running database migrations..."
    
    # Wait for backend service to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for backend service..."
    sleep 10
    
    # Get a backend container ID
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No backend containers found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID npm run migrate
    echo -e "${GREEN}[SUCCESS]${NC} Migrations completed!"
}

# Run database seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders..."
    
    # Get a backend container ID
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No backend containers found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID npm run seed
    echo -e "${GREEN}[SUCCESS]${NC} Seeders completed!"
}

# Main script logic
main() {
    check_swarm
    
    case ${1:-""} in
        deploy)
            build_images
            deploy_stack
            ;;
        update)
            build_images
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
            build_images
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