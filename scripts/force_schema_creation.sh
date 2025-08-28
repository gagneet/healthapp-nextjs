#!/bin/bash
# Quick fix: Push schema directly to running container

# 1. Get the running app container ID
APP_CONTAINER=$(docker ps --filter "name=healthapp-test_app" --format "{{.ID}}" | head -1)

if [ -z "$APP_CONTAINER" ]; then
    echo "No app container found!"
    exit 1
fi

echo "Using app container: $APP_CONTAINER"

# 2. Force push the schema to create tables
echo "Pushing Prisma schema to database..."
docker exec "$APP_CONTAINER" npx prisma db push --accept-data-loss --force-reset

# 3. Generate Prisma client
echo "Generating Prisma client..."
docker exec "$APP_CONTAINER" npx prisma generate

# 4. Verify tables were created
echo "Verifying database tables..."
docker exec -e PGPASSWORD="secure_test_postgres" "$APP_CONTAINER" \
    psql -h postgres -U healthapp_user -d healthapp_test \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"

# 5. Now run seeds manually
echo "Running seeds..."
docker exec "$APP_CONTAINER" node lib/seed.cjs

echo "Schema and seed deployment complete!"
