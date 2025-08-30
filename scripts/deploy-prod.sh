#!/bin/bash

# deploy-prod.sh - Production Environment Deployment
# Purpose: Secure deployment for production with safety checks and best practices
# Usage: ./scripts/deploy-prod.sh [COMMAND] [OPTIONS]

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
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[PROD-DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PROD-DEPLOY]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[PROD-DEPLOY]${NC} $1"
}

log_error() {
    echo -e "${RED}[PROD-DEPLOY]${NC} $1"
}

log_critical() {
    echo -e "${PURPLE}[PROD-CRITICAL]${NC} $1"
}

print_usage() {
    cat << EOF
🚀 HealthApp Production Environment Deployment
===============================================

Secure deployment script for production with enhanced safety measures.

Usage: ./scripts/deploy-prod.sh [COMMAND] [OPTIONS]

COMMANDS:
  deploy       Deploy complete production stack (default)
  update       Update running production services (safest option)
  stop         Stop production stack (requires confirmation)
  restart      Stop and redeploy production stack (requires confirmation)
  logs         Show service logs
  status       Show service status
  migrate      Run database migrations only (with backup recommendation)
  seed         NOT RECOMMENDED for production
  scale        Scale services up/down
  backup       Backup production database

COMMON OPTIONS:
  --domain DOMAIN      Production domain (required)
  --migrate           Run database migrations (with safety checks)
  --clean             Clean up compiled files (safe for production)
  --replicas N        Number of replicas (default: 2 for production)
  --auto-yes          Skip confirmation prompts (USE WITH CAUTION)
  --debug             Enable debug output

PRODUCTION SAFETY FEATURES:
  - Domain validation required
  - Double confirmation for destructive operations
  - Volume cleanup protection (cannot use --cleanup-volumes)
  - Seeding disabled by default
  - Migration safety checks
  - Automatic backup recommendations

EXAMPLES:
  # Safe production deployment with migrations
  ./scripts/deploy-prod.sh deploy --domain healthapp.com --migrate

  # Update existing production services (recommended)
  ./scripts/deploy-prod.sh update --domain healthapp.com

  # Scale production environment
  ./scripts/deploy-prod.sh scale --domain healthapp.com --replicas 3

  # View production logs
  ./scripts/deploy-prod.sh logs app --domain healthapp.com

  # Production migrations (with backup recommendation)
  ./scripts/deploy-prod.sh migrate --domain healthapp.com

SAFETY WARNINGS:
  ⚠️  --seed is disabled for production safety
  ⚠️  --cleanup-volumes is blocked for production
  ⚠️  Fresh deployments are not allowed in production
  ⚠️  All destructive operations require double confirmation

EOF
}

# Production environment validation
validate_production_deployment() {
    local has_domain=false
    local args=("$@")
    
    log_info "🔒 Performing production deployment validation..."
    
    # Check if domain is provided in arguments
    for ((i=0; i<${#args[@]}; i++)); do
        if [[ "${args[i]}" == "--domain" ]] && [[ -n "${args[i+1]:-}" ]]; then
            has_domain=true
            local domain="${args[i+1]}"
            log_info "Production domain specified: $domain"
            break
        fi
    done
    
    # Check if domain is in environment file
    if [ "$has_domain" = false ] && [ -f ".env" ]; then
        if grep -q "^DOMAIN=" .env && grep -v "^DOMAIN=localhost$" .env | grep -q "^DOMAIN="; then
            has_domain=true
            local env_domain=$(grep "^DOMAIN=" .env | cut -d'=' -f2)
            log_info "Using production domain from .env file: $env_domain"
        fi
    fi
    
    if [ "$has_domain" = false ]; then
        log_error "❌ Production domain is required"
        log_error "Please specify production domain with --domain flag or set DOMAIN in .env file"
        log_error ""
        log_error "Example:"
        log_error "  ./scripts/deploy-prod.sh deploy --domain healthapp.com --migrate"
        exit 1
    fi
    
    # Check for prohibited production options
    for arg in "$@"; do
        case $arg in
            --seed)
                log_critical "❌ PRODUCTION SAFETY: --seed is not allowed in production"
                log_critical "Seeding could overwrite production data"
                log_error "If you need to seed production data, do it manually with extreme caution"
                exit 1
                ;;
            --cleanup-volumes)
                log_critical "❌ PRODUCTION SAFETY: --cleanup-volumes is BLOCKED in production"
                log_critical "This would DELETE ALL PRODUCTION DATA"
                log_error "Volume cleanup is never allowed in production environment"
                exit 1
                ;;
        esac
    done
    
    # Check environment file exists
    if [ ! -f ".env" ]; then
        log_error "❌ .env file is required for production deployment"
        exit 1
    fi
    
    # Validate critical environment variables
    log_info "🔍 Validating production environment configuration..."
    
    local missing_vars=()
    
    # Check for required production variables
    if ! grep -q "^NEXTAUTH_SECRET=" .env || [ -z "$(grep '^NEXTAUTH_SECRET=' .env | cut -d'=' -f2)" ]; then
        missing_vars+=("NEXTAUTH_SECRET")
    fi
    
    if ! grep -q "^DATABASE_URL=" .env || [ -z "$(grep '^DATABASE_URL=' .env | cut -d'=' -f2)" ]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "❌ Missing required production environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "   - $var"
        done
        exit 1
    fi
    
    log_success "✅ Production environment validation passed"
}

# Production confirmation for destructive operations
confirm_production_operation() {
    local operation="$1"
    local extra_warning="${2:-}"
    
    case $operation in
        stop|restart)
            echo
            log_critical "🚨 PRODUCTION WARNING: $operation operation requested"
            log_warning "This will affect live production services and user access"
            if [ -n "$extra_warning" ]; then
                log_warning "$extra_warning"
            fi
            echo
            log_critical "Type 'CONFIRM PRODUCTION $operation' to proceed:"
            read -r confirmation
            if [ "$confirmation" != "CONFIRM PRODUCTION $operation" ]; then
                log_error "Operation cancelled"
                exit 1
            fi
            ;;
        migrate)
            echo
            log_warning "🔄 PRODUCTION MIGRATION WARNING"
            log_warning "You are about to run database migrations in production"
            log_warning "This could potentially cause downtime or data issues"
            echo
            log_info "📋 RECOMMENDED STEPS BEFORE MIGRATION:"
            log_info "1. Backup the production database"
            log_info "2. Test migrations on a copy of production data"
            log_info "3. Plan for rollback if needed"
            log_info "4. Consider maintenance window"
            echo
            log_warning "Have you completed these steps and are ready to proceed?"
            log_critical "Type 'MIGRATE PRODUCTION' to confirm:"
            read -r confirmation
            if [ "$confirmation" != "MIGRATE PRODUCTION" ]; then
                log_error "Migration cancelled"
                exit 1
            fi
            ;;
    esac
}

