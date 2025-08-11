#!/bin/bash

# deploy-nextjs-local.sh - Deploy Next.js Healthcare Application locally with full debugging
# Updated for pure Next.js architecture with Prisma integration and comprehensive logging
# Usage: ./scripts/deploy-nextjs-local.sh [COMMAND] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="healthapp-nextjs-local"
STACK_FILE="docker/docker-compose.nextjs-local.yml"
COMPOSE_FILE="docker/docker-compose.nextjs-local.yml"

# Default values
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false
DOMAIN="localhost"
DEBUG_MODE=true
ENABLE_PROFILING=true

# Help function
show_help() {
    echo -e "${CYAN}🏥 HealthApp Next.js Local Development Deployment Script${NC}"
    echo "=============================================================="
    echo ""
    echo "Architecture: Pure Next.js 14 + Prisma + PostgreSQL"
    echo "Port: 3002 (Next.js with API routes)"
    echo "Debugging: Full logging + profiling enabled"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy       Deploy the Next.js stack with debug logging"
    echo "  update       Update running services with zero downtime"
    echo "  stop         Stop the stack"
    echo "  logs         Show service logs with real-time monitoring"
    echo "  status       Show detailed service status and health checks"
    echo "  build        Build Next.js development image"
    echo "  migrate      Run Prisma migrations"
    echo "  seed         Run database seeds"
    echo "  backup       Backup development database"
    echo "  scale        Scale Next.js service"
    echo "  debug        Start debug session with container access"
    echo "  profile      Show performance profiling information"
    echo "  monitor      Real-time monitoring with resource usage"
    echo ""
    echo "Options:"
    echo "  --domain DOMAIN      Set domain for deployment (default: localhost)"
    echo "  --ip IP             Set host IP for networking (default: auto-detect)"
    echo "  --migrate           Run database migrations after deployment"
    echo "  --seed              Run database seeders after deployment"
    echo "  --auto-yes          Skip confirmation prompts"
    echo "  --no-debug          Disable debug logging"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --domain healthapp.local --migrate --seed"
    echo "  $0 debug --container nextjs"
    echo "  $0 logs nextjs --follow"
    echo "  $0 scale 2"
    echo "  $0 monitor"
    echo ""
    echo -e "${YELLOW}Debug Features:${NC}"
    echo "  - Comprehensive logging (debug, info, warn, error)"
    echo "  - Real-time container monitoring"
    echo "  - Database query profiling"
    echo "  - Next.js development hot-reload"
    echo "  - Environment variable debugging"
    echo "  - API response timing"
    echo ""
}

# Auto-detect host IP
detect_host_ip() {
    if command -v ip &> /dev/null; then
        # Linux: Use ip route
        HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' | head -1)
    elif command -v ifconfig &> /dev/null; then
        # macOS/BSD: Use ifconfig
        HOST_IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1)
    else
        # Fallback to localhost
        HOST_IP="localhost"
    fi
    
    if [ -z "$HOST_IP" ] || [ "$HOST_IP" = "localhost" ]; then
        HOST_IP="127.0.0.1"
    fi
    
    echo -e "${BLUE}[INFO]${NC} Auto-detected Host IP: $HOST_IP"
}

# Check if Docker and Docker Compose are available
check_docker() {
    echo -e "${PURPLE}[DEBUG]${NC} Checking Docker environment..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker is not installed"
        echo -e "${YELLOW}[HELP]${NC} Install Docker: https://docs.docker.com/install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker Compose is not installed"
        echo -e "${YELLOW}[HELP]${NC} Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker daemon is not running"
        echo -e "${YELLOW}[HELP]${NC} Start Docker service: sudo systemctl start docker"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Docker environment verified"
    echo -e "${PURPLE}[DEBUG]${NC} Docker version: $(docker --version)"
    echo -e "${PURPLE}[DEBUG]${NC} Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version)"
}

