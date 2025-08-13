#!/bin/bash

# deploy-production.sh - Production Docker Swarm deployment
# Usage: ./scripts/deploy-production.sh deploy [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_NAME="healthapp"
STACK_NAME="$APP_NAME-prod"
DOMAIN="demo.adhere.live"
BRANCH="master"
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
BACKUP_BEFORE_DEPLOY=true

# Help function
show_help() {
    echo "🏥 HealthApp Production Docker Swarm Deployment"
    echo "=============================================="
    echo ""
    echo "Environment: Production with Docker Swarm orchestration"
    echo "Architecture: Next.js 14 + PostgreSQL + Redis + PgAdmin"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy production stack to swarm"
    echo "  update    Update services with zero-downtime"
    echo "  scale     Scale services"
    echo "  stop      Remove stack from swarm"
    echo "  logs      Show service logs"
    echo "  status    Show detailed service status"
    echo "  migrate   Run database migrations (idempotent)"
    echo "  seed      Run database seeders (idempotent)"
    echo "  backup    Backup production database"
    echo "  restore   Restore database from backup"
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
    echo "  --domain DOMAIN         Main application domain (default: demo.adhere.live)"
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
    echo "  --branch BRANCH         Git branch to deploy (default: master)"
    echo ""
    echo "Safety Options:"
    echo "  --no-backup             Skip pre-deployment backup"
    echo "  --auto-yes              Skip confirmation prompts"
    echo ""
    echo "Environment Variables Required:"
    echo "  POSTGRES_PASSWORD       Database password"
    echo "  JWT_SECRET              JWT signing secret"
    echo "  NEXTAUTH_SECRET         NextAuth secret key"
    echo "  REDIS_PASSWORD          Redis password"
    echo "  PGADMIN_PASSWORD        PgAdmin admin password"
    echo ""
    echo "Examples:"
    echo "  # Basic production deployment"
    echo "  $0 deploy --domain healthapp.com --migrate --seed"
    echo ""
    echo "  # High-availability deployment with scaling"
    echo "  $0 deploy --scale 4 --scale-db 2 --domain app.company.com"
    echo ""
    echo "  # Multi-server deployment with custom domains"
    echo "  $0 deploy --domain app.company.com \\"
    echo "             --domain-db db.company.com \\"
    echo "             --domain-redis cache.company.com \\"
    echo "             --app-name myapp"
    echo ""
    echo "  # Custom ports deployment"
    echo "  $0 deploy --port-app 8080 --port-db 5433 --port-redis 6380"
    echo ""
    echo "  # Deploy specific branch"
    echo "  $0 deploy --branch feature/new-ui --migrate"
    echo ""
    echo "  # Scale existing deployment"
    echo "  $0 scale --scale 6"
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
                # Set default domains to main domain if not specified separately
                if [ "$DOMAIN_DB" = "$DOMAIN" ]; then DOMAIN_DB="$2"; fi
                if [ "$DOMAIN_REDIS" = "$DOMAIN" ]; then DOMAIN_REDIS="$2"; fi
                if [ "$DOMAIN_PGADMIN" = "$DOMAIN" ]; then DOMAIN_PGADMIN="$2"; fi
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
                STACK_NAME="$APP_NAME-prod"
                shift 2
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_BEFORE_DEPLOY=false
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

# Check Docker Swarm
check_swarm() {
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        echo -e "${RED}[ERROR]${NC} Docker Swarm must be initialized for production deployment"
        echo -e "${BLUE}[INFO]${NC} Run: docker swarm init"
        exit 1
    fi
    echo -e "${GREEN}[SUCCESS]${NC} Docker Swarm is active"
}

# Check required environment variables
check_env_vars() {
    local missing_vars=()
    
    [ -z "$POSTGRES_PASSWORD" ] && missing_vars+=("POSTGRES_PASSWORD")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    [ -z "$NEXTAUTH_SECRET" ] && missing_vars+=("NEXTAUTH_SECRET")
    [ -z "$REDIS_PASSWORD" ] && missing_vars+=("REDIS_PASSWORD")
    [ -z "$PGADMIN_PASSWORD" ] && missing_vars+=("PGADMIN_PASSWORD")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo -e "${RED}  - $var${NC}"
        done
        echo ""
        echo -e "${BLUE}[INFO]${NC} Set environment variables or create .env.production file"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All required environment variables are set"
}

# Checkout specific branch
checkout_branch() {
    if [ "$BRANCH" != "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')" ]; then
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

# Build production image
build_image() {
    echo -e "${BLUE}[INFO]${NC} Building production image: $APP_NAME:production"
    
    docker build -f docker/Dockerfile.production -t $APP_NAME:production .
    
    echo -e "${GREEN}[SUCCESS]${NC} Production image built successfully!"
}

# Create Docker stack configuration
create_stack_config() {
    echo -e "${BLUE}[INFO]${NC} Creating Docker stack configuration..."
    
    cat > /tmp/docker-stack-${APP_NAME}-prod.yml << EOF
version: '3.8'

services:
  app:
    image: ${APP_NAME}:production
    environment:
      NODE_ENV: production
      PORT: 3002
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${APP_NAME}_prod
      POSTGRES_USER: ${APP_NAME}_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      DATABASE_URL: postgresql://${APP_NAME}_user:\${POSTGRES_PASSWORD}@postgres:5432/${APP_NAME}_prod?schema=public
      JWT_SECRET: \${JWT_SECRET}
      NEXTAUTH_SECRET: \${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://${DOMAIN}
      NEXT_PUBLIC_API_URL: https://${DOMAIN}/api
      FRONTEND_URL: https://${DOMAIN}
      BACKEND_URL: https://${DOMAIN}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: \${REDIS_PASSWORD}
    ports:
      - "${PORT_APP}:3002"
    networks:
      - ${APP_NAME}-network
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: ${SCALE_APP}
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
      placement:
        constraints:
          - node.role == manager

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${APP_NAME}_prod
      POSTGRES_USER: ${APP_NAME}_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    ports:
      - "${PORT_DB}:5432"
    networks:
      - ${APP_NAME}-network
    deploy:
      replicas: ${SCALE_DB}
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_prod_data:/data
    ports:
      - "${PORT_REDIS}:6379"
    networks:
      - ${APP_NAME}-network
    deploy:
      replicas: ${SCALE_REDIS}
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@${DOMAIN}
      PGADMIN_DEFAULT_PASSWORD: \${PGADMIN_PASSWORD}
      PGADMIN_CONFIG_SERVER_MODE: 'True'
    ports:
      - "${PORT_PGADMIN}:80"
    networks:
      - ${APP_NAME}-network
    volumes:
      - pgadmin_prod_data:/var/lib/pgadmin
    depends_on:
      - postgres
    deploy:
      replicas: ${SCALE_PGADMIN}
      placement:
        constraints:
          - node.role == manager

volumes:
  postgres_prod_data:
    driver: local
  redis_prod_data:
    driver: local
  pgadmin_prod_data:
    driver: local

networks:
  ${APP_NAME}-network:
    driver: overlay
    attachable: true
EOF

    echo -e "${GREEN}[SUCCESS]${NC} Stack configuration created"
}

# Deploy stack
deploy_stack() {
    echo -e "${YELLOW}[WARNING]${NC} Deploying to PRODUCTION environment!"
    echo -e "${BLUE}[INFO]${NC} Configuration:"
    echo -e "${BLUE}[INFO]${NC}   App Name: $APP_NAME"
    echo -e "${BLUE}[INFO]${NC}   Stack: $STACK_NAME"  
    echo -e "${BLUE}[INFO]${NC}   Branch: $BRANCH"
    echo -e "${BLUE}[INFO]${NC}   Domain: $DOMAIN"
    echo -e "${BLUE}[INFO]${NC}   App Replicas: $SCALE_APP"
    echo -e "${BLUE}[INFO]${NC}   DB Replicas: $SCALE_DB"
    echo -e "${BLUE}[INFO]${NC}   Redis Replicas: $SCALE_REDIS"
    echo -e "${BLUE}[INFO]${NC}   Ports: App($PORT_APP), DB($PORT_DB), Redis($PORT_REDIS), PgAdmin($PORT_PGADMIN)"
    
    if [ "$AUTO_YES" = false ]; then
        read -p "Deploy to production? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Deployment cancelled"
            exit 0
        fi
    fi
    
    # Create backup before deployment
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        echo -e "${BLUE}[INFO]${NC} Creating pre-deployment backup..."
        backup_database || echo -e "${YELLOW}[WARNING]${NC} Backup failed, continuing deployment..."
    fi
    
    # Checkout branch
    checkout_branch
    
    # Build image
    build_image
    
    # Create stack configuration
    create_stack_config
    
    # Export environment variables
    export POSTGRES_PASSWORD JWT_SECRET NEXTAUTH_SECRET REDIS_PASSWORD PGADMIN_PASSWORD
    
    # Deploy to swarm
    echo -e "${BLUE}[INFO]${NC} Deploying to Docker Swarm..."
    docker stack deploy -c /tmp/docker-stack-${APP_NAME}-prod.yml $STACK_NAME
    
    echo -e "${GREEN}[SUCCESS]${NC} Production stack deployed!"
    echo -e "${BLUE}[INFO]${NC} Application: https://$DOMAIN:$PORT_APP"
    echo -e "${BLUE}[INFO]${NC} PgAdmin: https://$DOMAIN_PGADMIN:$PORT_PGADMIN"
    
    # Wait for services to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for services to be ready..."
    sleep 60
    
    # Run migrations if requested
    if [ "$RUN_MIGRATE" = true ]; then
        run_migrations
    fi
    
    # Run seeders if requested
    if [ "$RUN_SEED" = true ]; then
        run_seeders
    fi
    
    # Verify deployment
    verify_deployment
    
    echo -e "${GREEN}[SUCCESS]${NC} Production deployment completed!"
    show_status
}

# Scale services
scale_services() {
    echo -e "${BLUE}[INFO]${NC} Scaling production services..."
    echo -e "${BLUE}[INFO]${NC}   App: $SCALE_APP replicas"
    echo -e "${BLUE}[INFO]${NC}   DB: $SCALE_DB replicas"  
    echo -e "${BLUE}[INFO]${NC}   Redis: $SCALE_REDIS replicas"
    echo -e "${BLUE}[INFO]${NC}   PgAdmin: $SCALE_PGADMIN replicas"
    
    if [ "$AUTO_YES" = false ]; then
        read -p "Proceed with scaling? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Scaling cancelled"
            return
        fi
    fi
    
    docker service scale ${STACK_NAME}_app=$SCALE_APP
    docker service scale ${STACK_NAME}_postgres=$SCALE_DB
    docker service scale ${STACK_NAME}_redis=$SCALE_REDIS
    docker service scale ${STACK_NAME}_pgadmin=$SCALE_PGADMIN
    
    echo -e "${GREEN}[SUCCESS]${NC} Services scaled successfully!"
}

# Run idempotent migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running idempotent database migrations..."
    
    # Wait for database to be ready
    echo -e "${BLUE}[INFO]${NC} Waiting for database to be ready..."
    sleep 30
    
    # Get app container
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} App container not found"
        exit 1
    fi
    
    # Run Prisma migrations (idempotent by design)
    echo -e "${BLUE}[INFO]${NC} Running Prisma migrations (idempotent)..."
    docker exec $CONTAINER_ID npx prisma migrate deploy
    
    echo -e "${GREEN}[SUCCESS]${NC} Migrations completed successfully!"
}

# Run idempotent seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running idempotent database seeders..."
    
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -n1)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} App container not found"
        exit 1
    fi
    
    # Run Prisma seed (implement idempotent logic in seed file)
    echo -e "${BLUE}[INFO]${NC} Running Prisma seed (idempotent)..."
    docker exec $CONTAINER_ID npx prisma db seed
    
    echo -e "${GREEN}[SUCCESS]${NC} Seeders completed successfully!"
}

