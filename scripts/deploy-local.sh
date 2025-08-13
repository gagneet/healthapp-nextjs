#!/bin/bash

# deploy-local.sh - Local development with Docker Compose
# Usage: ./scripts/deploy-local.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_NAME="healthapp"
COMPOSE_PROJECT="$APP_NAME-local"
DOMAIN="localhost"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'master')"

# Default ports for local development
PORT_APP=3002
PORT_BACKEND=3005
PORT_DB=5434
PORT_REDIS=6379
PORT_PGADMIN=5050

# Flags
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false

# Help function
show_help() {
    echo "🏥 HealthApp Local Development (Docker Compose)"
    echo "=============================================="
    echo ""
    echo "Environment: Local development with hot-reload"
    echo "Architecture: Next.js 14 + Node.js backend + PostgreSQL + Redis"
    echo "Technology: Docker Compose for easy development"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start     Start local development environment"
    echo "  stop      Stop all services"
    echo "  restart   Restart services"
    echo "  logs      Show service logs"
    echo "  status    Show service status"
    echo "  migrate   Run database migrations (idempotent)"
    echo "  seed      Run database seeders (idempotent)"
    echo "  cleanup   Remove containers, networks, and volumes"
    echo ""
    echo "Migration & Seeding:"
    echo "  --migrate           Run database migrations after startup"
    echo "  --seed              Run database seeders after startup"
    echo ""
    echo "Network Configuration:"
    echo "  --domain DOMAIN     Development domain/IP (default: localhost)"
    echo ""
    echo "Port Configuration:"
    echo "  --port-app PORT     Frontend port (default: 3002)"
    echo "  --port-backend PORT Backend API port (default: 3005)"
    echo "  --port-db PORT      Database port (default: 5434)"
    echo "  --port-redis PORT   Redis port (default: 6379)"
    echo "  --port-pgadmin PORT PgAdmin port (default: 5050)"
    echo ""
    echo "Application Configuration:"
    echo "  --app-name NAME     Compose project name (default: healthapp)"
    echo "  --branch BRANCH     Git branch to use (default: current branch)"
    echo ""
    echo "Convenience Options:"
    echo "  --auto-yes          Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  # Start development environment"
    echo "  $0 start --migrate --seed"
    echo ""
    echo "  # Custom ports for development"
    echo "  $0 start --port-app 3000 --port-backend 3001 --port-db 5433"
    echo ""
    echo "  # Use specific branch"
    echo "  $0 start --branch feature/new-ui --migrate"
    echo ""
    echo "  # Custom domain (for network access)"
    echo "  $0 start --domain 192.168.1.100 --migrate --seed"
    echo ""
    echo "  # View logs for specific service"
    echo "  $0 logs frontend"
    echo ""
    echo "  # Complete cleanup"
    echo "  $0 cleanup --auto-yes"
    echo ""
    echo "Development URLs:"
    echo "  Frontend:  http://localhost:$PORT_APP"
    echo "  Backend:   http://localhost:$PORT_BACKEND/api"
    echo "  PgAdmin:   http://localhost:$PORT_PGADMIN"
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
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --port-app)
                PORT_APP="$2"
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
            --app-name)
                APP_NAME="$2"
                COMPOSE_PROJECT="$APP_NAME-local"
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

# Check Docker and Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker Compose is not installed"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Docker environment ready"
}

# Checkout specific branch
checkout_branch() {
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')
    
    if [ "$BRANCH" != "$current_branch" ]; then
        echo -e "${BLUE}[INFO]${NC} Checking out branch: $BRANCH"
        
        # Fetch latest changes
        git fetch --all
        
        # Checkout branch
        if git show-ref --verify --quiet refs/heads/$BRANCH; then
            git checkout $BRANCH
            git pull origin $BRANCH
        elif git show-ref --verify --quiet refs/remotes/origin/$BRANCH; then
            git checkout -b $BRANCH origin/$BRANCH
        else
            echo -e "${RED}[ERROR]${NC} Branch '$BRANCH' not found"
            exit 1
        fi
        
        echo -e "${GREEN}[SUCCESS]${NC} Checked out branch: $BRANCH ($(git rev-parse --short HEAD))"
    else
        echo -e "${BLUE}[INFO]${NC} Already on branch: $BRANCH ($(git rev-parse --short HEAD))"
    fi
}

