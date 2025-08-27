#!/bin/bash

# troubleshoot.sh - HealthApp Deployment Troubleshooting Script
# Usage: ./scripts/troubleshoot.sh [ENVIRONMENT]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ENVIRONMENT="${1:-test}"
STACK_NAME="healthapp-$ENVIRONMENT"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}=== $1 ===${NC}"
}

check_swarm_status() {
    log_section "Docker Swarm Status"
    
    if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
        log_success "Docker Swarm is active"
        docker node ls
    else
        log_error "Docker Swarm is not active"
        return 1
    fi
}

check_stack_status() {
    log_section "Stack Status: $STACK_NAME"
    
    if docker stack ls --format "table {{.Name}}" | grep -q "^$STACK_NAME$"; then
        log_info "Stack exists: $STACK_NAME"
        
        echo -e "\n${BLUE}Services:${NC}"
        docker stack services "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Mode}}\t{{.Replicas}}\t{{.Image}}\t{{.Ports}}"
        
        echo -e "\n${BLUE}Tasks:${NC}"
        docker stack ps "$STACK_NAME" --format "table {{.ID}}\t{{.Name}}\t{{.Image}}\t{{.Node}}\t{{.DesiredState}}\t{{.CurrentState}}\t{{.Error}}" --no-trunc
    else
        log_error "Stack does not exist: $STACK_NAME"
        return 1
    fi
}

check_postgres_detailed() {
    log_section "PostgreSQL Detailed Check"
    
    local postgres_service="${STACK_NAME}_postgres"
    
    # Check if service exists
    if ! docker service ls --filter "name=$postgres_service" --format "{{.Name}}" | grep -q "^$postgres_service$"; then
        log_error "PostgreSQL service not found: $postgres_service"
        return 1
    fi
    
    # Get service logs
    echo -e "\n${BLUE}PostgreSQL Service Logs (last 30 lines):${NC}"
    docker service logs --tail 30 "$postgres_service" 2>/dev/null || log_warning "Could not retrieve logs"
    
    # Check running containers
    local postgres_containers=$(docker ps --filter "name=$postgres_service" --format "{{.ID}}")
    
    if [ -z "$postgres_containers" ]; then
        log_warning "No running PostgreSQL containers found"
        
        # Check failed tasks
        echo -e "\n${BLUE}Failed PostgreSQL Tasks:${NC}"
        docker service ps "$postgres_service" --filter "desired-state=running" --no-trunc
    else
        log_success "PostgreSQL container(s) running: $postgres_containers"
        
        for container_id in $postgres_containers; do
            echo -e "\n${BLUE}Container $container_id Environment:${NC}"
            docker exec "$container_id" env | grep POSTGRES || log_warning "Could not get environment"
            
            echo -e "\n${BLUE}Container $container_id PostgreSQL Status:${NC}"
            docker exec "$container_id" pg_isready -U healthapp_user -d healthapp_test || log_warning "pg_isready failed"
            
            echo -e "\n${BLUE}Container $container_id PostgreSQL Processes:${NC}"
            docker exec "$container_id" ps aux | grep postgres || log_warning "Could not get processes"
        done
    fi
}

check_redis_detailed() {
    log_section "Redis Detailed Check"
    
    local redis_service="${STACK_NAME}_redis"
    
    # Check if service exists
    if ! docker service ls --filter "name=$redis_service" --format "{{.Name}}" | grep -q "^$redis_service$"; then
        log_error "Redis service not found: $redis_service"
        return 1
    fi
    
    # Get service logs
    echo -e "\n${BLUE}Redis Service Logs (last 20 lines):${NC}"
    docker service logs --tail 20 "$redis_service" 2>/dev/null || log_warning "Could not retrieve logs"
    
    # Check running containers
    local redis_containers=$(docker ps --filter "name=$redis_service" --format "{{.ID}}")
    
    if [ -z "$redis_containers" ]; then
        log_warning "No running Redis containers found"
    else
        log_success "Redis container(s) running: $redis_containers"
        
        for container_id in $redis_containers; do
            echo -e "\n${BLUE}Container $container_id Redis Status:${NC}"
            docker exec "$container_id" redis-cli --no-auth-warning -a "secure_test_redis" ping || log_warning "Redis ping failed"
        done
    fi
}

