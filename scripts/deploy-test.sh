#!/bin/bash

# deploy-test.sh - Test Environment Deployment with Docker Swarm
# Usage: ./scripts/deploy-test.sh [COMMAND] [OPTIONS]
# Purpose: Deploy HealthApp to test environment with full parameter control
# Environment: Test server for CI/CD and quality assurance testing

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

# Stack Configuration
DEFAULT_APP_NAME="healthapp"
DEFAULT_STACK_NAME="${DEFAULT_APP_NAME}-test"
DEFAULT_DOMAIN="localhost"
DEFAULT_BRANCH="master"

# Default Port Configuration (Test Environment)
DEFAULT_PORT_APP=3003
DEFAULT_PORT_DB=5433  
DEFAULT_PORT_REDIS=6381
DEFAULT_PORT_PGADMIN=5051

# Default Domain/Host Configuration
DEFAULT_DOMAIN_DB="postgres"
DEFAULT_DOMAIN_REDIS="redis" 
DEFAULT_DOMAIN_PGADMIN="pgadmin"

# Default Scaling Configuration
DEFAULT_SCALE_APP=1
DEFAULT_SCALE_DB=1
DEFAULT_SCALE_REDIS=1
DEFAULT_SCALE_PGADMIN=1

# Runtime Variables (will be set by parse_args)
APP_NAME="$DEFAULT_APP_NAME"
STACK_NAME="$DEFAULT_STACK_NAME"
DOMAIN="$DEFAULT_DOMAIN"
BRANCH="$DEFAULT_BRANCH"

PORT_APP="$DEFAULT_PORT_APP"
PORT_DB="$DEFAULT_PORT_DB"
PORT_REDIS="$DEFAULT_PORT_REDIS"
PORT_PGADMIN="$DEFAULT_PORT_PGADMIN"

DOMAIN_DB="$DEFAULT_DOMAIN_DB"
DOMAIN_REDIS="$DEFAULT_DOMAIN_REDIS"
DOMAIN_PGADMIN="$DEFAULT_DOMAIN_PGADMIN"

SCALE_APP="$DEFAULT_SCALE_APP"
SCALE_DB="$DEFAULT_SCALE_DB" 
SCALE_REDIS="$DEFAULT_SCALE_REDIS"
SCALE_PGADMIN="$DEFAULT_SCALE_PGADMIN"

# Operation Flags
RUN_MIGRATE=false
RUN_SEED=false
RUN_TESTS=false
AUTO_YES=false
SKIP_BUILD=false

# Docker Configuration
STACK_FILE="docker/docker-stack.test.yml"

# ============================================================================
# Help and Usage Information
# ============================================================================

