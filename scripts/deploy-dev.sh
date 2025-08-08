#!/bin/bash

# Healthcare Management Platform - Development Deployment Script
# Usage: ./scripts/deploy-dev.sh [HOST_IP] [DB_HOST_IP] [REDIS_HOST_IP]
#
# Examples:
#   ./scripts/deploy-dev.sh                           # Uses localhost for all services  
#   ./scripts/deploy-dev.sh 192.168.0.148             # Uses specified IP for all services
#   ./scripts/deploy-dev.sh 192.168.0.148 192.168.0.148 192.168.0.148  # Custom IPs per service

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.dev.yml"
ENV_FILE="$PROJECT_ROOT/env_files/.env.development"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] $message${NC}"
}

print_message $BLUE "🚀 Healthcare Management Platform - Development Deployment"
print_message $BLUE "=================================================================="

# Parse command line arguments with defaults
HOST_IP=${1:-localhost}
DB_HOST_IP=${2:-$HOST_IP}
REDIS_HOST_IP=${3:-$HOST_IP}

print_message $YELLOW "Configuration:"
print_message $YELLOW "  Frontend URL: http://$HOST_IP:3002"
print_message $YELLOW "  Backend API:  http://$HOST_IP:3005"
print_message $YELLOW "  Database:     $DB_HOST_IP:5432"
print_message $YELLOW "  Redis Cache:  $REDIS_HOST_IP:6379"

# Validate required files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    print_message $RED "❌ Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_message $RED "❌ Environment file not found: $ENV_FILE"
    exit 1
fi

# Export environment variables for docker-compose
export HOST_IP
export DB_HOST_IP  
export REDIS_HOST_IP

print_message $BLUE "🔧 Setting up development environment..."

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Stop any running containers
print_message $YELLOW "🛑 Stopping any existing containers..."
cd "$PROJECT_ROOT"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

# Remove any dangling volumes (optional - comment out if you want to preserve data)
# print_message $YELLOW "🧹 Cleaning up dangling volumes..."
# docker system prune -f --volumes

# Build and start services
print_message $BLUE "🏗️  Building and starting development services..."
docker-compose -f "$COMPOSE_FILE" up --build -d

# Wait for services to be healthy
print_message $YELLOW "⏳ Waiting for services to be healthy..."

# Wait for PostgreSQL
print_message $YELLOW "   Waiting for PostgreSQL..."
timeout 60s bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec -T postgres pg_isready -U healthapp_user -d healthapp_dev; do sleep 2; done' || {
    print_message $RED "❌ PostgreSQL failed to start within 60 seconds"
    docker-compose -f "$COMPOSE_FILE" logs postgres
    exit 1
}

# Wait for Redis
print_message $YELLOW "   Waiting for Redis..."
timeout 30s bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec -T redis redis-cli --raw incr ping; do sleep 2; done' || {
    print_message $RED "❌ Redis failed to start within 30 seconds"
    docker-compose -f "$COMPOSE_FILE" logs redis
    exit 1
}

# Run database migrations
print_message $BLUE "🗄️  Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || {
    print_message $YELLOW "⚠️  Migration failed - this might be expected for first run"
}

# Seed initial data (optional)
print_message $BLUE "🌱 Seeding initial data..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npm run seed || {
    print_message $YELLOW "⚠️  Seeding failed - this might be expected if data already exists"
}

# Wait for backend to be ready
print_message $YELLOW "   Waiting for backend API..."
timeout 60s bash -c 'until curl -f http://'"$HOST_IP"':3005/health >/dev/null 2>&1; do sleep 3; done' || {
    print_message $RED "❌ Backend API failed to respond within 60 seconds"
    docker-compose -f "$COMPOSE_FILE" logs backend
    exit 1
}

# Show running containers
print_message $GREEN "✅ Development environment deployed successfully!"
print_message $GREEN "=================================================================="
print_message $GREEN "Services Status:"
docker-compose -f "$COMPOSE_FILE" ps

print_message $GREEN "🌐 Application URLs:"
print_message $GREEN "   Frontend:        http://$HOST_IP:3002"
print_message $GREEN "   Backend API:     http://$HOST_IP:3005"
print_message $GREEN "   API Health:      http://$HOST_IP:3005/health"
print_message $GREEN "   Database:        $DB_HOST_IP:5432 (healthapp_dev)"
print_message $GREEN "   Redis Cache:     $REDIS_HOST_IP:6379"

print_message $BLUE "📋 Useful Commands:"
print_message $BLUE "   View logs:       docker-compose -f $COMPOSE_FILE logs -f [service]"
print_message $BLUE "   Stop services:   docker-compose -f $COMPOSE_FILE down"
print_message $BLUE "   Restart service: docker-compose -f $COMPOSE_FILE restart [service]"

print_message $GREEN "🎉 Development environment is ready for development!"