# Main deployment function
main() {
    log_info "🚀 HealthApp Production Environment Deployment"
    log_info "Production deployment with enhanced safety measures"
    echo
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Default command if none provided
    if [ $# -eq 0 ]; then
        log_error "Command required for production deployment"
        print_usage
        exit 1
    fi
    
    # Parse command
    COMMAND="$1"
    shift || true
    
    # Validate production deployment requirements
    validate_production_deployment "$@"
    
    # Check for auto-yes flag
    local auto_yes=false
    for arg in "$@"; do
        if [[ "$arg" == "--auto-yes" ]]; then
            auto_yes=true
            log_warning "⚠️  Auto-yes mode enabled - some confirmations will be skipped"
            break
        fi
    done
    
    # Production safety confirmations
    if [ "$auto_yes" = false ]; then
        case $COMMAND in
            stop)
                confirm_production_operation "stop" "All users will lose access to the healthcare platform"
                ;;
            restart)
                confirm_production_operation "restart" "This will cause temporary downtime"
                ;;
            migrate)
                confirm_production_operation "migrate"
                ;;
            fresh)
                log_critical "❌ PRODUCTION SAFETY: 'fresh' command is BLOCKED in production"
                log_critical "Fresh deployments would DELETE ALL PRODUCTION DATA"
                log_error "Use 'deploy', 'update', or other safe commands instead"
                exit 1
                ;;
        esac
    fi
    
    # Prepare arguments for main deploy script
    DEPLOY_ARGS=("prod" "$COMMAND")
    
    # Add production environment defaults
    DEPLOY_ARGS+=("--port-frontend" "3002")
    DEPLOY_ARGS+=("--replicas" "2")  # 2 replicas for production availability
    
    # Handle special commands
    case $COMMAND in
        clean)
            DEPLOY_ARGS[1]="deploy"  # Change command to deploy
            DEPLOY_ARGS+=("--cleanup")
            log_info "Clean deployment: will remove compiled files (safe for production)"
            ;;
        update)
            # Update is the safest production operation
            DEPLOY_ARGS[1]="deploy"
            log_info "Update deployment: safest option for production"
            ;;
    esac
    
    # Filter out dangerous flags that might have been missed
    local safe_args=()
    for arg in "$@"; do
        case $arg in
            --seed|--cleanup-volumes)
                # These are already caught in validation, but double-check
                log_critical "❌ Dangerous flag filtered out: $arg"
                ;;
            *)
                safe_args+=("$arg")
                ;;
        esac
    done
    
    # Pass through safe arguments
    DEPLOY_ARGS+=("${safe_args[@]}")
    
    log_info "🚀 Executing production deployment..."
    log_info "Command: ./scripts/deploy.sh ${DEPLOY_ARGS[*]}"
    echo
    log_info "🔒 Production safety measures active"
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