show_help() {
    cat << 'EOF'
🧪 HealthApp Test Environment Deployment with Docker Swarm
=============================================================

Purpose: Deploy HealthApp to test environment for CI/CD and QA testing
Architecture: Next.js 14 + Node.js + PostgreSQL + Redis + Docker Swarm
Default Ports: App(3003), DB(5433), Redis(6381), PgAdmin(5051)

Usage: ./scripts/deploy-test.sh [COMMAND] [OPTIONS]

Commands:
  deploy     Deploy complete test stack to Docker Swarm
  update     Update running services with latest code
  stop       Remove stack from swarm (keeps data volumes)
  restart    Stop and redeploy stack
  logs       Show service logs (specify service name or see all)
  status     Show comprehensive service status and health
  ps         Show running containers and tasks
  migrate    Run database migrations only
  seed       Run database seeders only
  test       Run automated test suite
  backup     Backup test database
  cleanup    Clean up test environment (removes everything)
  scale      Scale specific service up/down

Core Deployment Options:
  --app-name NAME         Application name for stack (default: healthapp)
  --domain DOMAIN         Main domain/IP for the application (default: localhost)
  --branch BRANCH         Git branch to deploy from (default: master)
  
  --migrate              Run database migrations after deployment
  --seed                 Run database seeders after deployment  
  --test                 Run automated tests after deployment
  --skip-build           Skip Docker image building (use existing images)
  --auto-yes             Skip all confirmation prompts

Port Configuration:
  --port-app PORT        Application frontend port (default: 3003)
  --port-db PORT         PostgreSQL database port (default: 5433)
  --port-redis PORT      Redis cache port (default: 6381)
  --port-pgadmin PORT    PgAdmin web UI port (default: 5051)

Service Domain/Host Configuration:
  --domain-db HOST       PostgreSQL service hostname (default: postgres)
  --domain-redis HOST    Redis service hostname (default: redis)
  --domain-pgadmin HOST  PgAdmin service hostname (default: pgadmin)

Scaling Configuration:
  --scale-app N          Number of app service replicas (default: 1)
  --scale-db N           Number of database replicas (default: 1)
  --scale-redis N        Number of Redis replicas (default: 1)
  --scale-pgadmin N      Number of PgAdmin replicas (default: 1)
  --scale N              Scale all services to N replicas

Common Usage Examples:

  # Basic test deployment
  ./scripts/deploy-test.sh deploy --migrate --seed

  # Deploy with custom scaling for load testing
  ./scripts/deploy-test.sh deploy --scale-app 3 --migrate --seed --test

  # Deploy from specific branch with custom ports
  ./scripts/deploy-test.sh deploy --branch feature/new-api --port-app 3010 --port-db 5440

  # Deploy with custom domain and run all operations
  ./scripts/deploy-test.sh deploy --domain test.myapp.com --migrate --seed --test --auto-yes

  # Scale existing deployment
  ./scripts/deploy-test.sh scale --scale-app 5

  # Update services with new code
  ./scripts/deploy-test.sh update --branch hotfix/critical-bug

  # View specific service logs
  ./scripts/deploy-test.sh logs backend

  # Clean shutdown and restart
  ./scripts/deploy-test.sh restart --migrate

  # Complete cleanup
  ./scripts/deploy-test.sh cleanup --auto-yes

Service URLs (with default configuration):
  Frontend:    http://localhost:3003
  Backend API: http://localhost:3003/api
  PgAdmin:     http://localhost:5051
  Database:    postgresql://healthapp_user:test_password@localhost:5433/healthapp_test

Test Environment Features:
- Automated testing pipeline integration
- Database seeding with test data
- Service health monitoring and reporting
- Rolling updates with zero downtime
- Comprehensive logging and debugging
- Load testing capabilities with scaling

EOF
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            # Scaling options
            --scale)
                SCALE_APP="$2"
                SCALE_DB="$2"
                SCALE_REDIS="$2"
                SCALE_PGADMIN="$2"
                shift 2
                ;;
            --scale-app)
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
            
            # Core deployment options
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --app-name)
                APP_NAME="$2"
                STACK_NAME="$APP_NAME-test"
                shift 2
                ;;
            
            # Port configuration
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
            
            # Domain/host configuration
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
            
            # Operation flags
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
            --auto-yes)
                AUTO_YES=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            
            # Help and unknown options
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

# ============================================================================
# Utility Functions
# ============================================================================

# Check Docker Swarm status
check_swarm() {
    echo -e "${BLUE}[INFO]${NC} Checking Docker Swarm status..."
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        echo -e "${YELLOW}[WARNING]${NC} Docker Swarm not active. Initializing..."
        docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
        echo -e "${GREEN}[SUCCESS]${NC} Docker Swarm initialized!"
    else
        echo -e "${GREEN}[SUCCESS]${NC} Docker Swarm is active"
    fi
}

# Git branch checkout
checkout_branch() {
    if [ "$BRANCH" != "$(git branch --show-current)" ]; then
        echo -e "${BLUE}[INFO]${NC} Checking out branch: $BRANCH"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
        echo -e "${GREEN}[SUCCESS]${NC} Branch $BRANCH checked out and updated"
    else
        echo -e "${BLUE}[INFO]${NC} Already on branch: $BRANCH"
        git pull origin "$BRANCH"
    fi
}

