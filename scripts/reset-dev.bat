@echo off
REM Reset Development Environment Script for Windows
setlocal enabledelayedexpansion

echo 🔄 Resetting Healthcare Application Development Environment...

REM Colors for output
set "INFO=[INFO]"
set "WARN=[WARN]"
set "ERROR=[ERROR]"

echo %WARN% This will destroy all development data including:
echo %WARN%   - All containers and images
echo %WARN%   - Database data
echo %WARN%   - Redis data
echo %WARN%   - Application logs
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo %INFO% Operation cancelled
    pause
    exit /b 0
)

echo %INFO% Stopping all services...
docker-compose -f docker/docker-compose.dev.yml down

echo %INFO% Removing volumes...
docker-compose -f docker/docker-compose.dev.yml down -v

echo %INFO% Removing orphaned containers...
docker-compose -f docker/docker-compose.dev.yml down --remove-orphans

echo %INFO% Pruning unused images...
docker image prune -f

echo %INFO% Pruning unused networks...
docker network prune -f

echo %INFO% Removing build cache...
docker builder prune -f

echo %INFO% Cleaning up log directories...
if exist "logs" (
    rmdir /s /q logs
    mkdir logs
    mkdir logs\backend
    mkdir logs\nginx
)

echo %INFO% ✅ Development environment reset complete!
echo.
echo To start fresh, run: scripts\deploy-dev.bat
pause