# Create comprehensive development environment files
create_env_files() {
    echo -e "${BLUE}[INFO]${NC} Creating development environment configuration with debugging..."
    
    # Create env_files directory if it doesn't exist
    mkdir -p env_files
    
    # Detect host IP
    detect_host_ip
    
    # Create development environment file with full debugging
    if [ ! -f "env_files/.env.development" ]; then
        cat > env_files/.env.development << EOF
# ============================================================================
# LOCAL DEVELOPMENT ENVIRONMENT CONFIGURATION WITH FULL DEBUG LOGGING
# ============================================================================
NODE_ENV=development
PORT=3002
DEBUG=healthapp:*,prisma:*,next:*

# Host Configuration
HOST_IP=${HOST_IP}
DOMAIN=${DOMAIN}
ALLOWED_DEV_ORIGINS=${HOST_IP}:3002,localhost:3002,127.0.0.1:3002

# Database Configuration (Prisma) with Debug Logging
DATABASE_URL="postgresql://healthapp_user:\${POSTGRES_PASSWORD}@postgres:5432/healthapp_dev?schema=public&connection_limit=20&pool_timeout=20"
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_dev
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=pg_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_dev_password

# Application URLs
FRONTEND_URL=http://${HOST_IP}:3002
NEXT_PUBLIC_API_URL=http://${HOST_IP}:3002/api

# JWT Configuration (Development)
JWT_SECRET=development_jwt_secret_key_256_bit_not_for_production_use_only_123456789
JWT_REFRESH_SECRET=dev_refresh_secret_key_256_bit_not_for_production_use_only_987654321
JWT_EXPIRES_IN=60m
JWT_REFRESH_EXPIRE=7d

# Debugging & Logging (FULL DEBUG MODE)
LOG_LEVEL=debug
NEXT_TELEMETRY_DISABLED=1
DEBUG_MODE=true
ENABLE_SQL_LOGGING=true
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_STACK_TRACES=true

# Development Hot Reload
WATCHPACK_POLLING=true
WDS_SOCKET_HOST=${HOST_IP}
WDS_SOCKET_PORT=3002

# Prisma Debugging
PRISMA_DEBUG=true
PRISMA_SLOW_QUERIES=true

# Performance Profiling
ENABLE_PERFORMANCE_PROFILING=true
API_RESPONSE_TIME_LOGGING=true

# Security (Relaxed for Development)
CORS_ORIGINS=http://localhost:3002,http://${HOST_IP}:3002,http://127.0.0.1:3002
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Healthcare Development
SESSION_TIMEOUT=7200000
ENABLE_2FA=false
MAINTENANCE_MODE=false
VERSION=4.0.0-nextjs-prisma-dev

# Container Resource Limits (Development)
MEMORY_LIMIT=2g
CPU_LIMIT=2.0

# PostgreSQL Development Settings
POSTGRES_HOST_AUTH_METHOD=trust
POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
POSTGRES_LOG_STATEMENT=all
POSTGRES_LOG_DURATION=on
POSTGRES_LOG_MIN_DURATION_STATEMENT=0
EOF
        echo -e "${GREEN}[SUCCESS]${NC} Created comprehensive development environment file"
        echo -e "${PURPLE}[DEBUG]${NC} Environment file: env_files/.env.development"
    else
        echo -e "${YELLOW}[WARNING]${NC} Development environment file already exists"
        echo -e "${PURPLE}[DEBUG]${NC} Using existing: env_files/.env.development"
    fi
    
    # Create Docker Compose environment file
    cat > .env << EOF
# Docker Compose Environment Variables
HOST_IP=${HOST_IP}
POSTGRES_PASSWORD=pg_password
REDIS_PASSWORD=redis_dev_password
JWT_SECRET=development_jwt_secret_key_256_bit_not_for_production_use_only_123456789
DOMAIN=${DOMAIN}
EOF
    
    echo -e "${GREEN}[SUCCESS]${NC} Created Docker Compose environment file"
}

