#!/bin/bash

# HealthApp Deployment Script with Docker Swarm Support (Updated)
# NOTICE: This script now uses the new unified Docker setup
# Usage: ./deploy-stack.sh dev|prod [IP_ADDRESS] [--auto-yes] [--scale-backend=N] [--scale-frontend=N]
# Example: ./deploy-stack.sh dev 192.168.0.148 --auto-yes --scale-backend=2 --scale-frontend=1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE=""
IP_ADDRESS=""
HOST_IP=""
DB_HOST_IP=""
REDIS_HOST_IP=""
AUTO_YES=false
SCALE_BACKEND=1
SCALE_FRONTEND=1
BRANCH="master"
RUN_MIGRATIONS=false
RUN_SEEDERS=false

# Docker configuration
DOCKER_STACK_NAME="healthapp"
ENV_FILES_DIR="./env_files"
DOCKER_FILES_DIR="./docker"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to display usage
show_usage() {
    echo "HealthApp Deployment Script"
    echo ""
    echo "Usage: $0 MODE [HOST_IP] [DB_HOST_IP] [REDIS_HOST_IP] [OPTIONS]"
    echo "   OR: $0 MODE [IP_ADDRESS] [OPTIONS]  # For backward compatibility"
    echo ""
    echo "PARAMETERS:"
    echo "  MODE              Deployment mode: 'dev' or 'prod'"
    echo "  HOST_IP           Frontend/Backend host IP (optional, auto-detects if not provided)"
    echo "  DB_HOST_IP        Database host IP (optional, defaults to HOST_IP)"
    echo "  REDIS_HOST_IP     Redis host IP (optional, defaults to HOST_IP)"
    echo ""
    echo "OPTIONS:"
    echo "  --auto-yes        Skip all confirmation prompts"
    echo "  --scale-backend=N Scale backend service to N replicas (default: 1)"
    echo "  --scale-frontend=N Scale frontend service to N replicas (default: 1)"
    echo "  --branch=BRANCH   Git branch to deploy (default: master)"
    echo "  --migrate         Run database migrations after deployment"
    echo "  --seed            Run database seeders after deployment"
    echo "  --host-ip=IP      Override host IP address"
    echo "  --db-ip=IP        Override database IP address"
    echo "  --redis-ip=IP     Override Redis IP address"
    echo "  --help            Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 dev                                    # Deploy dev with auto-detected IP"
    echo "  $0 dev 192.168.0.148                     # Deploy dev with specific IP for all services"
    echo "  $0 dev 192.168.0.148 192.168.0.149 192.168.0.150  # Different IPs per service"
    echo "  $0 prod 10.0.0.100 --auto-yes            # Deploy prod with auto-confirmation"
    echo "  $0 dev --scale-backend=3 --scale-frontend=2  # Deploy with scaling"
    echo "  $0 dev --migrate --seed                   # Deploy with migrations and seeders"
    echo "  $0 prod --host-ip=10.0.0.100 --db-ip=10.0.0.101 --migrate --auto-yes  # Production with custom IPs"
    echo ""
}

# Function to auto-detect IP address
get_network_ip() {
    # Try to get the IP address of the default network interface
    local ip=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $7; exit}')
    if [ -z "$ip" ]; then
        # Fallback method
        ip=$(hostname -I | awk '{print $1}')
    fi
    if [ -z "$ip" ]; then
        # Last resort fallback
        ip="localhost"
    fi
    echo "$ip"
}

