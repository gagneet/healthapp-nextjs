#!/bin/bash

# deploy-local.sh - Local Development Environment Deployment
# Purpose: Quick deployment for local development with common settings
# Usage: ./scripts/deploy-local.sh [COMMAND] [OPTIONS]

set -e

# Script directory detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[LOCAL-DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[LOCAL-DEPLOY]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[LOCAL-DEPLOY]${NC} $1"
}

log_error() {
    echo -e "${RED}[LOCAL-DEPLOY]${NC} $1"
}

print_usage() {
    cat << EOF
🏠 HealthApp Local Development Deployment
==========================================

Quick deployment script for local development environment.

Usage: ./scripts/deploy-local.sh [COMMAND] [OPTIONS]

COMMANDS:
  deploy       Deploy complete local stack (default)
  start        Alias for deploy
  stop         Stop local stack
  restart      Stop and redeploy local stack
  logs         Show service logs
  status       Show service status
  clean        Clean and redeploy (removes compiled files)
  fresh        Fresh deployment (cleans + removes volumes)
  migrate      Run database migrations only
  seed         Run database seeders only

COMMON OPTIONS:
  --migrate    Run database migrations after deployment
  --seed       Run database seeders after deployment
  --clean      Clean up compiled files before deployment
  --auto-yes   Skip confirmation prompts
  --debug      Enable debug output

LOCAL ENVIRONMENT DEFAULTS:
  - Environment: dev
  - Domain: localhost
  - Port: 3002
  - Replicas: 1
  - Early database start: enabled
  - Skip image pulling: enabled (for faster local builds)

EXAMPLES:
  # Basic local deployment with database setup
  ./scripts/deploy-local.sh --migrate --seed

  # Fresh deployment (removes all data)
  ./scripts/deploy-local.sh fresh --migrate --seed

  # Quick restart without cleanup
  ./scripts/deploy-local.sh restart

  # View application logs
  ./scripts/deploy-local.sh logs app

  # Clean deployment
  ./scripts/deploy-local.sh deploy --clean --migrate --seed

EOF
}

# Main deployment function
main() {
    log_info "🏠 HealthApp Local Development Deployment"
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Default command if none provided
    if [ $# -eq 0 ]; then
        set -- "deploy" "--migrate" "--seed"
        log_info "Using default: deploy --migrate --seed"
    fi
    
    # Parse command
    COMMAND="$1"
    shift || true
    
    # Prepare arguments for main deploy script
    DEPLOY_ARGS=("dev" "$COMMAND")
    
    # Add local development optimizations
    DEPLOY_ARGS+=("--domain" "localhost")
    DEPLOY_ARGS+=("--port-frontend" "3002")
    DEPLOY_ARGS+=("--replicas" "1")
    DEPLOY_ARGS+=("--skip-image-pull")  # Skip pulling for faster local development
    
    # Handle special commands
    case $COMMAND in
        clean)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            DEPLOY_ARGS+=("--cleanup")
            ;;
        fresh)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            DEPLOY_ARGS+=("--cleanup" "--cleanup-volumes")
            log_warning "⚠️  Fresh deployment will remove all local data!"
            ;;
        start)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            ;;
    esac
    
    # Pass through remaining arguments
    DEPLOY_ARGS+=("$@")
    
    log_info "Executing: ./scripts/deploy.sh ${DEPLOY_ARGS[*]}"
    echo
    
    # Execute main deployment script
    exec "$SCRIPT_DIR/deploy.sh" "${DEPLOY_ARGS[@]}"
}

# Show usage if --help is requested
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    print_usage
    exit 0
fi

# Run main function with all arguments
main "$@"