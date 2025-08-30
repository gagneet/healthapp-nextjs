#!/bin/bash

# deploy-test.sh - Test Environment Deployment  
# Purpose: Deployment for test environment with appropriate settings
# Usage: ./scripts/deploy-test.sh [COMMAND] [OPTIONS]

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
    echo -e "${BLUE}[TEST-DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[TEST-DEPLOY]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[TEST-DEPLOY]${NC} $1"
}

log_error() {
    echo -e "${RED}[TEST-DEPLOY]${NC} $1"
}

print_usage() {
    cat << EOF
🧪 HealthApp Test Environment Deployment
=========================================

Deployment script for test environment with production-like settings.

Usage: ./scripts/deploy-test.sh [COMMAND] [OPTIONS]

COMMANDS:
  deploy       Deploy complete test stack (default)
  update       Update running test services
  stop         Stop test stack
  restart      Stop and redeploy test stack
  logs         Show service logs
  status       Show service status
  clean        Clean and redeploy (removes compiled files)
  fresh        Fresh deployment (cleans + removes volumes)
  migrate      Run database migrations only
  seed         Run database seeders only
  scale        Scale services up/down

COMMON OPTIONS:
  --domain DOMAIN      Test domain (required for test environment)
  --migrate           Run database migrations after deployment
  --seed              Run database seeders after deployment
  --clean             Clean up compiled files before deployment
  --replicas N        Number of replicas (default: 2 for test)
  --auto-yes          Skip confirmation prompts
  --debug             Enable debug output

TEST ENVIRONMENT DEFAULTS:
  - Environment: test
  - Domain: Must be specified (e.g., test.healthapp.com)
  - Port: 3002
  - Replicas: 2 (for load testing)
  - Early database start: enabled
  - Volume cleanup protection: enabled

EXAMPLES:
  # Deploy to test domain with database setup
  ./scripts/deploy-test.sh deploy --domain test.healthapp.com --migrate --seed

  # Update existing deployment
  ./scripts/deploy-test.sh update --domain test.healthapp.com

  # Fresh test deployment (removes test data)
  ./scripts/deploy-test.sh fresh --domain test.healthapp.com --migrate --seed --auto-yes

  # Scale test environment
  ./scripts/deploy-test.sh scale --domain test.healthapp.com --replicas 3

  # View application logs
  ./scripts/deploy-test.sh logs app --domain test.healthapp.com

IMPORTANT NOTES:
  - Test environment requires explicit domain specification
  - Uses 2 replicas by default for load testing
  - Fresh deployments require confirmation unless --auto-yes is used
  - Test database is isolated from production

EOF
}

# Validate required parameters
validate_test_deployment() {
    local has_domain=false
    local args=("$@")
    
    # Check if domain is provided in arguments
    for ((i=0; i<${#args[@]}; i++)); do
        if [[ "${args[i]}" == "--domain" ]] && [[ -n "${args[i+1]:-}" ]]; then
            has_domain=true
            break
        fi
    done
    
    # Check if domain is in environment file
    if [ "$has_domain" = false ] && [ -f ".env" ]; then
        if grep -q "^DOMAIN=" .env && grep -v "^DOMAIN=localhost$" .env | grep -q "^DOMAIN="; then
            has_domain=true
            log_info "Using domain from .env file"
        fi
    fi
    
    if [ "$has_domain" = false ]; then
        log_error "❌ Domain is required for test environment deployment"
        log_error "Please specify domain with --domain flag or set DOMAIN in .env file"
        log_error ""
        log_error "Examples:"
        log_error "  ./scripts/deploy-test.sh deploy --domain test.healthapp.com --migrate --seed"
        log_error "  ./scripts/deploy-test.sh deploy --domain healthapp.gagneet.com --migrate --seed"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "🧪 HealthApp Test Environment Deployment"
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Default command if none provided
    if [ $# -eq 0 ]; then
        log_error "Command required for test deployment"
        print_usage
        exit 1
    fi
    
    # Parse command
    COMMAND="$1"
    shift || true
    
    # Validate that domain is provided for test deployment
    validate_test_deployment "$@"
    
    # Prepare arguments for main deploy script
    DEPLOY_ARGS=("test" "$COMMAND")
    
    # Add test environment defaults
    DEPLOY_ARGS+=("--port-frontend" "3002")
    DEPLOY_ARGS+=("--replicas" "2")  # 2 replicas for test load
    
    # Handle special commands
    case $COMMAND in
        clean)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            DEPLOY_ARGS+=("--cleanup")
            log_info "Clean deployment: will remove compiled files"
            ;;
        fresh)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            DEPLOY_ARGS+=("--cleanup" "--cleanup-volumes")
            log_warning "⚠️  Fresh deployment will remove all test environment data!"
            log_warning "This includes test database, Redis cache, and all volumes"
            ;;
        update)
            # Update is similar to deploy but typically without cleanup
            DEPLOY_ARGS[1]="deploy"
            log_info "Update deployment: will update services without cleanup"
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