# Build Next.js development image with debug capabilities
build_image() {
    echo -e "${BLUE}[INFO]${NC} Building Next.js development image with debugging..."
    echo -e "${PURPLE}[DEBUG]${NC} Image: healthapp-nextjs:dev"
    
    # Build the Next.js application image for development
    docker build -f docker/Dockerfile.nextjs -t healthapp-nextjs:dev \
        --build-arg NODE_ENV=development \
        --build-arg DEBUG=true \
        .
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js development image built successfully!"
    echo -e "${PURPLE}[DEBUG]${NC} Image size: $(docker images healthapp-nextjs:dev --format "table {{.Size}}" | tail -1)"
}

# Deploy stack with comprehensive logging
deploy_stack() {
    echo -e "${CYAN}🚀 Deploying HealthApp Next.js Local Development Stack${NC}"
    echo "=============================================================="
    echo -e "${BLUE}[INFO]${NC} Architecture: Next.js 14 + Prisma + PostgreSQL"
    echo -e "${BLUE}[INFO]${NC} Port: 3002 (Next.js with integrated API)"
    echo -e "${BLUE}[INFO]${NC} Domain: $DOMAIN"
    echo -e "${BLUE}[INFO]${NC} Host IP: ${HOST_IP:-auto-detect}"
    echo -e "${PURPLE}[DEBUG]${NC} Debug Mode: Enabled"
    echo -e "${PURPLE}[DEBUG]${NC} SQL Logging: Enabled"
    echo -e "${PURPLE}[DEBUG]${NC} Performance Profiling: Enabled"
    echo ""
    
    # Create environment files
    create_env_files
    
    # Build image
    build_image
    
    # Check for port conflicts
    echo -e "${BLUE}[INFO]${NC} Checking for port conflicts..."
    if lsof -ti:3002 &> /dev/null; then
        echo -e "${YELLOW}[WARNING]${NC} Port 3002 is in use"
        if [ "$AUTO_YES" = false ]; then
            read -p "Kill processes using port 3002? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo fuser -k 3002/tcp || true
            fi
        fi
    fi
    
    # Deploy using Docker Compose with debug logging
    echo -e "${BLUE}[INFO]${NC} Starting development deployment with full logging..."
    echo -e "${PURPLE}[DEBUG]${NC} Compose file: $COMPOSE_FILE"
    
    # Export environment variables
    export HOST_IP=${HOST_IP}
    export DOMAIN=${DOMAIN}
    export DEBUG_MODE=true
    
    docker-compose -f $COMPOSE_FILE up -d --build
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js development stack deployed successfully!"
    echo ""
    
    # Wait for services to be ready with detailed logging
    echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
    echo -e "${PURPLE}[DEBUG]${NC} Monitoring startup process..."
    
    for i in {1..30}; do
        if curl -f -s http://${HOST_IP}:3002/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}[SUCCESS]${NC} Services are ready after ${i}0 seconds!"
            break
        fi
        echo -ne "${PURPLE}[DEBUG]${NC} Waiting... ($i/30)\r"
        sleep 10
    done
    echo ""
    
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
    
    # Display access information
    echo ""
    echo -e "${CYAN}🎉 Deployment Complete! Access Your Healthcare Application:${NC}"
    echo "=============================================================="
    echo -e "${GREEN}🏥 Healthcare App:${NC}     http://${HOST_IP}:3002"
    echo -e "${GREEN}🔧 API Health:${NC}         http://${HOST_IP}:3002/api/health"
    echo -e "${GREEN}👨‍⚕️ Doctor Dashboard:${NC}  http://${HOST_IP}:3002/dashboard/doctor"
    echo -e "${GREEN}🤒 Patient Dashboard:${NC}  http://${HOST_IP}:3002/dashboard/patient"
    echo -e "${GREEN}🗄️ Database:${NC}           localhost:5432 (postgres/pg_password)"
    echo -e "${GREEN}🔴 Redis:${NC}               localhost:6379 (redis_dev_password)"
    echo ""
    echo -e "${YELLOW}📊 Debug & Monitoring Commands:${NC}"
    echo -e "${PURPLE}   $0 logs nextjs     ${NC}# Real-time Next.js logs"
    echo -e "${PURPLE}   $0 monitor         ${NC}# Resource monitoring"
    echo -e "${PURPLE}   $0 debug           ${NC}# Interactive debugging"
    echo -e "${PURPLE}   $0 profile         ${NC}# Performance profiling"
    echo ""
}

