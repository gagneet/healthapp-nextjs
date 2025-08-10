#!/bin/bash

# deploy-prod.sh - Deploy to production environment using Docker Swarm
# Usage: ./scripts/deploy-prod.sh [COMMAND] [OPTIONS]
# Examples:
#   ./scripts/deploy-prod.sh deploy --migrate --seed
#   ./scripts/deploy-prod.sh deploy --frontend-ip 10.0.1.10 --backend-ip 10.0.1.11
#   ./scripts/deploy-prod.sh deploy --auto-yes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-prod"
STACK_FILE="docker/docker-stack.prod.yml"
REGISTRY="your-registry.com" # Update with your container registry

# Default values
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false
FRONTEND_IP="localhost"
BACKEND_IP="localhost" 
POSTGRES_IP="localhost"
REDIS_IP="localhost"

# Help function
show_help() {
    echo "🏥 HealthApp Production Deployment Script"
    echo "========================================="
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
    echo "  secrets   Manage Docker secrets"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy production stack"
    echo "  $0 logs backend              # Show backend service logs"
    echo "  $0 scale backend 5           # Scale backend to 5 replicas"
    echo "  $0 secrets create            # Create required secrets"
    echo ""
}

# Check if Docker Swarm is initialized
check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        echo -e "${RED}[ERROR]${NC} Docker Swarm is not initialized on this node"
        echo -e "${YELLOW}[INFO]${NC} Run 'docker swarm init' or join an existing swarm"
        exit 1
    fi
    
    # Check if we're on a manager node
    if ! docker info --format '{{.Swarm.ControlAvailable}}' | grep -q true; then
        echo -e "${RED}[ERROR]${NC} This node is not a swarm manager"
        echo -e "${YELLOW}[INFO]${NC} Deploy from a manager node"
        exit 1
    fi
}

# Create Docker secrets
create_secrets() {
    echo -e "${BLUE}[INFO]${NC} Creating Docker secrets..."
    
    # Check if secrets already exist
    if docker secret inspect postgres_password >/dev/null 2>&1; then
        echo -e "${YELLOW}[WARNING]${NC} Secret 'postgres_password' already exists"
    else
        read -s -p "Enter PostgreSQL password: " POSTGRES_PASSWORD
        echo ""
        echo "$POSTGRES_PASSWORD" | docker secret create postgres_password -
        echo -e "${GREEN}[SUCCESS]${NC} Created postgres_password secret"
    fi
    
    if docker secret inspect jwt_secret >/dev/null 2>&1; then
        echo -e "${YELLOW}[WARNING]${NC} Secret 'jwt_secret' already exists"
    else
        read -s -p "Enter JWT secret key: " JWT_SECRET
        echo ""
        echo "$JWT_SECRET" | docker secret create jwt_secret -
        echo -e "${GREEN}[SUCCESS]${NC} Created jwt_secret secret"
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All secrets created successfully!"
}

# Build and push production images
build_images() {
    echo -e "${BLUE}[INFO]${NC} Building production images..."
    
    # Build backend image
    echo -e "${BLUE}[INFO]${NC} Building backend production image..."
    docker build -f docker/Dockerfile.prod --target backend-prod -t healthapp-backend:prod .
    docker tag healthapp-backend:prod $REGISTRY/healthapp-backend:prod
    
    # Build frontend image
    echo -e "${BLUE}[INFO]${NC} Building frontend production image..."
    docker build -f docker/Dockerfile.prod --target frontend-prod -t healthapp-frontend:prod .
    docker tag healthapp-frontend:prod $REGISTRY/healthapp-frontend:prod
    
    # Push to registry
    echo -e "${BLUE}[INFO]${NC} Pushing images to registry..."
    docker push $REGISTRY/healthapp-backend:prod
    docker push $REGISTRY/healthapp-frontend:prod
    
    echo -e "${GREEN}[SUCCESS]${NC} Production images built and pushed successfully!"
}