# Create Docker Compose configuration
create_compose_config() {
    echo -e "${BLUE}[INFO]${NC} Creating Docker Compose configuration..."
    
    cat > /tmp/docker-compose-${APP_NAME}-local.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ${COMPOSE_PROJECT}-postgres
    environment:
      POSTGRES_DB: ${APP_NAME}_dev
      POSTGRES_USER: ${APP_NAME}_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    ports:
      - "${PORT_DB}:5432"
    volumes:
      - postgres_local_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${APP_NAME}_user -d ${APP_NAME}_dev"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ${APP_NAME}-local-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ${COMPOSE_PROJECT}-redis
    command: redis-server --appendonly yes --requirepass dev_redis_password
    ports:
      - "${PORT_REDIS}:6379"
    volumes:
      - redis_local_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "dev_redis_password", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ${APP_NAME}-local-network

  # Backend API (Node.js/Express)
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.local
      target: backend-dev
    container_name: ${COMPOSE_PROJECT}-backend
    environment:
      NODE_ENV: development
      PORT: 3005
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${APP_NAME}_dev
      POSTGRES_USER: ${APP_NAME}_user
      POSTGRES_PASSWORD: dev_password
      DATABASE_URL: postgresql://${APP_NAME}_user:dev_password@postgres:5432/${APP_NAME}_dev?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: dev_redis_password
      JWT_SECRET: local-dev-secret-key-12345
      NEXTAUTH_SECRET: local-dev-nextauth-secret-key
      CORS_ORIGIN: "http://${DOMAIN}:${PORT_APP}"
      FRONTEND_URL: "http://${DOMAIN}:${PORT_APP}"
    ports:
      - "${PORT_BACKEND}:3005"
    volumes:
      - ./src:/app/src:delegated
      - ./package.json:/app/package.json:ro
      - ./tsconfig.backend.json:/app/tsconfig.backend.json:ro
      - ./prisma:/app/prisma:delegated
      - backend_local_logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    command: npm run backend:dev
    networks:
      - ${APP_NAME}-local-network

  # Frontend (Next.js)
  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.local
      target: frontend-dev
    container_name: ${COMPOSE_PROJECT}-frontend
    environment:
      NODE_ENV: development
      PORT: 3002
      BACKEND_URL: http://backend:3005
      NEXT_PUBLIC_API_URL: "http://${DOMAIN}:${PORT_BACKEND}/api"
      NEXT_PUBLIC_FRONTEND_URL: "http://${DOMAIN}:${PORT_APP}"
      DATABASE_URL: postgresql://${APP_NAME}_user:dev_password@postgres:5432/${APP_NAME}_dev?schema=public
      NEXTAUTH_URL: "http://${DOMAIN}:${PORT_APP}"
      NEXTAUTH_SECRET: local-dev-nextauth-secret-key
      # Hot reload configuration
      WATCHPACK_POLLING: "true"
      WDS_SOCKET_HOST: "${DOMAIN}"
      WDS_SOCKET_PORT: "${PORT_APP}"
    ports:
      - "${PORT_APP}:3002"
    volumes:
      - ./app:/app/app:delegated
      - ./components:/app/components:delegated
      - ./lib:/app/lib:delegated
      - ./hooks:/app/hooks:delegated
      - ./public:/app/public:delegated
      - ./types:/app/types:delegated
      - ./package.json:/app/package.json:ro
      - ./next.config.js:/app/next.config.js:ro
      - ./tailwind.config.js:/app/tailwind.config.js:ro
      - ./tsconfig.json:/app/tsconfig.json:ro
      - ./.postcssrc.json:/app/.postcssrc.json:ro
      - ./prisma:/app/prisma:delegated
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    command: npm run dev
    networks:
      - ${APP_NAME}-local-network

  # PgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ${COMPOSE_PROJECT}-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@${DOMAIN}
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "${PORT_PGADMIN}:80"
    volumes:
      - pgadmin_local_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ${APP_NAME}-local-network

volumes:
  postgres_local_data:
    driver: local
  redis_local_data:
    driver: local
  backend_local_logs:
    driver: local
  pgadmin_local_data:
    driver: local

networks:
  ${APP_NAME}-local-network:
    name: ${APP_NAME}-local-network
    driver: bridge
EOF

    echo -e "${GREEN}[SUCCESS]${NC} Docker Compose configuration created"
}

# Start local development environment
start_local() {
    echo -e "${BLUE}[INFO]${NC} Starting local development environment..."
    echo -e "${BLUE}[INFO]${NC} Configuration:"
    echo -e "${BLUE}[INFO]${NC}   App Name: $APP_NAME"
    echo -e "${BLUE}[INFO]${NC}   Project: $COMPOSE_PROJECT"
    echo -e "${BLUE}[INFO]${NC}   Branch: $BRANCH"
    echo -e "${BLUE}[INFO]${NC}   Domain: $DOMAIN"
    echo -e "${BLUE}[INFO]${NC}   Ports: Frontend($PORT_APP), Backend($PORT_BACKEND), DB($PORT_DB), Redis($PORT_REDIS), PgAdmin($PORT_PGADMIN)"
    
    # Checkout branch if needed
    checkout_branch
    
    # Create compose configuration
    create_compose_config
    
    # Start services
    echo -e "${BLUE}[INFO]${NC} Starting Docker Compose services..."
    docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT up -d --build
    
    echo -e "${GREEN}[SUCCESS]${NC} Local development environment started!"
    echo -e "${BLUE}[INFO]${NC} Frontend:  http://$DOMAIN:$PORT_APP"
    echo -e "${BLUE}[INFO]${NC} Backend:   http://$DOMAIN:$PORT_BACKEND/api"
    echo -e "${BLUE}[INFO]${NC} PgAdmin:   http://$DOMAIN:$PORT_PGADMIN (admin@$DOMAIN / admin123)"
    
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
    
    echo ""
    echo -e "${GREEN}[SUCCESS]${NC} Development environment ready!"
    echo -e "${BLUE}[INFO]${NC} Use '$0 logs' to view logs"
    echo -e "${BLUE}[INFO]${NC} Use '$0 stop' to stop services"
}