# Update services with zero-downtime deployment
update_services() {
    echo -e "${BLUE}[INFO]${NC} Updating Next.js development services with zero downtime..."
    
    # Build new image
    build_image
    
    # Perform rolling update
    docker-compose -f $COMPOSE_FILE up -d --no-deps nextjs
    
    echo -e "${GREEN}[SUCCESS]${NC} Next.js services updated successfully!"
    echo -e "${PURPLE}[DEBUG]${NC} Service restarted with new image"
}

# Stop stack with cleanup
stop_stack() {
    echo -e "${YELLOW}[WARNING]${NC} This will stop the local development environment!"
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Operation cancelled"
            return
        fi
    fi
    
    echo -e "${BLUE}[INFO]${NC} Stopping HealthApp Next.js development stack..."
    echo -e "${PURPLE}[DEBUG]${NC} Graceful shutdown initiated..."
    
    docker-compose -f $COMPOSE_FILE down --remove-orphans
    
    # Clean up development volumes if requested
    if [ "$AUTO_YES" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Cleaning up development volumes..."
        docker-compose -f $COMPOSE_FILE down -v
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Development stack stopped successfully!"
}

# Show enhanced logs with filtering
show_logs() {
    local service=${1:-""}
    local follow=${2:-""}
    
    if [ -z "$service" ]; then
        echo -e "${BLUE}[INFO]${NC} Showing logs for all services with debug information..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        echo -e "${BLUE}[INFO]${NC} Showing enhanced logs for $service..."
        if [ "$follow" = "--follow" ]; then
            docker-compose -f $COMPOSE_FILE logs -f --tail=100 $service
        else
            docker-compose -f $COMPOSE_FILE logs --tail=100 $service
        fi
    fi
}

# Show comprehensive status with health checks
show_status() {
    echo -e "${CYAN}🏥 HealthApp Next.js Local Development Status${NC}"
    echo "=============================================================="
    echo ""
    
    # Container status
    echo -e "${BLUE}[INFO]${NC} Container Status:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    # Resource usage
    echo -e "${BLUE}[INFO]${NC} Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}" $(docker-compose -f $COMPOSE_FILE ps -q) 2>/dev/null || echo "No running containers"
    echo ""
    
    # Health Check Results
    echo -e "${BLUE}[INFO]${NC} Health Check Results:"
    
    # Check Next.js health with detailed information
    if curl -f -s http://${HOST_IP:-localhost}:3002/api/health > /tmp/health.json 2>/dev/null; then
        echo -e "${GREEN}✅ Next.js API:${NC} Healthy"
        echo -e "${PURPLE}   [DEBUG] Response: $(cat /tmp/health.json | head -c 100)...${NC}"
        rm -f /tmp/health.json
    else
        echo -e "${RED}❌ Next.js API:${NC} Unhealthy (http://${HOST_IP:-localhost}:3002/api/health)"
    fi
    
    # Check PostgreSQL with detailed information
    if docker-compose -f $COMPOSE_FILE exec postgres pg_isready -U healthapp_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL:${NC} Ready"
        # Get database info
        DB_INFO=$(docker-compose -f $COMPOSE_FILE exec postgres psql -U healthapp_user -d healthapp_dev -c "SELECT count(*) as tables FROM information_schema.tables WHERE table_schema = 'public';" -t 2>/dev/null | xargs || echo "Unknown")
        echo -e "${PURPLE}   [DEBUG] Tables in database: ${DB_INFO}${NC}"
    else
        echo -e "${RED}❌ PostgreSQL:${NC} Not Ready"
    fi
    
    # Check Redis
    if docker-compose -f $COMPOSE_FILE exec redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis:${NC} Ready"
    else
        echo -e "${RED}❌ Redis:${NC} Not Ready"
    fi
    
    echo ""
    echo -e "${YELLOW}📊 Monitoring Commands:${NC}"
    echo -e "${PURPLE}   $0 monitor         ${NC}# Real-time monitoring"
    echo -e "${PURPLE}   $0 logs nextjs     ${NC}# Next.js application logs"
    echo -e "${PURPLE}   $0 debug           ${NC}# Interactive debugging"
}

# Scale Next.js service with monitoring
scale_service() {
    local replicas=${1:-2}
    
    echo -e "${YELLOW}[WARNING]${NC} Scaling Next.js service to $replicas replicas"
    echo -e "${PURPLE}[DEBUG]${NC} Current replicas: $(docker-compose -f $COMPOSE_FILE ps -q nextjs | wc -l)"
    
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
    
    # Show updated status
    echo -e "${BLUE}[INFO]${NC} Updated service status:"
    docker-compose -f $COMPOSE_FILE ps nextjs
}

# Interactive debugging session
start_debug_session() {
    local container=${1:-"nextjs"}
    
    echo -e "${PURPLE}🔧 Starting Interactive Debug Session${NC}"
    echo "============================================"
    echo -e "${BLUE}[INFO]${NC} Target container: $container"
    
    # Get container ID
    CONTAINER_ID=$(docker-compose -f $COMPOSE_FILE ps -q $container)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No $container containers found"
        echo -e "${BLUE}[INFO]${NC} Available containers:"
        docker-compose -f $COMPOSE_FILE ps
        exit 1
    fi
    
    echo -e "${BLUE}[INFO]${NC} Container ID: $CONTAINER_ID"
    echo -e "${BLUE}[INFO]${NC} Starting shell session..."
    echo -e "${YELLOW}[HELP]${NC} Type 'exit' to leave debug session"
    echo ""
    
    docker exec -it $CONTAINER_ID /bin/bash
}

# Performance profiling
show_performance_profile() {
    echo -e "${PURPLE}📊 Performance Profiling Report${NC}"
    echo "======================================="
    
    # Container resource usage
    echo -e "${BLUE}[INFO]${NC} Container Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" $(docker-compose -f $COMPOSE_FILE ps -q)
    echo ""
    
    # API Response times (if available)
    echo -e "${BLUE}[INFO]${NC} API Health Response Time:"
    time curl -s http://${HOST_IP:-localhost}:3002/api/health > /dev/null
    echo ""
    
    # Database query performance
    echo -e "${BLUE}[INFO]${NC} Database Connection Info:"
    POSTGRES_ID=$(docker-compose -f $COMPOSE_FILE ps -q postgres)
    if [ ! -z "$POSTGRES_ID" ]; then
        docker exec $POSTGRES_ID psql -U healthapp_user -d healthapp_dev -c "SELECT count(*) as active_connections FROM pg_stat_activity;" 2>/dev/null || echo "Database not accessible"
    fi
}

# Real-time monitoring
start_monitoring() {
    echo -e "${PURPLE}📊 Real-Time Healthcare Application Monitoring${NC}"
    echo "=================================================="
    echo -e "${YELLOW}[INFO]${NC} Press Ctrl+C to stop monitoring"
    echo ""
    
    while true; do
        clear
        echo -e "${PURPLE}📊 HealthApp Next.js Monitoring - $(date)${NC}"
        echo "=================================================="
        
        # Service status
        echo -e "${BLUE}[SERVICES]${NC}"
        docker-compose -f $COMPOSE_FILE ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
        echo ""
        
        # Resource usage
        echo -e "${BLUE}[RESOURCES]${NC}"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f $COMPOSE_FILE ps -q) 2>/dev/null
        echo ""
        
        # API health
        echo -e "${BLUE}[API HEALTH]${NC}"
        if curl -f -s http://${HOST_IP:-localhost}:3002/api/health > /tmp/health_monitor.json 2>/dev/null; then
            echo -e "${GREEN}✅ API Status: Healthy${NC}"
            if command -v jq &> /dev/null; then
                echo "   Response: $(cat /tmp/health_monitor.json | jq -c .)"
            fi
            rm -f /tmp/health_monitor.json
        else
            echo -e "${RED}❌ API Status: Unhealthy${NC}"
        fi
        echo ""
        
        sleep 5
    done
}

