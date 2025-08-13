#!/bin/bash

# deploy-test.sh - Test environment deployment
# Usage: ./scripts/deploy-test.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-test"
STACK_FILE="docker/docker-stack.test.yml"

# Default values
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false
RUN_TESTS=false
HOST_IP="localhost"

# Help function
show_help() {
    echo "🧪 HealthApp Test Environment Deployment"
    echo "========================================"
    echo ""
    echo "Environment: Test server for CI/CD and quality assurance"
    echo "Architecture: Next.js 14 + Node.js backend + PostgreSQL + Redis"
    echo "Deployment: Docker Swarm with test-specific configuration"
    echo "Ports: Frontend(3003), Backend(3006), PostgreSQL(5433), Redis(6380), PgAdmin(5051)"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy test stack to swarm"
    echo "  update    Update running services"
    echo "  stop      Remove stack from swarm"
    echo "  logs      Show service logs"
    echo "  status    Show service status and health"
    echo "  test      Run automated test suite"
    echo "  migrate   Run database migrations"
    echo "  seed      Run test database seeders"
    echo "  backup    Backup test database"
    echo "  cleanup   Clean up test data and containers"
    echo ""
    echo "Options:"
    echo "  --migrate           Run migrations after deployment"
    echo "  --seed              Run database seeders after deployment"
    echo "  --test              Run automated tests after deployment"
    echo "  --host-ip IP        Set host IP address (default: localhost)"
    echo "  --auto-yes          Skip confirmation prompts"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --migrate --seed --test"
    echo "  $0 deploy --host-ip 192.168.1.100"
    echo "  $0 test"
    echo "  $0 logs backend"
    echo "  $0 cleanup --auto-yes"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --migrate)
                RUN_MIGRATE=true
                shift
                ;;
            --seed)
                RUN_SEED=true
                shift
                ;;
            --test)
                RUN_TESTS=true
                shift
                ;;
            --host-ip)
                HOST_IP="$2"
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

# Build test images
build_images() {
    echo -e "${BLUE}[INFO]${NC} Building test images..."
    
    docker build -f docker/Dockerfile.local --target backend-dev -t healthapp-backend:test .
    docker build -f docker/Dockerfile.local --target frontend-dev -t healthapp-frontend:test .
    
    echo -e "${GREEN}[SUCCESS]${NC} Test images built!"
}

# Deploy stack
deploy_stack() {
    echo -e "${BLUE}[INFO]${NC} Deploying HealthApp test stack..."
    echo -e "${BLUE}[INFO]${NC} Host IP: $HOST_IP"
    
    export HOST_IP
    export FRONTEND_URL="http://$HOST_IP:3003"
    export BACKEND_URL="http://$HOST_IP:3006"
    export POSTGRES_HOST="$HOST_IP"
    export REDIS_HOST="$HOST_IP"
    
    # Set test environment variables
    export POSTGRES_DB=healthapp_test
    export POSTGRES_USER=healthapp_user
    export POSTGRES_PASSWORD=test_password
    export JWT_SECRET=test_jwt_secret_key_2024
    export REDIS_PASSWORD=test_redis_password
    export NODE_ENV=test
    
    build_images
    docker stack deploy -c $STACK_FILE $STACK_NAME
    
    echo -e "${GREEN}[SUCCESS]${NC} Test stack deployed!"
    echo -e "${BLUE}[INFO]${NC} Frontend: http://$HOST_IP:3003"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://$HOST_IP:3006"
    echo -e "${BLUE}[INFO]${NC} PgAdmin: http://$HOST_IP:5051"
    
    if [ "$RUN_MIGRATE" = true ] || [ "$RUN_SEED" = true ] || [ "$RUN_TESTS" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
        sleep 30
        
        if [ "$RUN_MIGRATE" = true ]; then
            run_migrations
        fi
        
        if [ "$RUN_SEED" = true ]; then
            run_seeders
        fi
        
        if [ "$RUN_TESTS" = true ]; then
            run_tests
        fi
    fi
}

# Update services
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating test services..."
    build_images
    docker service update --force ${STACK_NAME}_backend
    docker service update --force ${STACK_NAME}_frontend
    echo -e "${GREEN}[SUCCESS]${NC} Services updated!"
}

# Stop stack
stop_stack() {
    echo -e "${BLUE}[INFO]${NC} Removing test stack..."
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
    echo -e "${BLUE}[INFO]${NC} Test Stack Status:"
    echo ""
    docker stack services $STACK_NAME
    echo ""
    echo -e "${BLUE}[INFO]${NC} Service Tasks:"
    docker stack ps $STACK_NAME --no-trunc
    
    # Health checks
    echo -e "${BLUE}[INFO]${NC} Health Check Results:"
    if curl -f -s http://$HOST_IP:3006/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend API:${NC} Healthy"
    else
        echo -e "${RED}❌ Backend API:${NC} Unhealthy"
    fi
    
    if curl -f -s http://$HOST_IP:3003 > /dev/null; then
        echo -e "${GREEN}✅ Frontend:${NC} Healthy"
    else
        echo -e "${RED}❌ Frontend:${NC} Unhealthy"
    fi
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

# Run automated tests
run_tests() {
    echo -e "${BLUE}[INFO]${NC} Running automated test suite..."
    
    # Backend tests
    BACKEND_ID=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    if [ -z "$BACKEND_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        exit 1
    fi
    
    echo -e "${BLUE}[INFO]${NC} Running backend tests..."
    docker exec $BACKEND_ID npm test
    
    # Frontend tests
    FRONTEND_ID=$(docker ps --filter "name=${STACK_NAME}_frontend" --format "{{.ID}}" | head -n1)
    if [ -z "$FRONTEND_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Frontend container not found"
        exit 1
    fi
    
    echo -e "${BLUE}[INFO]${NC} Running frontend tests..."
    docker exec $FRONTEND_ID npm test -- --passWithNoTests
    
    # API integration tests
    echo -e "${BLUE}[INFO]${NC} Running API integration tests..."
    sleep 5  # Wait for services to be ready
    
    # Test health endpoint
    if curl -f -s http://$HOST_IP:3006/api/health > /dev/null; then
        echo -e "${GREEN}✅ API Health Check:${NC} Passed"
    else
        echo -e "${RED}❌ API Health Check:${NC} Failed"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All tests completed successfully!"
}

# Backup database
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating test database backup..."
    
    BACKUP_FILE="healthapp_test_backup_$(date +%Y%m%d_%H%M%S).sql"
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} PostgreSQL container not found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID pg_dump -U healthapp_user healthapp_test > $BACKUP_FILE
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $BACKUP_FILE"
}

# Cleanup test environment
cleanup_test() {
    echo -e "${YELLOW}[WARNING]${NC} This will remove all test containers, networks, and volumes!"
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Cleanup cancelled"
            return
        fi
    fi
    
    echo -e "${BLUE}[INFO]${NC} Cleaning up test environment..."
    docker stack rm $STACK_NAME
    sleep 10  # Wait for stack removal
    docker volume prune -f
    docker network prune -f
    docker system prune -f
    echo -e "${GREEN}[SUCCESS]${NC} Test environment cleanup completed!"
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
        test)
            run_tests
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
        cleanup)
            cleanup_test
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