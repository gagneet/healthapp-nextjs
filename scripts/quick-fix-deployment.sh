#!/bin/bash

# quick-fix-deployment.sh - Fix the current deployment issue
# This script addresses the immediate problem without changing all the files

set -e

ENVIRONMENT="test"
STACK_NAME="healthapp-test"

echo "🔧 Quick Fix for HealthApp Deployment"
echo "====================================="

# Function to run migrations on the current deployment
run_current_migrations() {
    echo "📦 Finding running app container..."
    
    # Get running app container ID
    local container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
    
    if [ -z "$container_id" ]; then
        echo "❌ No running app containers found"
        return 1
    fi
    
    echo "✅ Found app container: $container_id"
    echo "🔄 Running database migrations..."
    
    if docker exec "$container_id" npx prisma migrate deploy; then
        echo "✅ Migrations completed successfully"
    else
        echo "❌ Migration failed"
        return 1
    fi
}

# Function to run seeds
run_current_seeds() {
    echo "🌱 Running database seeds..."
    
    # Get running app container ID
    local container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
    
    if [ -z "$container_id" ]; then
        echo "❌ No running app containers found"
        return 1
    fi
    
    if docker exec "$container_id" npm run seed; then
        echo "✅ Seeds completed successfully"
    else
        echo "❌ Seeding failed"
        return 1
    fi
}

# Function to test health after migrations
test_health() {
    echo "🏥 Testing application health..."
    
    local container_id=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
    
    if [ -z "$container_id" ]; then
        echo "❌ No running app containers found"
        return 1
    fi
    
    echo "Testing health endpoint..."
    if docker exec "$container_id" curl -f -s http://localhost:3002/api/health; then
        echo -e "\n✅ Health endpoint is working!"
    else
        echo "⚠️  Health endpoint still having issues"
    fi
    
    echo -e "\nTesting main app endpoint..."
    if docker exec "$container_id" curl -f -s http://localhost:3002 >/dev/null; then
        echo "✅ Main app endpoint is working!"
    else
        echo "⚠️  Main app endpoint having issues"
    fi
}

# Main execution
echo "Current deployment status:"
docker service ls --filter "name=$STACK_NAME"

echo -e "\nPostgreSQL is running and healthy. The issue is missing database schema."
echo "Let's run migrations to create the database tables..."

if run_current_migrations; then
    echo -e "\n🎉 Migrations successful! Now testing seeds..."
    
    if run_current_seeds; then
        echo -e "\n🎉 Seeds successful! Testing health..."
        test_health
        
        echo -e "\n🎉 Quick fix complete!"
        echo "Your deployment should now be working properly."
        echo -e "\nYou can test it by visiting:"
        echo "- Frontend: http://healthapp.gagneet.com:3002"
        echo "- Health Check: http://healthapp.gagneet.com:3002/api/health"
        echo "- PgAdmin: http://healthapp.gagneet.com:5050"
    else
        echo -e "\n⚠️  Seeds failed, but migrations worked."
        echo "The app should still function. Testing health..."
        test_health
    fi
else
    echo -e "\n❌ Could not run migrations. Let's diagnose the issue..."
    
    echo -e "\nChecking if app containers are running:"
    docker ps --filter "name=${STACK_NAME}_app"
    
    echo -e "\nApp service logs:"
    docker service logs --tail 20 "${STACK_NAME}_app"
fi

echo -e "\nTo see current service status:"
echo "docker service ls"
echo "docker service ps $STACK_NAME"
