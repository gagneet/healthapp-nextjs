#!/bin/bash

# Healthcare Application Development Deployment Script
set -e

echo "🚀 Starting Healthcare Application Development Deployment..."

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

# Copy environment file if it doesn't exist
if [ ! -f .env.development ]; then
    print_warning ".env.development not found. Creating from template..."
    if [ -f env_files/.env.development.example ]; then
        cp env_files/.env.development.example .env.development
        print_warning "⚠️  IMPORTANT: Edit .env.development with your configuration before proceeding!"
        print_warning "   Database passwords, JWT secrets, and other settings need to be configured."
        print_warning "   See SETUP_GUIDE.md for detailed instructions."
        echo ""
        read -p "Press Enter after updating .env.development, or Ctrl+C to cancel..."
    else
        print_error "env_files/.env.development.example template not found!"
        exit 1
    fi
fi

print_header "2. Building Docker images..."

# Build images
docker compose -f docker/docker-compose.dev.yml build --no-cache

print_header "3. Starting services..."

# Start services
docker compose -f docker/docker-compose.dev.yml up -d

print_header "4. Waiting for services to be ready..."

# Wait for database to be ready
print_status "Waiting for PostgreSQL..."
timeout=60
counter=0
while ! docker compose -f docker/docker-compose.dev.yml exec postgres pg_isready -U healthapp_user -d healthapp_dev > /dev/null 2>&1; do
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
while ! docker compose -f docker/docker-compose.dev.yml exec redis redis-cli ping > /dev/null 2>&1; do
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

# Run migrations (optional - app uses sequelize.sync())
# docker compose -f docker/docker-compose.dev.yml exec backend npm run migrate

print_header "6. Database initialization..."

# Database is automatically initialized via sequelize.sync() in the backend service
print_status "Database schema is auto-created by backend service using sequelize.sync()"

print_header "7. Verifying deployment..."

# Check service health
services=("postgres" "redis" "backend" "frontend")
for service in "${services[@]}"; do
    if docker compose -f docker/docker-compose.dev.yml ps $service | grep -q "Up"; then
        print_status "$service is running ✓"
    else
        print_error "$service is not running ✗"
        docker compose -f docker/docker-compose.dev.yml logs $service
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
    docker compose -f docker/docker-compose.dev.yml logs backend
fi

# Test Frontend
print_status "Testing Frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is accessible ✓"
else
    print_warning "Frontend health check failed. Check logs:"
    docker compose -f docker/docker-compose.dev.yml logs frontend
fi

print_header "✅ Development deployment completed!"

echo ""
echo "🌟 Healthcare Application Development Environment is ready!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   pgAdmin:   http://localhost:5050 (admin@healthapp.com / admin123)"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:        docker compose -f docker/docker-compose.dev.yml logs -f [service]"
echo "   Stop services:    docker compose -f docker/docker-compose.dev.yml down"
echo "   Restart service:  docker compose -f docker/docker-compose.dev.yml restart [service]"
echo "   Shell access:     docker compose -f docker/docker-compose.dev.yml exec [service] sh"
echo ""
echo "🐛 Troubleshooting:"
echo "   If services fail to start, check: docker compose -f docker/docker-compose.dev.yml logs"
echo "   To reset everything: ./scripts/reset-dev.sh"
echo ""