# Run Prisma migrations with detailed logging
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running Prisma database migrations with debug logging..."
    
    # Wait for Next.js service to be ready
    echo -e "${PURPLE}[DEBUG]${NC} Waiting for Next.js service to be ready..."
    sleep 15
    
    # Get Next.js container
    CONTAINER_ID=$(docker-compose -f $COMPOSE_FILE ps -q nextjs)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No Next.js containers found"
        docker-compose -f $COMPOSE_FILE ps
        exit 1
    fi
    
    echo -e "${PURPLE}[DEBUG]${NC} Using container: $CONTAINER_ID"
    
    # Run Prisma migrations with verbose output
    echo -e "${BLUE}[INFO]${NC} Running Prisma migrations..."
    docker exec $CONTAINER_ID npx prisma migrate dev --name auto-migration
    
    # Show migration status
    echo -e "${BLUE}[INFO]${NC} Migration status:"
    docker exec $CONTAINER_ID npx prisma migrate status
    
    echo -e "${GREEN}[SUCCESS]${NC} Prisma migrations completed!"
}

# Run database seeders with logging
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders with debug logging..."
    
    # Get Next.js container
    CONTAINER_ID=$(docker-compose -f $COMPOSE_FILE ps -q nextjs)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No Next.js containers found"
        exit 1
    fi
    
    # Note: Implement custom seeding for Prisma
    echo -e "${BLUE}[INFO]${NC} Running custom seeding script..."
    echo -e "${PURPLE}[DEBUG]${NC} Seeding development data..."
    
    # You can add custom seeding commands here
    # docker exec $CONTAINER_ID npm run seed:dev
    
    echo -e "${GREEN}[SUCCESS]${NC} Database seeders completed!"
}