# Show detailed status
show_status() {
    echo -e "${BLUE}[INFO]${NC} Production Stack Status: $STACK_NAME"
    echo ""
    
    # Service status
    docker stack services $STACK_NAME
    echo ""
    
    # Service tasks
    echo -e "${BLUE}[INFO]${NC} Service Tasks:"
    docker stack ps $STACK_NAME --no-trunc
    echo ""
    
    # Health checks
    verify_deployment
}

# Verify deployment health
verify_deployment() {
    echo -e "${BLUE}[INFO]${NC} Verifying deployment health..."
    
    # Check application health
    if curl -f -s https://$DOMAIN:$PORT_APP/api/health > /dev/null 2>&1 || \
       curl -f -s http://$DOMAIN:$PORT_APP/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application:${NC} Healthy (https://$DOMAIN:$PORT_APP)"
    else
        echo -e "${RED}❌ Application:${NC} Unhealthy"
        return 1
    fi
    
    # Check database
    POSTGRES_ID=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    if [ -n "$POSTGRES_ID" ] && docker exec $POSTGRES_ID pg_isready -U ${APP_NAME}_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL:${NC} Ready"
    else
        echo -e "${RED}❌ PostgreSQL:${NC} Not Ready"
        return 1
    fi
    
    # Check Redis
    REDIS_ID=$(docker ps --filter "name=${STACK_NAME}_redis" --format "{{.ID}}" | head -n1)
    if [ -n "$REDIS_ID" ] && docker exec $REDIS_ID redis-cli -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis:${NC} Ready"
    else
        echo -e "${RED}❌ Redis:${NC} Not Ready"
        return 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All services are healthy!"
}