# Build Docker images for test environment
build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        echo -e "${YELLOW}[INFO]${NC} Skipping image build (--skip-build specified)"
        return
    fi

    echo -e "${BLUE}[INFO]${NC} Building test Docker images..."
    echo -e "${BLUE}[INFO]${NC} Branch: $BRANCH"
    echo -e "${BLUE}[INFO]${NC} App Name: $APP_NAME"
    
    # Build images with test environment optimizations
    docker build \
        -f docker/Dockerfile.local \
        --target backend-dev \
        -t "$APP_NAME-backend:test" \
        --build-arg NODE_ENV=test \
        .
        
    docker build \
        -f docker/Dockerfile.local \
        --target frontend-dev \
        -t "$APP_NAME-frontend:test" \
        --build-arg NODE_ENV=test \
        .
    
    echo -e "${GREEN}[SUCCESS]${NC} Docker images built successfully!"
}

# Create Docker Compose configuration for stack deployment
create_stack_config() {
    echo -e "${BLUE}[INFO]${NC} Creating Docker Stack configuration..."
    
    # Environment file for stack deployment
    cat > .env.test.deploy << EOF
# ============================================================================
# Test Environment Configuration - Auto-generated
# Generated: $(date)
# Stack: $STACK_NAME
# Domain: $DOMAIN
# Branch: $BRANCH
# ============================================================================

# Application Configuration
NODE_ENV=test
APP_NAME=$APP_NAME
STACK_NAME=$STACK_NAME
DOMAIN=$DOMAIN
BRANCH=$BRANCH

# Port Configuration
PORT_APP=$PORT_APP
PORT_DB=$PORT_DB
PORT_REDIS=$PORT_REDIS
PORT_PGADMIN=$PORT_PGADMIN

# Service URLs
FRONTEND_URL=http://$DOMAIN:$PORT_APP
BACKEND_URL=http://$DOMAIN:$PORT_APP
NEXT_PUBLIC_API_URL=http://$DOMAIN:$PORT_APP/api

# Database Configuration
POSTGRES_HOST=$DOMAIN_DB
POSTGRES_PORT=$PORT_DB
POSTGRES_DB=healthapp_test
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=test_password

# NextAuth Configuration
NEXTAUTH_URL=http://$DOMAIN:$PORT_APP
NEXTAUTH_SECRET=test_nextauth_secret_2024_secure

# Redis Configuration  
REDIS_HOST=$DOMAIN_REDIS
REDIS_PORT=$PORT_REDIS
REDIS_PASSWORD=test_redis_password

# PgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@test.com
PGADMIN_DEFAULT_PASSWORD=test_admin_password

# Scaling Configuration
SCALE_APP=$SCALE_APP
SCALE_DB=$SCALE_DB
SCALE_REDIS=$SCALE_REDIS
SCALE_PGADMIN=$SCALE_PGADMIN

EOF
    
    echo -e "${GREEN}[SUCCESS]${NC} Stack configuration created: .env.test.deploy"
}

