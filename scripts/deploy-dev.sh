#!/bin/bash

# Healthcare Application Development Deployment Script (Legacy)
# DEPRECATED: Please use ./scripts/deploy.sh development instead
# This script is maintained for backward compatibility

set -e

echo "⚠️  DEPRECATED: This script is deprecated. Please use:"
echo "   ./scripts/deploy.sh development --build --migrate --seed"
echo ""
echo "🚀 Starting Healthcare Application Development Deployment (Legacy Mode)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if new unified script exists and recommend it
if [ -f "./scripts/deploy.sh" ]; then
    print_warning "🔄 New unified deployment script is available!"
    print_warning "   For better experience, use: ./scripts/deploy.sh development --build --migrate --seed"
    echo ""
    read -p "Do you want to use the new script instead? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Switching to new deployment script..."
        exec ./scripts/deploy.sh development --build --migrate --seed
    fi
    print_warning "Continuing with legacy script..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

print_header "1. Preparing environment..."

# Create necessary directories
mkdir -p logs/{backend,nginx} data/{postgres,redis,grafana,prometheus}

# Use new environment file structure
if [ ! -f .env.docker.development ]; then
    print_warning ".env.docker.development not found. Creating from template..."
    if [ -f env_files/.env.development.example ]; then
        cp env_files/.env.development.example .env.docker.development
        print_warning "⚠️  IMPORTANT: Edit .env.docker.development with your configuration before proceeding!"
        print_warning "   Database passwords, JWT secrets, and other settings need to be configured."
        print_warning "   See DOCKER_README.md for detailed instructions."
        echo ""
        read -p "Press Enter after updating .env.docker.development, or Ctrl+C to cancel..."
    else
        print_error "env_files/.env.development.example template not found!"
        exit 1
    fi
fi

print_header "2. Building Docker images..."

# Use new unified docker-compose file
docker-compose --env-file .env.docker.development build --no-cache

print_header "3. Starting services..."

# Start services with pgAdmin for development
docker-compose --env-file .env.docker.development --profile tools up -d

print_header "4. Waiting for services to be ready..."

# Wait for database to be ready
print_status "Waiting for PostgreSQL..."
timeout=60
counter=0
while ! docker-compose --env-file .env.docker.development exec postgres pg_isready -U healthapp_user -d healthapp_dev > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "PostgreSQL failed to start within $timeout seconds"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

# Wait for Redis to be ready
print_status "Waiting for Redis..."
timeout=30
counter=0
while ! docker-compose --env-file .env.docker.development exec redis redis-cli ping > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Redis failed to start within $timeout seconds"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

print_header "5. Running database migrations..."

# Run migrations
print_status "Running database migrations..."
docker-compose --env-file .env.docker.development exec backend npm run migrate || {
    print_warning "Migration failed, but continuing..."
}

print_header "6. Database initialization..."

# Run seeders if requested
read -p "Do you want to populate the database with test data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running database seeders..."
    docker-compose --env-file .env.docker.development exec backend npm run seed || {
        print_warning "Seeder execution failed, but continuing..."
    }
fi

print_header "7. Verifying deployment..."

# Check service health
services=("postgres" "redis" "backend" "frontend")
for service in "${services[@]}"; do
    if docker-compose --env-file .env.docker.development ps $service | grep -q "Up"; then
        print_status "$service is running ✓"
    else
        print_error "$service is not running ✗"
        docker-compose --env-file .env.docker.development logs $service
        exit 1
    fi
done

# Test API endpoint
print_status "Testing API endpoint..."
sleep 5
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend API is healthy ✓"
else
    print_warning "Backend API health check failed. Check logs:"
    docker-compose --env-file .env.docker.development logs backend
fi

# Test Frontend
print_status "Testing Frontend..."
if curl -f http://localhost:3002 > /dev/null 2>&1; then
    print_status "Frontend is accessible ✓"
else
    print_warning "Frontend health check failed. Check logs:"
    docker-compose --env-file .env.docker.development logs frontend
fi

print_header "✅ Development deployment completed!"

echo ""
echo "🌟 Healthcare Application Development Environment is ready!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend:  http://localhost:3002"
echo "   Backend:   http://localhost:3001"
echo "   pgAdmin:   http://localhost:5050 (admin@healthapp.com / admin123)"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:        docker-compose --env-file .env.docker.development logs -f [service]"
echo "   Stop services:    docker-compose --env-file .env.docker.development down"
echo "   Restart service:  docker-compose --env-file .env.docker.development restart [service]"
echo "   Shell access:     docker-compose --env-file .env.docker.development exec [service] sh"
echo ""
echo "🆕 New deployment script:"
echo "   Use: ./scripts/deploy.sh development --build --migrate --seed"
echo "   See: DOCKER_README.md for more information"
echo ""
echo "🐛 Troubleshooting:"
echo "   Check logs: docker-compose --env-file .env.docker.development logs"
echo "   Clean up:   ./scripts/docker-cleanup.sh"
echo ""