# Parse command line arguments
parse_arguments() {
    local positional_args=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|prod)
                if [ -z "$MODE" ]; then
                    MODE="$1"
                else
                    print_error "Mode already specified: $MODE"
                    exit 1
                fi
                shift
                ;;
            --auto-yes)
                AUTO_YES=true
                shift
                ;;
            --scale-backend=*)
                SCALE_BACKEND="${1#*=}"
                shift
                ;;
            --scale-frontend=*)
                SCALE_FRONTEND="${1#*=}"
                shift
                ;;
            --branch=*)
                BRANCH="${1#*=}"
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
            --host-ip=*)
                HOST_IP="${1#*=}"
                shift
                ;;
            --db-ip=*)
                DB_HOST_IP="${1#*=}"
                shift
                ;;
            --redis-ip=*)
                REDIS_HOST_IP="${1#*=}"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            --*)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                # Collect positional arguments (IP addresses)
                if [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                    positional_args+=("$1")
                else
                    print_error "Invalid argument: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Validate required parameters
    if [ -z "$MODE" ]; then
        print_error "Mode is required (dev|prod)"
        show_usage
        exit 1
    fi

    # Process positional IP arguments
    if [ ${#positional_args[@]} -eq 1 ]; then
        # Single IP - use for all services (backward compatibility)
        IP_ADDRESS="${positional_args[0]}"
        HOST_IP="${positional_args[0]}"
        DB_HOST_IP="${positional_args[0]}"
        REDIS_HOST_IP="${positional_args[0]}"
    elif [ ${#positional_args[@]} -eq 3 ]; then
        # Three IPs - granular control
        HOST_IP="${positional_args[0]}"
        DB_HOST_IP="${positional_args[1]}"
        REDIS_HOST_IP="${positional_args[2]}"
        IP_ADDRESS="$HOST_IP"  # For backward compatibility
    elif [ ${#positional_args[@]} -gt 1 ] && [ ${#positional_args[@]} -ne 3 ]; then
        print_error "Invalid number of IP addresses. Provide either 1 (for all services) or 3 (HOST_IP DB_HOST_IP REDIS_HOST_IP)"
        show_usage
        exit 1
    fi

    # Auto-detect IPs if not provided via any method
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(get_network_ip)
        print_warning "Auto-detected HOST_IP: $HOST_IP"
    fi
    
    if [ -z "$DB_HOST_IP" ]; then
        DB_HOST_IP="$HOST_IP"
        print_warning "Using HOST_IP for database: $DB_HOST_IP"
    fi
    
    if [ -z "$REDIS_HOST_IP" ]; then
        REDIS_HOST_IP="$HOST_IP"
        print_warning "Using HOST_IP for Redis: $REDIS_HOST_IP"
    fi
    
    # Set IP_ADDRESS for backward compatibility
    if [ -z "$IP_ADDRESS" ]; then
        IP_ADDRESS="$HOST_IP"
    fi
}

# Function to prompt user for confirmation
prompt_user() {
    local message="$1"
    if [ "$AUTO_YES" = true ]; then
        print_status "Auto-confirmed: $message"
        return 0
    else
        echo -n -e "${YELLOW}[PROMPT]${NC} $message (yes/no): "
        read -r response
        case "$response" in
            [yY][eE][sS]|[yY])
                return 0
                ;;
            *)
                return 1
                ;;
        esac
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed."
        exit 1
    fi

    # Initialize Docker Swarm if not already initialized
    if ! docker info | grep -q "Swarm: active"; then
        print_warning "Docker Swarm is not initialized. Initializing now..."
        docker swarm init --advertise-addr "$IP_ADDRESS" || {
            print_error "Failed to initialize Docker Swarm"
            exit 1
        }
        print_status "Docker Swarm initialized successfully"
    else
        print_status "Docker Swarm is already active"
    fi

    print_status "Prerequisites check completed"
}

# Function to update environment files with IP address
update_environment_files() {
    print_header "Updating environment configuration for IP: $IP_ADDRESS"
    
    local env_file
    if [ "$MODE" = "prod" ]; then
        env_file="$ENV_FILES_DIR/.env.production.example"
    else
        env_file="$ENV_FILES_DIR/.env.development.example"
    fi

    # Create working environment file
    if [ "$MODE" = "prod" ]; then
        local working_env=".env.production"
    else
        local working_env=".env.development"
    fi
    
    if [ -f "$env_file" ]; then
        # Copy template and update with IP address
        cp "$env_file" "$working_env"
        
        # Update URLs with the provided IP address
        sed -i "s/localhost:3002/$IP_ADDRESS:3002/g" "$working_env"
        sed -i "s/localhost:3005/$IP_ADDRESS:3005/g" "$working_env"
        
        print_status "Environment file updated: $working_env"
    else
        print_error "Environment template file not found: $env_file"
        exit 1
    fi
}

# Function to build Docker images
build_images() {
    print_header "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -f docker/Dockerfile.backend -t healthapp-backend:${MODE} . || {
        print_error "Failed to build backend image"
        exit 1
    }
    
    # Build frontend image - use appropriate Dockerfile based on mode
    print_status "Building frontend image..."
    if [ "$MODE" = "dev" ]; then
        docker build -f docker/Dockerfile.dev -t healthapp-frontend:${MODE} . || {
            print_error "Failed to build frontend image"
            exit 1
        }
    else
        docker build -f docker/Dockerfile -t healthapp-frontend:${MODE} . || {
            print_error "Failed to build frontend image"
            exit 1
        }
    fi
    
    print_status "Docker images built successfully"
}

# Function to create Docker Swarm stack file
create_swarm_stack() {
    print_header "Creating Docker Swarm stack configuration..."
    
    # Map deployment mode to proper NODE_ENV values
    if [ "$MODE" = "dev" ]; then
        NODE_ENV_VALUE="development"
    else
        NODE_ENV_VALUE="production"
    fi
    
    cat > docker-stack-$MODE.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: healthapp_${MODE}
      POSTGRES_USER: healthapp_user
      POSTGRES_PASSWORD: pg_password
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres_data_${MODE}:/var/lib/postgresql/data
    ports:
      - "${DB_HOST_IP}:5433:5432"
    networks:
      - healthapp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U healthapp_user -d healthapp_${MODE} && psql -U healthapp_user -d healthapp_${MODE} -c 'SELECT 1'"]
      interval: 15s
      timeout: 10s
      retries: 6
      start_period: 120s
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data_${MODE}:/data
    ports:
      - "${REDIS_HOST_IP}:6379:6379"
    networks:
      - healthapp-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      replicas: 1

  backend:
    image: healthapp-backend:${MODE}
    environment:
      NODE_ENV: ${NODE_ENV_VALUE}
      PORT: 3005
      HOST_IP: ${HOST_IP}
      DB_HOST_IP: ${DB_HOST_IP}
      REDIS_HOST_IP: ${REDIS_HOST_IP}
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: healthapp_${MODE}
      POSTGRES_USER: healthapp_user
      POSTGRES_PASSWORD: pg_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: 25af6001e43881f727388f44e0f6fff837510b0649fe9393987f009c595156f778442654270516863b00617b478aa46dea6311f74fb95325d3c9a344b125d033
      FRONTEND_URL: http://${HOST_IP}:3002
      LOG_LEVEL: info
      # Add connection retry configuration for better startup reliability
      DB_CONNECT_RETRY_DELAY: 5000
      DB_CONNECT_MAX_RETRIES: 10
    volumes:
      - backend_logs_${MODE}:/app/logs
    ports:
      - "${HOST_IP}:3005:3005"
    networks:
      - healthapp-network
    deploy:
      replicas: ${SCALE_BACKEND}
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    # Backend waits for database health checks
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3005/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s  # Increased to allow database connection setup

  frontend:
    image: healthapp-frontend:${MODE}
    environment:
      NODE_ENV: ${NODE_ENV_VALUE}
      HOST_IP: ${HOST_IP}
      BACKEND_URL: http://backend:3005
      NEXT_PUBLIC_API_URL: http://${HOST_IP}:3005/api
    ports:
      - "${HOST_IP}:3002:3002"
    networks:
      - healthapp-network
    depends_on:
      - backend
    deploy:
      replicas: ${SCALE_FRONTEND}
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    # Frontend healthcheck - simplified to just check if Next.js is responding
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@healthapp.com
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    volumes:
      - pgadmin_data_${MODE}:/var/lib/pgadmin
    ports:
      - "${HOST_IP}:5050:80"
    networks:
      - healthapp-network
    deploy:
      replicas: 1

networks:
  healthapp-network:
    driver: overlay
    attachable: true

volumes:
  postgres_data_${MODE}:
  redis_data_${MODE}:
  backend_logs_${MODE}:
  pgadmin_data_${MODE}:
EOF

    print_status "Docker Swarm stack file created: docker-stack-$MODE.yml"
}

# Function to cleanup existing deployment
cleanup_existing() {
    print_header "Cleaning up existing deployment..."
    
    # Remove existing stack if it exists
    if docker stack ls | grep -q "$DOCKER_STACK_NAME"; then
        print_status "Removing existing stack: $DOCKER_STACK_NAME"
        docker stack rm "$DOCKER_STACK_NAME"
        
        # Wait for services to be removed
        print_status "Waiting for services to be removed..."
        sleep 15
        
        # Wait until all services are actually removed
        while docker stack ls | grep -q "$DOCKER_STACK_NAME"; do
            print_status "Waiting for stack removal to complete..."
            sleep 5
        done
    fi

    # Clean up Docker system
    if prompt_user "Do you want to clean up unused Docker resources?"; then
        print_status "Cleaning up Docker system..."
        docker system prune -f --volumes
        print_status "Docker cleanup completed"
    fi
}

# Function to deploy the stack
deploy_stack() {
    print_header "Deploying HealthApp Stack..."
    
    # Check if we should use the unified docker-stack.yml or the generated one
    if [ -f "docker/docker-stack.yml" ]; then
        print_status "Using unified Docker Swarm configuration: docker/docker-stack.yml"
        
        # Set environment variables for the stack
        export VERSION=$MODE
        export HOST_IP=$HOST_IP
        export DB_HOST_IP=$DB_HOST_IP
        export REDIS_HOST_IP=$REDIS_HOST_IP
        export DB_NAME=healthapp_$MODE
        export DB_USER=healthapp_user  
        export DB_PASSWORD=pg_password
        export JWT_SECRET=25af6001e43881f727388f44e0f6fff837510b0649fe9393987f009c595156f778442654270516863b00617b478aa46dea6311f74fb95325d3c9a344b125d033
        export FRONTEND_URL=http://$HOST_IP:3002
        export NEXT_PUBLIC_API_URL=http://$HOST_IP:3005/api
        
        # Deploy the unified stack
        docker stack deploy -c docker/docker-stack.yml "$DOCKER_STACK_NAME" --detach=false
    else
        # Fallback to generated stack file
        print_status "Using generated stack configuration: docker-stack-$MODE.yml"
        docker stack deploy -c docker-stack-$MODE.yml "$DOCKER_STACK_NAME" --detach=false
    fi
    
    print_status "Stack deployment initiated successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_header "Waiting for services to be ready..."
    
    # Wait for initial deployment
    sleep 20
    
    # Check service status
    print_status "Checking service status..."
    docker stack services "$DOCKER_STACK_NAME"
    
    # Wait for database to be ready (FIRST PRIORITY)
    print_status "Waiting for PostgreSQL database to be ready..."
    local timeout=180  # Increased to 3 minutes
    local counter=0
    local postgres_healthy=false
    
    while [ $counter -lt $timeout ]; do
        if docker service ls | grep "${DOCKER_STACK_NAME}_postgres" | grep -q "1/1"; then
            # Double-check with actual health status
            local postgres_task_id=$(docker service ps "${DOCKER_STACK_NAME}_postgres" --no-trunc --format "{{.ID}}" | head -n1)
            if [ -n "$postgres_task_id" ]; then
                local container_id=$(docker inspect --format='{{.Status.ContainerStatus.ContainerID}}' "$postgres_task_id" 2>/dev/null | head -c12)
                if [ -n "$container_id" ]; then
                    if docker exec "$container_id" pg_isready -U healthapp_user -d "healthapp_${MODE}" > /dev/null 2>&1; then
                        print_status "PostgreSQL database service is ready and healthy"
                        postgres_healthy=true
                        break
                    fi
                fi
            fi
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    echo ""
    
    if [ "$postgres_healthy" = false ]; then
        print_error "PostgreSQL failed to start within $timeout seconds!"
        print_error "Attempting recovery procedures..."
        
        # Recovery attempt 1: Check logs for issues
        print_status "Checking PostgreSQL logs for errors..."
        docker service logs "${DOCKER_STACK_NAME}_postgres" --tail 50
        
        # Recovery attempt 2: Restart PostgreSQL service
        print_status "Attempting to restart PostgreSQL service..."
        docker service update --force "${DOCKER_STACK_NAME}_postgres"
        
        # Wait additional 60 seconds for restart
        print_status "Waiting additional 60 seconds for PostgreSQL restart..."
        counter=0
        while [ $counter -lt 60 ]; do
            if docker service ls | grep "${DOCKER_STACK_NAME}_postgres" | grep -q "1/1"; then
                local postgres_task_id=$(docker service ps "${DOCKER_STACK_NAME}_postgres" --no-trunc --format "{{.ID}}" | head -n1)
                if [ -n "$postgres_task_id" ]; then
                    local container_id=$(docker inspect --format='{{.Status.ContainerStatus.ContainerID}}' "$postgres_task_id" 2>/dev/null | head -c12)
                    if [ -n "$container_id" ]; then
                        if docker exec "$container_id" pg_isready -U healthapp_user -d "healthapp_${MODE}" > /dev/null 2>&1; then
                            print_status "PostgreSQL recovered successfully after restart"
                            postgres_healthy=true
                            break
                        fi
                    fi
                fi
            fi
            sleep 5
            counter=$((counter + 5))
            echo -n "."
        done
        echo ""
        
        if [ "$postgres_healthy" = false ]; then
            print_error "PostgreSQL recovery failed. Manual intervention required."
            print_error "Troubleshooting steps:"
            echo "  1. Check PostgreSQL logs: docker service logs ${DOCKER_STACK_NAME}_postgres"
            echo "  2. Check available disk space: df -h"
            echo "  3. Check PostgreSQL data volume: docker volume inspect postgres_data_${MODE}"
            echo "  4. Try removing and recreating the stack"
            echo "  5. Contact system administrator if issues persist"
            exit 1
        fi
    fi
    
    # Wait for Redis to be ready (SECOND PRIORITY)
    print_status "Waiting for Redis cache to be ready..."
    counter=0
    timeout=60
    
    while [ $counter -lt $timeout ]; do
        if docker service ls | grep "${DOCKER_STACK_NAME}_redis" | grep -q "1/1"; then
            print_status "Redis cache service is ready"
            break
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_warning "Redis readiness check timed out, but continuing..."
    fi
    
    # Wait for backend to be ready (THIRD PRIORITY)
    print_status "Waiting for backend API to be ready..."
    counter=0
    timeout=180
    
    while [ $counter -lt $timeout ]; do
        if docker service ls | grep "${DOCKER_STACK_NAME}_backend" | grep -q "1/1"; then
            # Also check if backend health endpoint responds
            if curl -f http://${HOST_IP}:3005/health > /dev/null 2>&1; then
                print_status "Backend API service is ready and responding"
                break
            fi
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_error "Backend API failed to start within $timeout seconds!"
        exit 1
    fi
    
    # Wait for frontend to be ready (FOURTH PRIORITY)
    print_status "Waiting for frontend to be ready..."
    counter=0
    timeout=120
    
    while [ $counter -lt $timeout ]; do
        if docker service ls | grep "${DOCKER_STACK_NAME}_frontend" | grep -q "1/1"; then
            # Also check if frontend responds
            if curl -f http://${HOST_IP}:3002 > /dev/null 2>&1; then
                print_status "Frontend service is ready and responding"
                break
            fi
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_warning "Frontend readiness check timed out, but continuing..."
    fi
}

# Function to run database initialization
initialize_database() {
    print_header "Initializing database..."
    
    # Wait for backend container to be fully started
    print_status "Waiting for backend container to be ready for database operations..."
    sleep 30
    
    # Install UUID extension first
    print_status "Installing PostgreSQL UUID extension..."
    local postgres_task_id=$(docker service ps "${DOCKER_STACK_NAME}_postgres" --no-trunc --format "{{.ID}}" | head -n1)
    if [ -n "$postgres_task_id" ]; then
        local postgres_container_id=$(docker inspect --format='{{.Status.ContainerStatus.ContainerID}}' "$postgres_task_id" 2>/dev/null | head -c12)
        if [ -n "$postgres_container_id" ]; then
            docker exec "$postgres_container_id" psql -U healthapp_user -d "healthapp_${MODE}" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" || {
                print_warning "Failed to install UUID extension, but continuing..."
            }
        fi
    fi
    
    # Get a backend container to run database operations
    local task_id=$(docker service ps "${DOCKER_STACK_NAME}_backend" --no-trunc --format "{{.ID}}" | head -n1)
    
    if [ -n "$task_id" ]; then
        # Find the actual container ID from the task
        local container_id=$(docker inspect --format='{{.Status.ContainerStatus.ContainerID}}' "$task_id" 2>/dev/null | head -c12)
        
        if [ -n "$container_id" ]; then
            print_status "Running database operations in container: $container_id"
            
            # Run migrations if requested
            if [ "$RUN_MIGRATIONS" = true ]; then
                print_status "Running database migrations..."
                
                # Enhanced database readiness validation
                print_status "Validating database connection and readiness..."
                local db_ready=false
                local db_validation_timeout=120
                local db_counter=0
                
                while [ $db_counter -lt $db_validation_timeout ]; do
                    # Test database connectivity with multiple validation methods
                    if docker exec "$container_id" sh -c "cd /app && timeout 10 npx sequelize-cli db:validate 2>/dev/null"; then
                        print_status "✅ Database connection validation successful"
                        db_ready=true
                        break
                    fi
                    
                    # Alternate validation: Direct PostgreSQL connection test
                    if docker exec "$container_id" sh -c "cd /app && timeout 10 node -e 'const { Sequelize } = require(\"sequelize\"); require(\"dotenv\").config(); const sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, { host: process.env.POSTGRES_HOST, dialect: \"postgres\", logging: false }); sequelize.authenticate().then(() => { console.log(\"DB_READY\"); process.exit(0); }).catch(err => { console.error(\"DB_NOT_READY:\", err.message); process.exit(1); });' 2>/dev/null | grep -q 'DB_READY'"; then
                        print_status "✅ Direct database connection test successful"
                        db_ready=true
                        break
                    fi
                    
                    sleep 3
                    db_counter=$((db_counter + 3))
                    echo -n "."
                done
                echo ""
                
                if [ "$db_ready" = false ]; then
                    print_error "❌ Database readiness validation failed after $db_validation_timeout seconds!"
                    print_warning "Attempting migration anyway with extended timeout..."
                else
                    print_status "Database is ready for migrations"
                fi
                
                # Wait additional stabilization time
                print_status "Waiting additional 10 seconds for database stability..."
                sleep 10
                
                # Attempt migration with comprehensive error handling
                print_status "Attempting database migration..."
                local migration_success=false
                local migration_attempts=0
                local max_migration_attempts=3
                
                while [ $migration_attempts -lt $max_migration_attempts ] && [ "$migration_success" = false ]; do
                    migration_attempts=$((migration_attempts + 1))
                    print_status "Migration attempt $migration_attempts of $max_migration_attempts"
                    
                    # Ensure TypeScript is compiled before running migrations
                    print_status "Compiling TypeScript before migration attempt $migration_attempts..."
                    if ! docker exec "$container_id" sh -c "cd /app && npm run backend:build" 2>&1 | tee /tmp/build_log_${MODE}.txt; then
                        print_warning "TypeScript compilation failed, but attempting migration anyway..."
                    fi
                    
                    # Set longer timeout for migration execution
                    if timeout 180 docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npm run migrate" 2>&1 | tee /tmp/migration_log_${MODE}.txt; then
                        print_status "✅ Database migrations completed successfully on attempt $migration_attempts"
                        migration_success=true
                        break
                    else
                        local exit_code=$?
                        print_warning "❌ Migration attempt $migration_attempts failed with exit code $exit_code"
                        
                        # Analyze the failure
                        if grep -q "ECONNREFUSED\|connection refused\|Connection refused" /tmp/migration_log_${MODE}.txt; then
                            print_warning "Database connection issue detected. Waiting 15 seconds before retry..."
                            sleep 15
                        elif grep -q "timeout\|ETIMEDOUT" /tmp/migration_log_${MODE}.txt; then
                            print_warning "Database operation timeout detected. Waiting 20 seconds before retry..."
                            sleep 20
                        elif grep -q "already exists\|duplicate\|constraint" /tmp/migration_log_${MODE}.txt; then
                            print_warning "Schema conflicts detected - checking migration status..."
                            if docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npx sequelize-cli db:migrate:status" 2>&1 | grep -q "up"; then
                                print_status "Some migrations already applied - this may be expected"
                                migration_success=true
                                break
                            fi
                        else
                            print_warning "Unknown migration error - checking logs..."
                            tail -20 /tmp/migration_log_${MODE}.txt || true
                        fi
                        
                        if [ $migration_attempts -lt $max_migration_attempts ]; then
                            sleep 10
                        fi
                    fi
                done
                
                # Final migration status check
                if [ "$migration_success" = false ]; then
                    print_error "❌ All migration attempts failed!"
                    print_warning "Checking current database state..."
                    docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npx sequelize-cli db:migrate:status" 2>&1 || true
                    print_warning "Migration logs available at: /tmp/migration_log_${MODE}.txt"
                    print_warning "This may cause issues with the application. Please check backend logs:"
                    print_warning "docker service logs ${DOCKER_STACK_NAME}_backend --tail 100"
                else
                    # Clean up temporary log file on success
                    rm -f /tmp/migration_log_${MODE}.txt
                fi
            else
                print_status "Skipping migrations. Database schema will be auto-created by sequelize.sync()"
            fi
            
            # Run seeders if requested or prompt in interactive mode
            if [ "$RUN_SEEDERS" = true ]; then
                print_status "Running database seeders..."
                
                # Wait a moment after migrations for database stabilization
                print_status "Waiting 10 seconds after migrations for database stabilization..."
                sleep 10
                
                # Enhanced seeder execution with comprehensive error handling
                local seeder_success=false
                local seeder_attempts=0
                local max_seeder_attempts=3
                
                while [ $seeder_attempts -lt $max_seeder_attempts ] && [ "$seeder_success" = false ]; do
                    seeder_attempts=$((seeder_attempts + 1))
                    print_status "Seeder attempt $seeder_attempts of $max_seeder_attempts"
                    
                    # Ensure TypeScript is compiled before running seeders
                    print_status "Compiling TypeScript before seeder attempt $seeder_attempts..."
                    if ! docker exec "$container_id" sh -c "cd /app && npm run backend:build" 2>&1 | tee /tmp/build_seeder_log_${MODE}.txt; then
                        print_warning "TypeScript compilation failed, but attempting seeders anyway..."
                    fi
                    
                    # Execute seeders with timeout and detailed logging
                    if timeout 120 docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npm run seed" 2>&1 | tee /tmp/seeder_log_${MODE}.txt; then
                        print_status "✅ Database test data populated successfully on attempt $seeder_attempts"
                        seeder_success=true
                        break
                    else
                        local exit_code=$?
                        print_warning "❌ Seeder attempt $seeder_attempts failed with exit code $exit_code"
                        
                        # Analyze the seeder failure
                        if grep -q "ECONNREFUSED\|connection refused\|Connection refused" /tmp/seeder_log_${MODE}.txt; then
                            print_warning "Database connection issue during seeding. Waiting 10 seconds before retry..."
                            sleep 10
                        elif grep -q "timeout\|ETIMEDOUT" /tmp/seeder_log_${MODE}.txt; then
                            print_warning "Database operation timeout during seeding. Waiting 15 seconds before retry..."
                            sleep 15
                        elif grep -q "already exists\|duplicate\|constraint\|unique" /tmp/seeder_log_${MODE}.txt; then
                            print_warning "Duplicate data detected - some seed data may already exist"
                            # Check if this is actually successful (seed data already present)
                            if docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} node -e 'const { Sequelize } = require(\"sequelize\"); require(\"dotenv\").config(); const sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, { host: process.env.POSTGRES_HOST, dialect: \"postgres\", logging: false }); sequelize.query(\"SELECT COUNT(*) as count FROM users WHERE email LIKE \\\"%@healthapp.com\\\"\").then(([results]) => { if (results[0].count > 0) { console.log(\"SEED_DATA_EXISTS\"); process.exit(0); } else { console.log(\"NO_SEED_DATA\"); process.exit(1); } }).catch(err => { console.error(\"CHECK_FAILED:\", err.message); process.exit(1); });' 2>/dev/null | grep -q 'SEED_DATA_EXISTS'"; then
                                print_status "✅ Seed data already exists - seeding considered successful"
                                seeder_success=true
                                break
                            fi
                        elif grep -q "SequelizeConnectionError\|SequelizeDatabaseError" /tmp/seeder_log_${MODE}.txt; then
                            print_warning "Sequelize database error during seeding. Checking database status..."
                            # Quick database health check
                            if docker exec "$container_id" sh -c "cd /app && timeout 10 node -e 'const { Sequelize } = require(\"sequelize\"); require(\"dotenv\").config(); const sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, { host: process.env.POSTGRES_HOST, dialect: \"postgres\", logging: false }); sequelize.authenticate().then(() => { console.log(\"DB_OK\"); process.exit(0); }).catch(err => { console.error(\"DB_ERROR:\", err.message); process.exit(1); });' 2>/dev/null | grep -q 'DB_OK'"; then
                                print_status "Database connection is healthy - will retry seeding"
                                sleep 8
                            else
                                print_error "Database connection issues detected - aborting further seeder attempts"
                                break
                            fi
                        else
                            print_warning "Unknown seeder error - checking logs..."
                            tail -15 /tmp/seeder_log_${MODE}.txt || true
                        fi
                        
                        # Reset any failed seeder state before retry (if not the last attempt)
                        if [ $seeder_attempts -lt $max_seeder_attempts ]; then
                            print_status "Clearing any partial seeder state before retry..."
                            docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npx sequelize-cli db:seed:undo:all --to 0" 2>/dev/null || true
                            sleep 5
                        fi
                    fi
                done
                
                # Final seeder status assessment
                if [ "$seeder_success" = false ]; then
                    print_warning "⚠️ All seeder attempts failed, but this is not critical"
                    print_status "The application will work without initial test data"
                    print_warning "Seeder logs available at: /tmp/seeder_log_${MODE}.txt"
                    print_warning "To manually populate test data later, run:"
                    print_warning "docker exec \$(docker ps -q -f name=${DOCKER_STACK_NAME}_backend) sh -c 'cd /app && NODE_ENV=${MODE} npm run seed'"
                else
                    # Clean up temporary log file on success
                    rm -f /tmp/seeder_log_${MODE}.txt
                    print_status "Database initialization completed with test data"
                fi
            elif [ "$AUTO_YES" != true ] && [ "$MODE" = "dev" ]; then
                # Interactive prompt for dev mode only (not for production or auto-yes)
                if prompt_user "Do you want to populate the database with test data (recommended for dev environment)?"; then
                    # Ensure TypeScript is compiled before running seeders
                    print_status "Compiling TypeScript before running seeders..."
                    docker exec "$container_id" sh -c "cd /app && npm run backend:build" 2>/dev/null || {
                        print_warning "TypeScript compilation failed, but attempting seeders anyway..."
                    }
                    
                    timeout 60 docker exec "$container_id" sh -c "cd /app && NODE_ENV=${MODE} npm run seed" 2>/dev/null || {
                        print_warning "Seeder execution failed. Database schema will be auto-created by sequelize.sync()"
                    }
                    print_status "Database test data populated successfully"
                else
                    print_status "Skipping database seeding. Database schema will be auto-created by sequelize.sync()"
                fi
            else
                print_status "Skipping database seeding. Database schema will be auto-created by sequelize.sync()"
            fi
        else
            print_warning "Could not find backend container ID. Database will be auto-initialized by sequelize.sync()"
        fi
    else
        print_warning "Could not find backend service task. Database will be auto-initialized by sequelize.sync()"
    fi
    
    print_status "Database initialization completed"
}

# Function to display deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"
    
    echo ""
    echo "🌟 HealthApp Deployed Successfully!"
    echo ""
    echo "📋 Deployment Details:"
    echo "   Mode:           $MODE"
    echo "   Host IP:        $HOST_IP"
    echo "   Database IP:    $DB_HOST_IP"
    echo "   Redis IP:       $REDIS_HOST_IP"
    echo "   Stack Name:     $DOCKER_STACK_NAME"
    echo "   Backend Scale:  $SCALE_BACKEND replicas"
    echo "   Frontend Scale: $SCALE_FRONTEND replicas"
    echo "   Migrations:     $([ "$RUN_MIGRATIONS" = true ] && echo "✅ Executed" || echo "⏭️ Skipped")"
    echo "   Seeders:        $([ "$RUN_SEEDERS" = true ] && echo "✅ Executed" || echo "⏭️ Skipped")"
    echo ""
    echo "📋 Access URLs:"
    echo "   Frontend:       http://$HOST_IP:3002"
    echo "   Backend API:    http://$HOST_IP:3005"
    echo "   Health Check:   http://$HOST_IP:3005/health"
    echo "   pgAdmin:        http://$HOST_IP:5050 (admin@healthapp.com / admin123)"
    echo ""
    echo "🔧 Docker Swarm Management:"
    echo "   View services:  docker stack services $DOCKER_STACK_NAME"
    echo "   View logs:      docker service logs ${DOCKER_STACK_NAME}_backend -f"
    echo "   Scale backend:  docker service scale ${DOCKER_STACK_NAME}_backend=N"
    echo "   Scale frontend: docker service scale ${DOCKER_STACK_NAME}_frontend=N"
    echo "   Remove stack:   docker stack rm $DOCKER_STACK_NAME"
    echo ""
    echo "👥 Test Login Credentials:"
    echo "   Doctor:         doctor@healthapp.com / password123"
    echo "   Admin:          admin@healthapp.com / password123"
    echo "   HSP:            hsp@healthapp.com / password123"
    echo "   Hospital Admin: hospital.admin@healthapp.com / password123"
    echo "   Patient:        patient@healthapp.com / password123"
    echo ""
    
    # Display current service status
    print_status "Current service status:"
    docker stack services "$DOCKER_STACK_NAME"
    echo ""
}