# Deploy the complete stack
deploy_stack() {
    echo -e "${CYAN}[DEPLOY]${NC} Deploying HealthApp Test Stack"
    echo -e "${BLUE}[INFO]${NC} ================================================"
    echo -e "${BLUE}[INFO]${NC} App Name: $APP_NAME"
    echo -e "${BLUE}[INFO]${NC} Stack Name: $STACK_NAME"
    echo -e "${BLUE}[INFO]${NC} Domain: $DOMAIN"
    echo -e "${BLUE}[INFO]${NC} Branch: $BRANCH"
    echo -e "${BLUE}[INFO]${NC} Application Port: $PORT_APP"
    echo -e "${BLUE}[INFO]${NC} Database Port: $PORT_DB"
    echo -e "${BLUE}[INFO]${NC} Redis Port: $PORT_REDIS"
    echo -e "${BLUE}[INFO]${NC} PgAdmin Port: $PORT_PGADMIN"
    echo -e "${BLUE}[INFO]${NC} App Replicas: $SCALE_APP"
    echo -e "${BLUE}[INFO]${NC} ================================================"
    
    if [ "$AUTO_YES" = false ]; then
        echo -e "${YELLOW}[CONFIRM]${NC} Deploy test stack with above configuration?"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Deployment cancelled"
            exit 0
        fi
    fi
    
    # Prepare deployment
    checkout_branch
    build_images
    create_stack_config
    
    # Export all environment variables for stack deployment
    set -a
    source .env.test.deploy
    set +a
    
    # Deploy the stack
    echo -e "${BLUE}[INFO]${NC} Deploying to Docker Swarm..."
    docker stack deploy -c "$STACK_FILE" "$STACK_NAME"
    
    echo -e "${GREEN}[SUCCESS]${NC} Test stack deployed successfully!"
    
    # Service URLs
    echo -e "${CYAN}[URLS]${NC} Test Environment URLs:"
    echo -e "${BLUE}[INFO]${NC} Frontend:    http://$DOMAIN:$PORT_APP"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://$DOMAIN:$PORT_APP/api"
    echo -e "${BLUE}[INFO]${NC} PgAdmin:     http://$DOMAIN:$PORT_PGADMIN"
    echo -e "${BLUE}[INFO]${NC} Database:    postgresql://healthapp_user:test_password@$DOMAIN:$PORT_DB/healthapp_test"
    
    # Wait for services to start
    if [ "$RUN_MIGRATE" = true ] || [ "$RUN_SEED" = true ] || [ "$RUN_TESTS" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Waiting for services to initialize..."
        wait_for_services
        
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
    
    show_deployment_summary
}

# ============================================================================
# Service Management Functions  
# ============================================================================

# Wait for services to become ready
wait_for_services() {
    echo -e "${BLUE}[INFO]${NC} Waiting for services to become ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker service ls --filter name="${STACK_NAME}" --format "{{.Replicas}}" | grep -q "0/"; then
            echo -e "${YELLOW}[INFO]${NC} Services starting... (attempt $((attempt + 1))/$max_attempts)"
            sleep 10
            ((attempt++))
        else
            echo -e "${GREEN}[SUCCESS]${NC} All services are ready!"
            return 0
        fi
    done
    
    echo -e "${RED}[ERROR]${NC} Services failed to start within expected time"
    show_status
    exit 1
}

# Update running services
update_services() {
    echo -e "${CYAN}[UPDATE]${NC} Updating test services..."
    echo -e "${BLUE}[INFO]${NC} Branch: $BRANCH"
    
    if [ "$AUTO_YES" = false ]; then
        echo -e "${YELLOW}[CONFIRM]${NC} Update services with latest code from branch '$BRANCH'?"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Update cancelled"
            return
        fi
    fi
    
    checkout_branch
    build_images
    
    echo -e "${BLUE}[INFO]${NC} Updating services..."
    docker service update --force ${STACK_NAME}_frontend
    docker service update --force ${STACK_NAME}_backend
    
    echo -e "${GREEN}[SUCCESS]${NC} Services updated successfully!"
    wait_for_services
    show_service_urls
}

# Stop and remove stack
stop_stack() {
    echo -e "${CYAN}[STOP]${NC} Stopping test stack..."
    
    if [ "$AUTO_YES" = false ]; then
        echo -e "${YELLOW}[CONFIRM]${NC} Stop and remove test stack '$STACK_NAME'?"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Stop cancelled"
            return
        fi
    fi
    
    docker stack rm "$STACK_NAME"
    echo -e "${GREEN}[SUCCESS]${NC} Test stack stopped and removed!"
}

# Restart stack (stop and deploy)
restart_stack() {
    echo -e "${CYAN}[RESTART]${NC} Restarting test stack..."
    stop_stack
    echo -e "${BLUE}[INFO]${NC} Waiting for cleanup..."
    sleep 15
    deploy_stack
}

# Scale specific service
scale_service() {
    local service_name="$1"
    local replicas="$2"
    
    if [ -z "$service_name" ] || [ -z "$replicas" ]; then
        echo -e "${RED}[ERROR]${NC} Usage: scale <service> <replicas>"
        echo -e "${BLUE}[INFO]${NC} Available services: frontend, backend, postgres, redis, pgadmin"
        return 1
    fi
    
    echo -e "${CYAN}[SCALE]${NC} Scaling ${STACK_NAME}_$service_name to $replicas replicas..."
    docker service scale ${STACK_NAME}_$service_name=$replicas
    echo -e "${GREEN}[SUCCESS]${NC} Service scaled successfully!"
}

# Show service logs
show_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        echo -e "${CYAN}[LOGS]${NC} Showing logs for all services in stack '$STACK_NAME'..."
        for svc in $(docker service ls --filter name=${STACK_NAME} --format "{{.Name}}"); do
            echo -e "${YELLOW}================== $svc ==================${NC}"
            docker service logs --tail 50 $svc
            echo ""
        done
    else
        echo -e "${CYAN}[LOGS]${NC} Showing logs for ${STACK_NAME}_$service..."
        docker service logs -f ${STACK_NAME}_$service
    fi
}

