#!/bin/bash

# Docker Swarm Initialization Script for HealthApp
set -e

echo "🐳 Initializing Docker Swarm for HealthApp..."

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

# Get the advertise address
ADVERTISE_ADDR=${1:-$(hostname -I | awk '{print $1}')}

print_header "1. Checking Docker installation..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is installed and running ✓"

print_header "2. Initializing Docker Swarm..."

# Check if swarm is already initialized
if docker info | grep -q "Swarm: active"; then
    print_warning "Docker Swarm is already initialized"
    
    # Show current node status
    print_status "Current swarm status:"
    docker node ls
    
    # Ask if user wants to continue
    read -p "Do you want to continue with the current swarm? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Exiting without changes"
        exit 0
    fi
else
    # Initialize swarm
    print_status "Initializing Docker Swarm on $ADVERTISE_ADDR..."
    docker swarm init --advertise-addr $ADVERTISE_ADDR
    
    print_status "Docker Swarm initialized successfully ✓"
fi

print_header "3. Configuring node labels..."

# Get the current node ID
NODE_ID=$(docker info --format "{{.Swarm.NodeID}}")
NODE_HOSTNAME=$(docker node inspect $NODE_ID --format "{{.Description.Hostname}}")

print_status "Configuring labels for node: $NODE_HOSTNAME"

# Add labels to the manager node
labels=(
    "database=true"
    "cache=true"
    "backend=true"
    "frontend=true"
    "monitoring=true"
    "logging=true"
)

for label in "${labels[@]}"; do
    print_status "Adding label: $label"
    docker node update --label-add $label $NODE_ID
done

print_header "4. Creating overlay networks..."

# Create networks if they don't exist
networks=(
    "healthapp-backend"
    "healthapp-frontend"
    "healthapp-monitoring"
)

for network in "${networks[@]}"; do
    if docker network inspect $network > /dev/null 2>&1; then
        print_status "Network $network already exists"
    else
        print_status "Creating network: $network"
        docker network create --driver overlay --attachable $network
    fi
done

print_header "5. Verifying setup..."

print_status "Swarm status:"
docker info | grep -A 5 "Swarm:"

print_status "Available nodes:"
docker node ls

print_status "Available networks:"
docker network ls --filter driver=overlay

print_header "✅ Docker Swarm initialization completed!"

echo ""
echo "🌟 Docker Swarm is ready for HealthApp deployment!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy the worker join command to add more nodes (if needed):"
echo "      docker swarm join-token worker"
echo ""
echo "   2. Add manager nodes (if needed):"
echo "      docker swarm join-token manager"
echo ""
echo "   3. Label additional nodes with appropriate roles:"
echo "      docker node update --label-add database=true <node-name>"
echo "      docker node update --label-add backend=true <node-name>"
echo "      docker node update --label-add frontend=true <node-name>"
echo ""
echo "   4. Deploy HealthApp stack:"
echo "      ./scripts/deploy-prod.sh"
echo ""
echo "🔧 Useful commands:"
echo "   List nodes:        docker node ls"
echo "   Inspect node:      docker node inspect <node-name>"
echo "   Update node:       docker node update <node-name>"
echo "   Remove node:       docker node rm <node-name>"
echo "   Leave swarm:       docker swarm leave --force"
echo ""
echo "📊 Node labels configured:"
for label in "${labels[@]}"; do
    echo "   ✓ $label"
done
echo ""

# Show join tokens
echo "🔑 Join tokens:"
echo ""
echo "To add a worker node to this swarm, run:"
docker swarm join-token worker
echo ""
echo "To add a manager node to this swarm, run:"
docker swarm join-token manager
echo ""