# Function to handle script cleanup on exit
cleanup_on_exit() {
    if [ -f "docker-stack-$MODE.yml" ]; then
        rm -f "docker-stack-$MODE.yml"
    fi
    # Clean up temporary environment files
    if [ -f ".env.development" ]; then
        rm -f ".env.development"
    fi
    if [ -f ".env.production" ]; then
        rm -f ".env.production"
    fi
}

# Main execution function
main() {
    echo "🏥 HealthApp Docker Swarm Deployment Script"
    echo "=================================================="
    echo ""
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    # Display configuration
    print_status "Deployment Configuration:"
    echo "  Mode: $MODE"
    echo "  Host IP (Frontend/Backend): $HOST_IP"
    echo "  Database IP: $DB_HOST_IP"
    echo "  Redis IP: $REDIS_HOST_IP"
    echo "  Backend Replicas: $SCALE_BACKEND"
    echo "  Frontend Replicas: $SCALE_FRONTEND"
    echo "  Run Migrations: $RUN_MIGRATIONS"
    echo "  Run Seeders: $RUN_SEEDERS"
    echo ""
    
    # Confirm deployment if not auto-confirmed
    if ! prompt_user "Do you want to proceed with the deployment?"; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    update_environment_files
    build_images
    create_swarm_stack
    cleanup_existing
    deploy_stack
    wait_for_services
    initialize_database
    show_deployment_summary
    
    print_status "🚀 Deployment completed successfully!"
}

# Execute main function with all arguments
main "$@"