# Show comprehensive status
show_status() {
    echo -e "${CYAN}[STATUS]${NC} Test Stack Status Report"
    echo -e "${BLUE}[INFO]${NC} ================================================"
    echo -e "${BLUE}[INFO]${NC} Stack: $STACK_NAME"
    echo -e "${BLUE}[INFO]${NC} Domain: $DOMAIN"
    echo -e "${BLUE}[INFO]${NC} ================================================"
    echo ""
    
    # Service status
    echo -e "${YELLOW}Services:${NC}"
    docker stack services "$STACK_NAME"
    echo ""
    
    # Task status
    echo -e "${YELLOW}Tasks:${NC}"
    docker stack ps "$STACK_NAME" --no-trunc
    echo ""
    
    # Health checks
    echo -e "${YELLOW}Health Checks:${NC}"
    check_service_health
    echo ""
    
    show_service_urls
}

# Show running containers/tasks
show_ps() {
    echo -e "${CYAN}[PS]${NC} Running containers for stack '$STACK_NAME':"
    docker stack ps "$STACK_NAME" --format "table {{.Name}}\t{{.Image}}\t{{.Node}}\t{{.CurrentState}}\t{{.Error}}"
}

# Check service health
check_service_health() {
    local app_url="http://$DOMAIN:$PORT_APP"
    local pgadmin_url="http://$DOMAIN:$PORT_PGADMIN"
    
    # Test application health
    if timeout 10 curl -f -s "$app_url/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application:${NC} Healthy ($app_url)"
    else
        echo -e "${RED}❌ Application:${NC} Unhealthy ($app_url/api/health)"
    fi
    
    # Test frontend
    if timeout 10 curl -f -s "$app_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend:${NC} Healthy ($app_url)"
    else
        echo -e "${RED}❌ Frontend:${NC} Unhealthy ($app_url)"
    fi
    
    # Test PgAdmin
    if timeout 10 curl -f -s "$pgadmin_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PgAdmin:${NC} Healthy ($pgadmin_url)"
    else
        echo -e "${RED}❌ PgAdmin:${NC} Unhealthy ($pgadmin_url)"
    fi
}

# Show service URLs
show_service_urls() {
    echo -e "${CYAN}[URLS]${NC} Test Environment Service URLs:"
    echo -e "${BLUE}[INFO]${NC} Frontend:    http://$DOMAIN:$PORT_APP"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://$DOMAIN:$PORT_APP/api"
    echo -e "${BLUE}[INFO]${NC} PgAdmin:     http://$DOMAIN:$PORT_PGADMIN"
    echo -e "${BLUE}[INFO]${NC} Database:    postgresql://healthapp_user:test_password@$DOMAIN:$PORT_DB/healthapp_test"
}

