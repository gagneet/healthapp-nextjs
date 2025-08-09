#!/bin/bash

# dev-local.sh - Local development with docker-compose
# Usage: ./scripts/dev-local.sh [COMMAND] [OPTIONS]
# Examples:
#   ./scripts/dev-local.sh start --migrate --seed
#   ./scripts/dev-local.sh start --ip-address 192.168.1.100 --auto-yes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker/docker-compose.local.yml"
PROJECT_NAME="healthapp-local"
ENV_FILE="env_files/.env.local"

# Default values
AUTO_YES=false
RUN_MIGRATE=false
RUN_SEED=false
IP_ADDRESS="localhost"

# Parse command line arguments
parse_args() {
    COMMAND=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|logs|status|build|clean|migrate|seed|shell)
                COMMAND="$1"
                shift
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
            --ip-address)
                IP_ADDRESS="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$COMMAND" ]; then
                    COMMAND="$1"
                else
                    # Store additional arguments (like service names for logs)
                    EXTRA_ARGS="$EXTRA_ARGS $1"
                fi
                shift
                ;;
        esac
    done
}

# Help function
show_help() {
    echo "🏥 HealthApp Local Development Script"
    echo "====================================="
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services for local development"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs from all services"
    echo "  status    Show status of all services"
    echo "  build     Build/rebuild images"
    echo "  clean     Stop and remove all containers, networks, and volumes"
    echo "  migrate   Run database migrations"
    echo "  seed      Run database seeders"
    echo "  shell     Open shell in backend container"
    echo ""
    echo "Options:"
    echo "  --migrate         Run migrations after starting services"
    echo "  --seed            Run seeders after starting services"
    echo "  --auto-yes        Skip confirmation prompts"
    echo "  --ip-address IP   Use specific IP address (default: localhost)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                                    # Start all services"
    echo "  $0 start --migrate --seed                   # Start with migrations and seeders"
    echo "  $0 start --ip-address 192.168.1.100        # Start with custom IP"
    echo "  $0 logs backend                             # Show backend logs only"
    echo "  $0 clean --auto-yes                         # Clean without confirmation"
    echo ""
}

# Check if Docker and docker-compose are available
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} docker-compose is not installed or not in PATH"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker daemon is not running"
        exit 1
    fi
}

# Start services
start_services() {
    echo -e "${BLUE}[INFO]${NC} Starting HealthApp local development environment..."
    echo -e "${BLUE}[INFO]${NC} Using IP: $IP_ADDRESS, Frontend: 3002, Backend: 3005, PostgreSQL: 5432"
    
    # Export environment variables for docker-compose
    export HOST_IP=$IP_ADDRESS
    export BACKEND_URL=http://$IP_ADDRESS:3005
    export FRONTEND_URL=http://$IP_ADDRESS:3002
    
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    
    echo -e "${GREEN}[SUCCESS]${NC} Services started successfully!"
    echo -e "${BLUE}[INFO]${NC} Frontend: http://$IP_ADDRESS:3002"
    echo -e "${BLUE}[INFO]${NC} Backend API: http://$IP_ADDRESS:3005"
    echo -e "${BLUE}[INFO]${NC} PgAdmin: http://$IP_ADDRESS:5050"
    echo ""
    
    # Run migrations if requested
    if [ "$RUN_MIGRATE" = true ]; then
        echo -e "${YELLOW}[INFO]${NC} Running database migrations..."
        sleep 5  # Wait for services to be ready
        run_migrations
    fi
    
    # Run seeders if requested
    if [ "$RUN_SEED" = true ]; then
        echo -e "${YELLOW}[INFO]${NC} Running database seeders..."
        if [ "$RUN_MIGRATE" = false ]; then
            sleep 5  # Wait for services to be ready if migrations weren't run
        fi
        run_seeders
    fi
    
    echo -e "${YELLOW}[NEXT]${NC} Run './scripts/dev-local.sh logs' to see logs"
    if [ "$RUN_MIGRATE" = false ]; then
        echo -e "${YELLOW}[NEXT]${NC} Run './scripts/dev-local.sh migrate' to set up database"
    fi
}

# Stop services
stop_services() {
    echo -e "${BLUE}[INFO]${NC} Stopping HealthApp local development environment..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    echo -e "${GREEN}[SUCCESS]${NC} Services stopped successfully!"
}

# Restart services
restart_services() {
    echo -e "${BLUE}[INFO]${NC} Restarting HealthApp local development environment..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
    echo -e "${GREEN}[SUCCESS]${NC} Services restarted successfully!"
}

# Show logs
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    else
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f $service
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}[INFO]${NC} HealthApp Local Development Status:"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
}

# Build images
build_images() {
    echo -e "${BLUE}[INFO]${NC} Building/rebuilding Docker images..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    echo -e "${GREEN}[SUCCESS]${NC} Images built successfully!"
}

# Clean up
clean_all() {
    echo -e "${YELLOW}[WARNING]${NC} This will remove all containers, networks, and volumes!"
    
    if [ "$AUTO_YES" = false ]; then
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}[INFO]${NC} Cleanup cancelled"
            return
        fi
    else
        echo -e "${YELLOW}[INFO]${NC} Auto-yes enabled, proceeding with cleanup..."
    fi
    
    echo -e "${BLUE}[INFO]${NC} Cleaning up..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}[SUCCESS]${NC} Cleanup completed!"
}

# Run migrations
run_migrations() {
    echo -e "${BLUE}[INFO]${NC} Running database migrations..."
    
    # First, ensure TypeScript migrations are compiled for Sequelize CLI
    echo -e "${BLUE}[INFO]${NC} Compiling TypeScript migrations for Sequelize CLI..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec backend npm run migrations:build
    
    # Then run migrations
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec backend npm run migrate
    echo -e "${GREEN}[SUCCESS]${NC} Migrations completed!"
}

# Run seeders
run_seeders() {
    echo -e "${BLUE}[INFO]${NC} Running database seeders..."
    
    # Ensure TypeScript migrations/seeders are compiled (in case seeders are run independently)
    echo -e "${BLUE}[INFO]${NC} Ensuring TypeScript migrations/seeders are compiled..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec backend npm run migrations:build
    
    # Then run seeders
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec backend npm run seed
    echo -e "${GREEN}[SUCCESS]${NC} Seeders completed!"
}

# Open shell
open_shell() {
    local service=${1:-"backend"}
    echo -e "${BLUE}[INFO]${NC} Opening shell in $service container..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec $service /bin/bash
}

# Main script logic
main() {
    # Parse command line arguments
    parse_args "$@"
    
    # Check if no command was specified
    if [ -z "$COMMAND" ]; then
        echo -e "${YELLOW}[WARNING]${NC} No command specified"
        show_help
        exit 1
    fi
    
    check_prerequisites
    
    case $COMMAND in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs $EXTRA_ARGS
            ;;
        status)
            show_status
            ;;
        build)
            build_images
            ;;
        clean)
            clean_all
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            run_seeders
            ;;
        shell)
            open_shell $EXTRA_ARGS
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"