# Stop services
stop_services() {
    echo -e "${BLUE}[INFO]${NC} Stopping local development environment..."
    docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT down
    rm -f /tmp/docker-compose-${APP_NAME}-local.yml
    echo -e "${GREEN}[SUCCESS]${NC} Services stopped!"
}

# Restart services
restart_services() {
    echo -e "${BLUE}[INFO]${NC} Restarting local development environment..."
    
    # Create compose config if it doesn't exist
    if [ ! -f "/tmp/docker-compose-${APP_NAME}-local.yml" ]; then
        create_compose_config
    fi
    
    docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT restart
    echo -e "${GREEN}[SUCCESS]${NC} Services restarted!"
}

# Show logs
show_logs() {
    local service=${1:-""}
    
    # Create compose config if it doesn't exist
    if [ ! -f "/tmp/docker-compose-${APP_NAME}-local.yml" ]; then
        create_compose_config
    fi
    
    if [ -z "$service" ]; then
        echo -e "${BLUE}[INFO]${NC} Showing logs for all services..."
        docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT logs -f --tail=50
    else
        echo -e "${BLUE}[INFO]${NC} Showing logs for $service..."
        docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT logs -f --tail=50 $service
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}[INFO]${NC} Local Development Environment Status:"
    echo ""
    
    # Create compose config if it doesn't exist
    if [ ! -f "/tmp/docker-compose-${APP_NAME}-local.yml" ]; then
        create_compose_config
    fi
    
    docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT ps
    
    echo ""
    echo -e "${BLUE}[INFO]${NC} Health Checks:"
    
    # Check frontend
    if curl -f -s http://$DOMAIN:$PORT_APP > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend:${NC} Healthy (http://$DOMAIN:$PORT_APP)"
    else
        echo -e "${RED}❌ Frontend:${NC} Unhealthy"
    fi
    
    # Check backend
    if curl -f -s http://$DOMAIN:$PORT_BACKEND/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend:${NC} Healthy (http://$DOMAIN:$PORT_BACKEND/api)"
    else
        echo -e "${RED}❌ Backend:${NC} Unhealthy"
    fi
    
    # Check database
    POSTGRES_ID=$(docker ps --filter "name=${COMPOSE_PROJECT}-postgres" --format "{{.ID}}" | head -n1)
    if [ -n "$POSTGRES_ID" ] && docker exec $POSTGRES_ID pg_isready -U ${APP_NAME}_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL:${NC} Ready"
    else
        echo -e "${RED}❌ PostgreSQL:${NC} Not Ready"
    fi
}

# Run idempotent migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running idempotent database migrations..."
    
    CONTAINER_ID=$(docker ps --filter "name=${COMPOSE_PROJECT}-backend" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        exit 1
    fi
    
    # Run Prisma migrations (idempotent by design)
    echo -e "${BLUE}[INFO]${NC} Running Prisma migrations (idempotent)..."
    docker exec $CONTAINER_ID npx prisma migrate deploy
    
    echo -e "${GREEN}[SUCCESS]${NC} Migrations completed!"
}

# Run idempotent seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running idempotent database seeders..."
    
    CONTAINER_ID=$(docker ps --filter "name=${COMPOSE_PROJECT}-backend" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} Backend container not found"
        exit 1
    fi
    
    # Run Prisma seed (implement idempotent logic in seed file)
    echo -e "${BLUE}[INFO]${NC} Running Prisma seed (idempotent)..."
    docker exec $CONTAINER_ID npx prisma db seed
    
    echo -e "${GREEN}[SUCCESS]${NC} Seeders completed!"
}

# Cleanup everything
cleanup_all() {
    echo -e "${YELLOW}[WARNING]${NC} This will remove all containers, networks, and volumes!"
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Cleanup cancelled"
            return
        fi
    fi
    
    echo -e "${BLUE}[INFO]${NC} Cleaning up local development environment..."
    
    # Create compose config if it doesn't exist
    if [ ! -f "/tmp/docker-compose-${APP_NAME}-local.yml" ]; then
        create_compose_config
    fi
    
    docker-compose -f /tmp/docker-compose-${APP_NAME}-local.yml -p $COMPOSE_PROJECT down -v --remove-orphans
    rm -f /tmp/docker-compose-${APP_NAME}-local.yml
    
    # Clean up any orphaned resources
    docker system prune -f
    
    echo -e "${GREEN}[SUCCESS]${NC} Cleanup completed!"
}

# Main function
main() {
    parse_args "$@"
    check_docker
    
    case ${1:-""} in
        start)
            start_local
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs $2
            ;;
        status)
            show_status
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            run_seeders
            ;;
        cleanup)
            cleanup_all
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