# Show deployment summary
show_deployment_summary() {
    echo -e "${GREEN}[SUCCESS]${NC} ================================================"
    echo -e "${GREEN}[SUCCESS]${NC} Test deployment completed successfully!"
    echo -e "${GREEN}[SUCCESS]${NC} ================================================"
    echo ""
    
    show_service_urls
    echo ""
    
    echo -e "${BLUE}[INFO]${NC} Next steps:"
    echo -e "${BLUE}[INFO]${NC} - View logs: ./scripts/deploy-test.sh logs [service]"
    echo -e "${BLUE}[INFO]${NC} - Check status: ./scripts/deploy-test.sh status"
    echo -e "${BLUE}[INFO]${NC} - Run tests: ./scripts/deploy-test.sh test"
    echo -e "${BLUE}[INFO]${NC} - Scale services: ./scripts/deploy-test.sh scale --scale-app 3"
}

# ============================================================================
# Database and Operations Functions
# ============================================================================

# Get backend container for database operations
get_backend_container() {
    local container_id=$(docker ps --filter "name=${STACK_NAME}_backend" --format "{{.ID}}" | head -n1)
    if [ -z "$container_id" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        echo -e "${BLUE}[INFO]${NC} Make sure the stack is deployed and services are running"
        exit 1
    fi
    echo "$container_id"
}

# Run database migrations
run_migrations() {
    echo -e "${CYAN}[MIGRATE]${NC} Running database migrations..."
    
    local container_id=$(get_backend_container)
    
    echo -e "${BLUE}[INFO]${NC} Building migration files..."
    docker exec "$container_id" npm run migrations:build
    
    echo -e "${BLUE}[INFO]${NC} Running migrations..."
    docker exec "$container_id" sh -c "DATABASE_URL=\"postgresql://healthapp_user:test_password@$DOMAIN_DB:5432/healthapp_test?schema=public\" npx prisma migrate deploy"
    
    echo -e "${GREEN}[SUCCESS]${NC} Database migrations completed!"
}

# Run database seeders
run_seeders() {
    echo -e "${CYAN}[SEED]${NC} Running database seeders..."
    
    local container_id=$(get_backend_container)
    
    echo -e "${BLUE}[INFO]${NC} Running seeders..."
    docker exec "$container_id" sh -c "DATABASE_URL=\"postgresql://healthapp_user:test_password@$DOMAIN_DB:5432/healthapp_test?schema=public\" npx prisma db seed"
    
    echo -e "${GREEN}[SUCCESS]${NC} Database seeding completed!"
}

# Run automated test suite  
run_tests() {
    echo -e "${CYAN}[TEST]${NC} Running automated test suite..."
    
    local backend_id=$(get_backend_container)
    local app_url="http://$DOMAIN:$PORT_APP"
    
    # Backend unit tests
    echo -e "${BLUE}[INFO]${NC} Running backend unit tests..."
    docker exec "$backend_id" npm test
    
    # API integration tests  
    echo -e "${BLUE}[INFO]${NC} Running API integration tests..."
    sleep 5  # Allow services to fully start
    
    # Health check test
    if timeout 15 curl -f -s "$app_url/api/health" > /dev/null; then
        echo -e "${GREEN}✅ API Health Check:${NC} Passed"
    else
        echo -e "${RED}❌ API Health Check:${NC} Failed"
        echo -e "${RED}[ERROR]${NC} API endpoint not responding: $app_url/api/health"
        exit 1
    fi
    
    # Frontend accessibility test
    if timeout 15 curl -f -s "$app_url" > /dev/null; then
        echo -e "${GREEN}✅ Frontend Access:${NC} Passed"
    else
        echo -e "${RED}❌ Frontend Access:${NC} Failed"  
        echo -e "${RED}[ERROR]${NC} Frontend not responding: $app_url"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All tests passed successfully!"
}

# Backup test database
backup_database() {
    echo -e "${CYAN}[BACKUP]${NC} Creating test database backup..."
    
    local backup_file="healthapp_test_backup_$(date +%Y%m%d_%H%M%S).sql"
    local postgres_id=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    
    if [ -z "$postgres_id" ]; then
        echo -e "${RED}[ERROR]${NC} PostgreSQL container not found"
        exit 1
    fi
    
    echo -e "${BLUE}[INFO]${NC} Creating backup: $backup_file"
    docker exec "$postgres_id" pg_dump -U healthapp_user healthapp_test > "$backup_file"
    
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $backup_file"
    echo -e "${BLUE}[INFO]${NC} Backup size: $(du -h "$backup_file" | cut -f1)"
}

# Complete test environment cleanup
cleanup_test() {
    echo -e "${YELLOW}[WARNING]${NC} This will remove ALL test resources:"
    echo -e "${YELLOW}[WARNING]${NC} - Test stack and all services"  
    echo -e "${YELLOW}[WARNING]${NC} - Test database data and volumes"
    echo -e "${YELLOW}[WARNING]${NC} - Test Docker images"
    echo -e "${YELLOW}[WARNING]${NC} - Test configuration files"
    
    if [ "$AUTO_YES" = false ]; then
        echo -e "${RED}[CONFIRM]${NC} Are you absolutely sure? This cannot be undone!"
        read -p "Type 'yes' to confirm complete cleanup: " -r
        if [[ ! $REPLY = "yes" ]]; then
            echo -e "${BLUE}[INFO]${NC} Cleanup cancelled"
            return
        fi
    fi
    
    echo -e "${CYAN}[CLEANUP]${NC} Starting complete test environment cleanup..."
    
    # Remove stack
    docker stack rm "$STACK_NAME" 2>/dev/null || true
    sleep 15
    
    # Remove volumes
    echo -e "${BLUE}[INFO]${NC} Removing volumes..."
    docker volume ls --filter name="${STACK_NAME}" -q | xargs -r docker volume rm
    
    # Remove images  
    echo -e "${BLUE}[INFO]${NC} Removing test images..."
    docker image rm "$APP_NAME-backend:test" 2>/dev/null || true
    docker image rm "$APP_NAME-frontend:test" 2>/dev/null || true
    
    # Remove configuration files
    echo -e "${BLUE}[INFO]${NC} Removing configuration files..."
    rm -f .env.test.deploy
    
    # System cleanup
    echo -e "${BLUE}[INFO]${NC} Running Docker system cleanup..."
    docker system prune -f --volumes
    
    echo -e "${GREEN}[SUCCESS]${NC} Test environment cleanup completed!"
}

# ============================================================================
# Main Function and Command Router
# ============================================================================

main() {
    # Parse arguments first
    parse_args "$@"
    
    # Check prerequisites
    check_swarm
    
    # Command routing
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
        restart)
            restart_stack
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        ps)
            show_ps
            ;;
        scale)
            if [ "$2" ] && [ "$3" ]; then
                scale_service "$2" "$3"
            else
                # Handle --scale-* parameters for general scaling
                echo -e "${BLUE}[INFO]${NC} Scaling services with current parameters..."
                docker service scale \
                    ${STACK_NAME}_frontend=$SCALE_APP \
                    ${STACK_NAME}_backend=$SCALE_APP \
                    ${STACK_NAME}_postgres=$SCALE_DB \
                    ${STACK_NAME}_redis=$SCALE_REDIS \
                    ${STACK_NAME}_pgadmin=$SCALE_PGADMIN 2>/dev/null || true
                echo -e "${GREEN}[SUCCESS]${NC} Services scaled successfully!"
            fi
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
            echo -e "${BLUE}[INFO]${NC} Use '$0 --help' to see available commands"
            exit 1
            ;;
    esac
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Trap to cleanup on script interruption
trap 'echo -e "\n${YELLOW}[WARNING]${NC} Script interrupted. Cleaning up..."; exit 130' INT TERM

# Execute main function with all arguments
main "$@"