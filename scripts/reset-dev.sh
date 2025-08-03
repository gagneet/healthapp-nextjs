#!/bin/bash

# Reset Development Environment Script
set -e

echo "🔄 Resetting Healthcare Application Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Confirmation prompt
print_warning "This will destroy all development data including:"
print_warning "  - All containers and images"
print_warning "  - Database data"
print_warning "  - Redis data"
print_warning "  - Application logs"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Operation cancelled"
    exit 0
fi

print_status "Stopping all services..."
docker-compose -f docker/docker-compose.dev.yml down

print_status "Removing volumes..."
docker-compose -f docker/docker-compose.dev.yml down -v

print_status "Removing orphaned containers..."
docker-compose -f docker/docker-compose.dev.yml down --remove-orphans

print_status "Pruning unused images..."
docker image prune -f

print_status "Pruning unused networks..."
docker network prune -f

print_status "Removing build cache..."
docker builder prune -f

print_status "Cleaning up log directories..."
rm -rf logs/*

print_status "✅ Development environment reset complete!"
echo ""
echo "To start fresh, run: ./scripts/deploy-dev.sh"