# Deploy stack
deploy_stack() {
    echo -e "${BLUE}[INFO]${NC} Deploying HealthApp production stack..."
    echo -e "${BLUE}[INFO]${NC} Using ports: Frontend 3002, Backend 3005, PostgreSQL 5432"
    
    # Verify secrets exist
    if ! docker secret inspect postgres_password >/dev/null 2>&1; then
        echo -e "${RED}[ERROR]${NC} Secret 'postgres_password' not found. Run '$0 secrets create' first"
        exit 1
    fi
    
    if ! docker secret inspect jwt_secret >/dev/null 2>&1; then
        echo -e "${RED}[ERROR]${NC} Secret 'jwt_secret' not found. Run '$0 secrets create' first"
        exit 1
    fi
    
    docker stack deploy -c $STACK_FILE $STACK_NAME
    
    echo -e "${GREEN}[SUCCESS]${NC} Production stack deployed successfully!"
    
    # Wait for services to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
    sleep 30
    
    # Run migrations if requested
    if [ "$RUN_MIGRATE" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Running migrations as requested..."
        run_migrations
    fi
    
    # Run seeders if requested
    if [ "$RUN_SEED" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Running seeders as requested..."
        run_seeders
    fi
    
    echo -e "${BLUE}[INFO]${NC} Frontend: https://your-domain.com"
    echo -e "${BLUE}[INFO]${NC} Backend API: https://api.your-domain.com"
    echo ""
    echo -e "${YELLOW}[NEXT]${NC} Run './scripts/deploy-prod.sh logs' to see logs"
    echo -e "${YELLOW}[NEXT]${NC} Run './scripts/deploy-prod.sh status' to check service status"
}

# Update services with zero-downtime deployment
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating production services with zero-downtime..."
    
    # Update backend with rolling update
    docker service update --image $REGISTRY/healthapp-backend:prod ${STACK_NAME}_backend
    
    # Update frontend with rolling update
    docker service update --image $REGISTRY/healthapp-frontend:prod ${STACK_NAME}_frontend
    
    echo -e "${GREEN}[SUCCESS]${NC} Production services updated successfully!"
}

# Stop stack
stop_stack() {
    echo -e "${YELLOW}[WARNING]${NC} This will stop the production environment!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Removing HealthApp production stack..."
        docker stack rm $STACK_NAME
        echo -e "${GREEN}[SUCCESS]${NC} Production stack removed successfully!"
    else
        echo -e "${BLUE}[INFO]${NC} Operation cancelled"
    fi
}

# Show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        echo -e "${BLUE}[INFO]${NC} Showing logs for all production services..."
        for svc in $(docker service ls --filter name=${STACK_NAME} --format "{{.Name}}"); do
            echo -e "${YELLOW}=== $svc ===${NC}"
            docker service logs --tail 100 $svc
            echo ""
        done
    else
        echo -e "${BLUE}[INFO]${NC} Showing logs for ${STACK_NAME}_$service..."
        docker service logs -f ${STACK_NAME}_$service
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}[INFO]${NC} HealthApp Production Stack Status:"
    echo ""
    docker stack services $STACK_NAME
    echo ""
    echo -e "${BLUE}[INFO]${NC} Service Details:"
    docker service ps ${STACK_NAME} --no-trunc
    echo ""
    echo -e "${BLUE}[INFO]${NC} Node Information:"
    docker node ls
}

# Scale service
scale_service() {
    local service=$1
    local replicas=$2
    
    if [ -z "$service" ] || [ -z "$replicas" ]; then
        echo -e "${RED}[ERROR]${NC} Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    echo -e "${YELLOW}[WARNING]${NC} Scaling production service ${STACK_NAME}_$service to $replicas replicas"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Scaling ${STACK_NAME}_$service to $replicas replicas..."
        docker service scale ${STACK_NAME}_$service=$replicas
        echo -e "${GREEN}[SUCCESS]${NC} Service scaled successfully!"
    else
        echo -e "${BLUE}[INFO]${NC} Scaling cancelled"
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running production database migrations..."
    
    # Wait for backend service to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for backend service..."
    sleep 15
    
    # Get a backend container ID
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No backend containers found"
        exit 1
    fi
    
    # Ensure TypeScript migrations are compiled for Sequelize CLI
    echo -e "${BLUE}[INFO]${NC} Compiling TypeScript migrations/seeders for production..."
    docker exec $CONTAINER_ID npm run migrations:build
    
    # Then run migrations
    echo -e "${BLUE}[INFO]${NC} Running database migrations in production..."
    docker exec $CONTAINER_ID npm run migrate
    echo -e "${GREEN}[SUCCESS]${NC} Production migrations completed!"
}

# Run database seeders in production
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders in production..."
    
    # Find the running backend container
    CONTAINER_ID=$(docker ps -q --filter "label=com.docker.stack.namespace=$STACK_NAME" --filter "name=backend")
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No backend containers found"
        exit 1
    fi
    
    # Ensure TypeScript migrations are compiled (seeders need this too)
    echo -e "${BLUE}[INFO]${NC} Ensuring TypeScript migrations/seeders are compiled..."
    docker exec $CONTAINER_ID npm run migrations:build
    
    # Then run seeders
    echo -e "${BLUE}[INFO]${NC} Running database seeders in production..."
    docker exec $CONTAINER_ID npm run seed
    echo -e "${GREEN}[SUCCESS]${NC} Production seeders completed!"
}

# Backup database
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating production database backup..."
    
    BACKUP_FILE="healthapp_prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Get postgres container ID
    POSTGRES_ID=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    
    if [ -z "$POSTGRES_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No postgres containers found"
        exit 1
    fi
    
    docker exec $POSTGRES_ID pg_dump -U healthapp_user healthapp_prod > $BACKUP_FILE
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $BACKUP_FILE"
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
        backup)
            backup_database
            ;;
        secrets)
            if [ "$2" == "create" ]; then
                create_secrets
            else
                echo -e "${RED}[ERROR]${NC} Usage: $0 secrets create"
                exit 1
            fi
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