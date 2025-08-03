@echo off
REM Healthcare Application Development Deployment Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Starting Healthcare Application Development Deployment...

REM Colors for output (Windows CMD doesn't support colors well, using echo statements)
set "INFO=[INFO]"
set "WARN=[WARN]"
set "ERROR=[ERROR]"
set "STEP=[STEP]"

echo %INFO% Starting Windows deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not running. Please start Docker Desktop first.
    echo %ERROR% Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% docker-compose is not available. Please ensure Docker Desktop is properly installed.
    pause
    exit /b 1
)

echo %STEP% 1. Preparing environment...

REM Create necessary directories (Windows style)
if not exist "logs" mkdir logs
if not exist "logs\backend" mkdir logs\backend
if not exist "logs\nginx" mkdir logs\nginx
if not exist "data" mkdir data
if not exist "data\postgres" mkdir data\postgres
if not exist "data\redis" mkdir data\redis
if not exist "data\grafana" mkdir data\grafana
if not exist "data\prometheus" mkdir data\prometheus

REM Copy environment file if it doesn't exist
if not exist ".env.development" (
    echo %WARN% .env.development not found. Creating from template...
    copy .env.development .env.development >nul 2>&1
    if errorlevel 1 (
        echo %WARN% Could not create .env.development. Please create it manually.
    )
)

echo %STEP% 2. Building Docker images...

REM Build images
docker-compose -f docker/docker-compose.dev.yml build --no-cache
if errorlevel 1 (
    echo %ERROR% Failed to build Docker images
    pause
    exit /b 1
)

echo %STEP% 3. Starting services...

REM Start services
docker-compose -f docker/docker-compose.dev.yml up -d
if errorlevel 1 (
    echo %ERROR% Failed to start services
    pause
    exit /b 1
)

echo %STEP% 4. Waiting for services to be ready...

REM Wait for database to be ready
echo %INFO% Waiting for PostgreSQL...
set /a timeout=60
set /a counter=0

:wait_postgres
docker-compose -f docker/docker-compose.dev.yml exec -T postgres pg_isready -U healthapp_user -d healthapp_dev >nul 2>&1
if not errorlevel 1 goto postgres_ready
set /a counter+=2
if %counter% geq %timeout% (
    echo %ERROR% PostgreSQL failed to start within %timeout% seconds
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
echo .
goto wait_postgres

:postgres_ready
echo.
echo %INFO% PostgreSQL is ready!

REM Wait for Redis to be ready
echo %INFO% Waiting for Redis...
set /a timeout=30
set /a counter=0

:wait_redis
docker-compose -f docker/docker-compose.dev.yml exec -T redis redis-cli ping >nul 2>&1
if not errorlevel 1 goto redis_ready
set /a counter+=2
if %counter% geq %timeout% (
    echo %ERROR% Redis failed to start within %timeout% seconds
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
echo .
goto wait_redis

:redis_ready
echo.
echo %INFO% Redis is ready!

echo %STEP% 5. Running database migrations...

REM Run migrations
docker-compose -f docker/docker-compose.dev.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo %WARN% Migration failed. This might be normal for first-time setup.
)

echo %STEP% 6. Seeding database...

REM Seed database
docker-compose -f docker/docker-compose.dev.yml exec -T backend npm run seed
if errorlevel 1 (
    echo %WARN% Seeding failed. This might be normal if data already exists.
)

echo %STEP% 7. Verifying deployment...

REM Check service health
echo %INFO% Checking service status...

for %%s in (postgres redis backend frontend) do (
    docker-compose -f docker/docker-compose.dev.yml ps %%s | findstr "Up" >nul
    if not errorlevel 1 (
        echo %INFO% %%s is running ✓
    ) else (
        echo %ERROR% %%s is not running ✗
        echo %INFO% Showing logs for %%s:
        docker-compose -f docker/docker-compose.dev.yml logs %%s
    )
)

REM Test API endpoint
echo %INFO% Testing API endpoint...
timeout /t 5 /nobreak >nul
curl -f http://localhost:3001/api/health >nul 2>&1
if not errorlevel 1 (
    echo %INFO% Backend API is healthy ✓
) else (
    echo %WARN% Backend API health check failed. Check logs:
    docker-compose -f docker/docker-compose.dev.yml logs backend
)

REM Test Frontend
echo %INFO% Testing Frontend...
curl -f http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo %INFO% Frontend is accessible ✓
) else (
    echo %WARN% Frontend health check failed. Check logs:
    docker-compose -f docker/docker-compose.dev.yml logs frontend
)

echo %STEP% ✅ Development deployment completed!
echo.
echo 🌟 Healthcare Application Development Environment is ready!
echo.
echo 📋 Access URLs:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo    pgAdmin:   http://localhost:5050 (admin@healthapp.com / admin123)
echo.
echo 🔧 Useful commands:
echo    View logs:        docker-compose -f docker/docker-compose.dev.yml logs -f [service]
echo    Stop services:    docker-compose -f docker/docker-compose.dev.yml down
echo    Restart service:  docker-compose -f docker/docker-compose.dev.yml restart [service]
echo    Shell access:     docker-compose -f docker/docker-compose.dev.yml exec [service] sh
echo.
echo 🐛 Troubleshooting:
echo    If services fail to start, check: docker-compose -f docker/docker-compose.dev.yml logs
echo    To reset everything: scripts\reset-dev.bat
echo.
pause