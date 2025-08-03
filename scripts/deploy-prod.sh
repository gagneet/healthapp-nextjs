#!/bin/bash

# Healthcare Application Production Deployment Script
set -e

echo "🚀 Starting Healthcare Application Production Deployment..."

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

# Default values
VERSION=${VERSION:-latest}
ENVIRONMENT=${ENVIRONMENT:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
SKIP_BUILD=${SKIP_BUILD:-false}
SKIP_MIGRATION=${SKIP_MIGRATION:-false}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -v, --version VERSION    Docker image version (default: latest)"
            echo "  -e, --environment ENV    Environment name (default: production)"
            echo "  -r, --registry REGISTRY  Docker registry URL"
            echo "  --skip-build            Skip building Docker images"
            echo "  --skip-migration        Skip database migrations"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Deployment Configuration:"
print_status "  Version: $VERSION"
print_status "  Environment: $ENVIRONMENT"
print_status "  Registry: ${DOCKER_REGISTRY:-'local'}"
print_status "  Skip Build: $SKIP_BUILD"
print_status "  Skip Migration: $SKIP_MIGRATION"

# Check prerequisites
print_header "1. Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Swarm is initialized
if ! docker node ls > /dev/null 2>&1; then
    print_error "Docker Swarm is not initialized. Run 'docker swarm init' first."
    exit 1
fi

# Check if environment file exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found. Please create it from .env.production.example"
    exit 1
fi

# Source environment variables
set -a
source .env.production
set +a

print_header "2. Preparing environment..."

# Create necessary directories on all nodes
docker node ls --format "table {{.Hostname}}" | tail -n +2 | while read node; do
    print_status "Creating directories on node: $node"
    docker node update --label-add database=true $node 2>/dev/null || true
    docker node update --label-add cache=true $node 2>/dev/null || true
    docker node update --label-add backend=true $node 2>/dev/null || true
    docker node update --label-add frontend=true $node 2>/dev/null || true
    docker node update --label-add monitoring=true $node 2>/dev/null || true
    docker node update --label-add logging=true $node 2>/dev/null || true
done

# Create Docker secrets
print_status "Creating Docker secrets..."
secrets=(
    "db_password:$DB_PASSWORD"
    "jwt_secret:$JWT_SECRET"
    "redis_password:$REDIS_PASSWORD"
    "aws_access_key:$AWS_ACCESS_KEY_ID"
    "aws_secret_key:$AWS_SECRET_ACCESS_KEY"
    "grafana_password:$GRAFANA_PASSWORD"
)

for secret in "${secrets[@]}"; do
    secret_name=$(echo $secret | cut -d: -f1)
    secret_value=$(echo $secret | cut -d: -f2-)
    
    if docker secret inspect $secret_name > /dev/null 2>&1; then
        print_status "Secret $secret_name already exists, updating..."
        docker secret rm $secret_name
    fi
    echo "$secret_value" | docker secret create $secret_name -
    print_status "Created secret: $secret_name"
done

# Create SSL certificates secret (if files exist)
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    print_status "Creating SSL certificate secrets..."
    docker secret create ssl_cert ssl/cert.pem 2>/dev/null || docker secret rm ssl_cert && docker secret create ssl_cert ssl/cert.pem
    docker secret create ssl_key ssl/key.pem 2>/dev/null || docker secret rm ssl_key && docker secret create ssl_key ssl/key.pem
else
    print_warning "SSL certificate files not found. Please add ssl/cert.pem and ssl/key.pem"
fi

# Create Docker configs
print_status "Creating Docker configs..."
configs=(
    "nginx_config:nginx/nginx.conf"
    "prometheus_config:monitoring/prometheus.yml"
)

for config in "${configs[@]}"; do
    config_name=$(echo $config | cut -d: -f1)
    config_file=$(echo $config | cut -d: -f2)
    
    if [ -f "$config_file" ]; then
        if docker config inspect $config_name > /dev/null 2>&1; then
            print_status "Config $config_name already exists, updating..."
            docker config rm $config_name
        fi
        docker config create $config_name $config_file
        print_status "Created config: $config_name"
    else
        print_warning "Config file not found: $config_file"
    fi
done

print_header "3. Building and pushing Docker images..."

if [ "$SKIP_BUILD" = false ]; then
    # Build images
    images=("backend" "frontend")
    
    for image in "${images[@]}"; do
        image_tag="healthapp/${image}:${VERSION}"
        
        if [ "$image" = "backend" ]; then
            dockerfile="Dockerfile.backend"
        else
            dockerfile="Dockerfile"
        fi
        
        print_status "Building $image_tag..."
        docker build -f $dockerfile -t $image_tag .
        
        # Tag for registry if specified
        if [ -n "$DOCKER_REGISTRY" ]; then
            registry_tag="${DOCKER_REGISTRY}/healthapp/${image}:${VERSION}"
            docker tag $image_tag $registry_tag
            print_status "Pushing to registry: $registry_tag"
            docker push $registry_tag
        fi
    done
else
    print_status "Skipping Docker image build (--skip-build specified)"
fi

print_header "4. Deploying stack..."

# Deploy the stack
export VERSION=$VERSION
docker stack deploy -c docker-stack.yml healthapp

print_header "5. Waiting for services to be ready..."

# Wait for services to be deployed
print_status "Waiting for stack deployment..."
sleep 30

# Check service status
print_status "Checking service status..."
docker stack services healthapp

print_header "6. Running database migrations..."

if [ "$SKIP_MIGRATION" = false ]; then
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=120
    counter=0
    while [ $counter -lt $timeout ]; do
        if docker service ps healthapp_postgres --format "{{.CurrentState}}" | grep -q "Running"; then
            break
        fi
        sleep 5
        counter=$((counter + 5))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_error "Database service failed to start within $timeout seconds"
        exit 1
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    sleep 10
    docker service ls --filter name=healthapp_backend --format "{{.ID}}" | head -1 | xargs -I {} docker service update --force {}
    
    # Wait a bit more for migration to complete
    sleep 30
else
    print_status "Skipping database migrations (--skip-migration specified)"
fi

print_header "7. Verifying deployment..."

# Check service health
services=("healthapp_postgres" "healthapp_redis" "healthapp_backend" "healthapp_frontend" "healthapp_nginx")
for service in "${services[@]}"; do
    replicas=$(docker service ps $service --format "{{.CurrentState}}" | grep -c "Running" || echo "0")
    desired=$(docker service ls --filter name=$service --format "{{.Replicas}}" | cut -d'/' -f2)
    
    if [ "$replicas" -eq "$desired" ] && [ "$replicas" -gt 0 ]; then
        print_status "$service: $replicas/$desired replicas running ✓"
    else
        print_warning "$service: $replicas/$desired replicas running ⚠️"
        docker service ps $service --no-trunc
    fi
done

# Test application endpoints
print_status "Testing application endpoints..."
sleep 10

endpoints=(
    "https://api.healthcareapp.com/api/health:Backend API"
    "https://app.healthcareapp.com:Frontend"
)

for endpoint in "${endpoints[@]}"; do
    url=$(echo $endpoint | cut -d: -f1-2)
    name=$(echo $endpoint | cut -d: -f3)
    
    if curl -f -s -k --max-time 10 "$url" > /dev/null 2>&1; then
        print_status "$name is accessible ✓"
    else
        print_warning "$name health check failed ⚠️"
    fi
done

print_header "✅ Production deployment completed!"

echo ""
echo "🌟 Healthcare Application Production Environment is ready!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend:    https://app.healthcareapp.com"
echo "   Backend API: https://api.healthcareapp.com"
echo "   Monitoring:  http://monitoring.healthcareapp.com (admin / $GRAFANA_PASSWORD)"
echo ""
echo "🔧 Management commands:"
echo "   View services:    docker stack services healthapp"
echo "   View service logs: docker service logs healthapp_[service_name] -f"
echo "   Scale service:    docker service scale healthapp_[service_name]=N"
echo "   Update service:   docker service update healthapp_[service_name]"
echo "   Remove stack:     docker stack rm healthapp"
echo ""
echo "📊 Monitoring:"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana:    http://monitoring.healthcareapp.com"
echo ""
echo "🔍 Troubleshooting:"
echo "   Check service status: docker stack ps healthapp"
echo "   View service logs:    docker service logs healthapp_[service] --tail 100"
echo "   Service not starting: docker service ps healthapp_[service] --no-trunc"
echo ""