check_app_detailed() {
    log_section "Application Detailed Check"
    
    local app_service="${STACK_NAME}_app"
    
    # Check if service exists
    if ! docker service ls --filter "name=$app_service" --format "{{.Name}}" | grep -q "^$app_service$"; then
        log_error "App service not found: $app_service"
        return 1
    fi
    
    # Get service logs
    echo -e "\n${BLUE}App Service Logs (last 30 lines):${NC}"
    docker service logs --tail 30 "$app_service" 2>/dev/null || log_warning "Could not retrieve logs"
    
    # Check running containers
    local app_containers=$(docker ps --filter "name=$app_service" --format "{{.ID}}")
    
    if [ -z "$app_containers" ]; then
        log_warning "No running App containers found"
    else
        log_success "App container(s) running: $app_containers"
        
        for container_id in $app_containers; do
            echo -e "\n${BLUE}Container $container_id Health Check:${NC}"
            docker exec "$container_id" curl -f -s http://localhost:3002/api/health || log_warning "Health endpoint failed"
            
            echo -e "\n${BLUE}Container $container_id Environment (DB related):${NC}"
            docker exec "$container_id" env | grep -E "(DATABASE|POSTGRES|NEXTAUTH)" || log_warning "Could not get environment"
        done
    fi
}

check_networking() {
    log_section "Network Connectivity Check"
    
    # Check if healthapp network exists
    local network_name="healthapp_healthapp_network"
    if docker network ls --filter "name=$network_name" --format "{{.Name}}" | grep -q "$network_name"; then
        log_success "Network exists: $network_name"
        
        echo -e "\n${BLUE}Network Details:${NC}"
        docker network inspect "$network_name" --format "{{json .}}" | jq '.' 2>/dev/null || docker network inspect "$network_name"
    else
        log_error "Network not found: $network_name"
        
        echo -e "\n${BLUE}Available networks:${NC}"
        docker network ls
    fi
}

check_volumes() {
    log_section "Volume Check"
    
    echo -e "\n${BLUE}Volumes for $STACK_NAME:${NC}"
    docker volume ls --filter "name=${STACK_NAME}" --format "table {{.Driver}}\t{{.Name}}"
    
    # Check volume contents
    local postgres_volume="${STACK_NAME}_postgres_test_data"
    if docker volume ls --filter "name=$postgres_volume" --format "{{.Name}}" | grep -q "$postgres_volume"; then
        log_success "PostgreSQL volume exists: $postgres_volume"
        
        # Try to inspect volume content
        echo -e "\n${BLUE}PostgreSQL Volume Content:${NC}"
        docker run --rm -v "$postgres_volume:/data" alpine ls -la /data 2>/dev/null || log_warning "Could not inspect volume content"
    else
        log_warning "PostgreSQL volume not found: $postgres_volume"
    fi
}

check_resources() {
    log_section "System Resources"
    
    echo -e "\n${BLUE}Docker System Info:${NC}"
    docker system df
    
    echo -e "\n${BLUE}Memory Usage:${NC}"
    free -h
    
    echo -e "\n${BLUE}Disk Usage:${NC}"
    df -h /var/lib/docker 2>/dev/null || df -h /
}

fix_common_issues() {
    log_section "Potential Fixes"
    
    echo -e "${YELLOW}Common solutions to try:${NC}"
    echo "1. Clean up and redeploy:"
    echo "   ./scripts/deploy.sh $ENVIRONMENT stop"
    echo "   docker system prune -f"
    echo "   ./scripts/deploy.sh $ENVIRONMENT deploy --cleanup --migrate --seed --auto-yes"
    echo
    echo "2. Check environment variables in .env files"
    echo "3. Ensure Docker has enough memory (at least 4GB recommended)"
    echo "4. Check port conflicts (5432, 6379, 3002, 5050)"
    echo
    echo "5. Manual PostgreSQL test:"
    echo "   docker run --rm -it -e POSTGRES_DB=healthapp_test -e POSTGRES_USER=healthapp_user -e POSTGRES_PASSWORD=pg_password postgres:17-alpine"
    echo
    echo "6. View real-time logs:"
    echo "   docker service logs -f ${STACK_NAME}_postgres"
    echo "   docker service logs -f ${STACK_NAME}_app"
}

main() {
    echo -e "${CYAN}HealthApp Deployment Troubleshooting${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Stack: $STACK_NAME"
    echo "====================================="
    
    check_swarm_status
    check_stack_status
    check_postgres_detailed
    check_redis_detailed
    check_app_detailed
    check_networking
    check_volumes
    check_resources
    fix_common_issues
    
    echo -e "\n${GREEN}Troubleshooting complete!${NC}"
}

main "$@"
