#!/bin/bash

# Healthcare Management Platform - Build Test Script
# Tests the Docker build process for development and production

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] $message${NC}"
}

print_message $BLUE "🧪 Healthcare Management Platform - Build Test"
print_message $BLUE "=================================================="

# Test 1: Development Build
print_message $YELLOW "🏗️  Testing Development Docker Build..."
if docker build -f docker/Dockerfile.backend --target development -t healthapp-backend:dev-test . >/dev/null 2>&1; then
    print_message $GREEN "✅ Development build: SUCCESS"
else
    print_message $RED "❌ Development build: FAILED"
    print_message $YELLOW "Running with verbose output for debugging..."
    docker build -f docker/Dockerfile.backend --target development -t healthapp-backend:dev-test . 2>&1 | tail -20
    exit 1
fi

# Test 2: TypeScript Compilation (Builder Stage)
print_message $YELLOW "🔧 Testing TypeScript Compilation..."
if docker build -f docker/Dockerfile.backend --target builder -t healthapp-backend:builder-test . >/dev/null 2>&1; then
    print_message $GREEN "✅ TypeScript compilation: SUCCESS"
else
    print_message $RED "❌ TypeScript compilation: FAILED"
    print_message $YELLOW "Running with verbose output for debugging..."
    docker build -f docker/Dockerfile.backend --target builder -t healthapp-backend:builder-test . 2>&1 | tail -30
    exit 1
fi

# Test 3: Production Build
print_message $YELLOW "🚀 Testing Production Docker Build..."
if docker build -f docker/Dockerfile.backend --target production -t healthapp-backend:prod-test . >/dev/null 2>&1; then
    print_message $GREEN "✅ Production build: SUCCESS"
else
    print_message $RED "❌ Production build: FAILED"
    print_message $YELLOW "Running with verbose output for debugging..."
    docker build -f docker/Dockerfile.backend --target production -t healthapp-backend:prod-test . 2>&1 | tail -30
    exit 1
fi

# Cleanup test images
print_message $YELLOW "🧹 Cleaning up test images..."
docker rmi healthapp-backend:dev-test healthapp-backend:builder-test healthapp-backend:prod-test >/dev/null 2>&1 || true

print_message $GREEN "🎉 All Docker builds completed successfully!"
print_message $GREEN "=================================================="
print_message $GREEN "✅ Development build: PASSED"
print_message $GREEN "✅ TypeScript compilation: PASSED"  
print_message $GREEN "✅ Production build: PASSED"
print_message $GREEN ""
print_message $BLUE "📋 Ready for deployment with:"
print_message $BLUE "   ./scripts/deploy-dev.sh [HOST_IP]"