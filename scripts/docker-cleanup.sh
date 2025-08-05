#!/bin/bash

# HealthApp Docker Cleanup Script
# Usage: ./scripts/docker-cleanup.sh [--full] [--volumes] [--images]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
FULL_CLEANUP=false
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            FULL_CLEANUP=true
            REMOVE_VOLUMES=true
            REMOVE_IMAGES=true
            shift
            ;;
        --volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        --images)
            REMOVE_IMAGES=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--full] [--volumes] [--images]"
            echo ""
            echo "Options:"
            echo "  --full      Complete cleanup (containers, volumes, images, networks)"
            echo "  --volumes   Remove persistent volumes (WARNING: This deletes all data)"
            echo "  --images    Remove HealthApp Docker images"
            echo "  --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Stop containers only"
            echo "  $0 --images           # Stop containers and remove images"
            echo "  $0 --volumes          # Stop containers and remove volumes (data loss!)"
            echo "  $0 --full             # Complete cleanup (WARNING: All data lost!)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

log_info "Starting HealthApp Docker cleanup..."

# Find all possible environment files
ENV_FILES=(".env.docker.development" ".env.docker.production" ".env.docker.staging")

# Stop all HealthApp containers
for env_file in "${ENV_FILES[@]}"; do
    if [[ -f "$env_file" ]]; then
        log_info "Stopping containers for $env_file..."
        docker-compose --env-file "$env_file" -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    fi
done

# Stop any remaining HealthApp containers by name pattern
log_info "Stopping any remaining HealthApp containers..."
docker ps -q --filter "name=healthapp-*" | xargs -r docker stop
docker ps -a -q --filter "name=healthapp-*" | xargs -r docker rm

# Remove volumes if requested
if [[ "$REMOVE_VOLUMES" == true ]]; then
    log_warn "Removing persistent volumes (THIS WILL DELETE ALL DATA)..."
    read -p "Are you sure you want to remove all volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove project-specific volumes
        for env_file in "${ENV_FILES[@]}"; do
            if [[ -f "$env_file" ]]; then
                COMPOSE_PROJECT_NAME=$(grep COMPOSE_PROJECT_NAME "$env_file" | cut -d'=' -f2)
                if [[ -n "$COMPOSE_PROJECT_NAME" ]]; then
                    docker volume ls -q --filter "name=${COMPOSE_PROJECT_NAME}_*" | xargs -r docker volume rm
                fi
            fi
        done
        
        # Remove common HealthApp volumes
        docker volume ls -q --filter "name=*postgres_data*" | xargs -r docker volume rm 2>/dev/null || true
        docker volume ls -q --filter "name=*redis_data*" | xargs -r docker volume rm 2>/dev/null || true
        docker volume ls -q --filter "name=*backend_logs*" | xargs -r docker volume rm 2>/dev/null || true
        docker volume ls -q --filter "name=*pgadmin_data*" | xargs -r docker volume rm 2>/dev/null || true
        
        log_info "Volumes removed successfully"
    else
        log_info "Volume removal cancelled"
    fi
fi

# Remove images if requested
if [[ "$REMOVE_IMAGES" == true ]]; then
    log_info "Removing HealthApp Docker images..."
    
    # Remove HealthApp-specific images
    docker images -q "healthapp-*" | xargs -r docker rmi -f 2>/dev/null || true
    docker images -q "*healthapp*" | xargs -r docker rmi -f 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f
    
    log_info "Images removed successfully"
fi

# Clean up networks
log_info "Cleaning up networks..."
docker network ls -q --filter "name=*healthapp*" | xargs -r docker network rm 2>/dev/null || true

# General Docker cleanup
if [[ "$FULL_CLEANUP" == true ]]; then
    log_info "Performing full Docker system cleanup..."
    docker system prune -f --volumes
fi

log_info "Docker cleanup completed!"

# Show remaining resources
log_info "Remaining Docker resources:"
echo "Containers:"
docker ps -a --filter "name=healthapp"
echo ""
echo "Images:"
docker images | grep healthapp || echo "No HealthApp images found"
echo ""
echo "Volumes:"
docker volume ls | grep -E "(healthapp|postgres|redis)" || echo "No HealthApp volumes found"
echo ""
echo "Networks:"
docker network ls | grep healthapp || echo "No HealthApp networks found"