# Backup database
backup_database() {
    echo -e "${BLUE}[INFO]${NC} Creating production database backup..."
    
    BACKUP_FILE="${APP_NAME}_prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -n1)
    
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}[ERROR]${NC} PostgreSQL container not found"
        exit 1
    fi
    
    docker exec $CONTAINER_ID pg_dump -U ${APP_NAME}_user ${APP_NAME}_prod > $BACKUP_FILE
    gzip $BACKUP_FILE
    
    echo -e "${GREEN}[SUCCESS]${NC} Database backup: ${BACKUP_FILE}.gz"
    echo -e "${BLUE}[INFO]${NC} Size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
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

# Stop stack
stop_stack() {
    echo -e "${RED}[DANGER]${NC} This will STOP the PRODUCTION environment!"
    
    if [ "$AUTO_YES" = false ]; then
        read -p "Type 'STOP' to confirm: " -r
        if [ "$REPLY" != "STOP" ]; then
            echo -e "${BLUE}[INFO]${NC} Operation cancelled"
            return
        fi
    fi
    
    echo -e "${BLUE}[INFO]${NC} Stopping production stack: $STACK_NAME"
    docker stack rm $STACK_NAME
    rm -f /tmp/docker-stack-${APP_NAME}-prod.yml
    echo -e "${YELLOW}[WARNING]${NC} Production stack stopped!"
}

# Main function
main() {
    parse_args "$@"
    check_swarm
    check_env_vars
    
    case ${1:-""} in
        deploy)
            deploy_stack
            ;;
        scale)
            scale_services
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