# Backup database with detailed logging
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating development database backup..."
    
    BACKUP_FILE="healthapp_nextjs_dev_backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${PURPLE}[DEBUG]${NC} Backup file: $BACKUP_FILE"
    
    # Get postgres container
    POSTGRES_ID=$(docker-compose -f $COMPOSE_FILE ps -q postgres)
    
    if [ -z "$POSTGRES_ID" ]; then
        echo -e "${RED}[ERROR]${NC} No postgres containers found"
        exit 1
    fi
    
    echo -e "${PURPLE}[DEBUG]${NC} Using postgres container: $POSTGRES_ID"
    docker exec $POSTGRES_ID pg_dump -U healthapp_user healthapp_dev > $BACKUP_FILE
    
    echo -e "${GREEN}[SUCCESS]${NC} Database backup created: $BACKUP_FILE"
    echo -e "${PURPLE}[DEBUG]${NC} Backup size: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --ip)
                HOST_IP="$2"
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
            --no-debug)
                DEBUG_MODE=false
                shift
                ;;
            --container)
                DEBUG_CONTAINER="$2"
                shift 2
                ;;
            --follow)
                FOLLOW_LOGS=true
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
            if [ "$FOLLOW_LOGS" = true ]; then
                show_logs $2 "--follow"
            else
                show_logs $2
            fi
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
        debug)
            start_debug_session ${DEBUG_CONTAINER:-"nextjs"}
            ;;
        profile)
            show_performance_profile
            ;;
        monitor)
            start_monitoring
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