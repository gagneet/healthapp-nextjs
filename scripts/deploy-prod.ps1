# Healthcare Application Production Deployment Script for Windows PowerShell
param(
    [string]$Version = "latest",
    [string]$Environment = "production",
    [string]$DockerRegistry = "",
    [switch]$SkipBuild,
    [switch]$SkipMigration,
    [switch]$Help
)

# Colors for output
$InfoColor = "Green"
$WarnColor = "Yellow"
$ErrorColor = "Red"
$StepColor = "Cyan"

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor $InfoColor
}

function Write-Warn($message) {
    Write-Host "[WARN] $message" -ForegroundColor $WarnColor
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor $ErrorColor
}

function Write-Step($message) {
    Write-Host "[STEP] $message" -ForegroundColor $StepColor
}

if ($Help) {
    Write-Host "Usage: .\deploy-prod.ps1 [OPTIONS]"
    Write-Host "Options:"
    Write-Host "  -Version VERSION       Docker image version (default: latest)"
    Write-Host "  -Environment ENV       Environment name (default: production)"
    Write-Host "  -DockerRegistry REG    Docker registry URL"
    Write-Host "  -SkipBuild            Skip building Docker images"
    Write-Host "  -SkipMigration        Skip database migrations"
    Write-Host "  -Help                 Show this help message"
    exit 0
}

Write-Host "🚀 Starting Healthcare Application Production Deployment..." -ForegroundColor $StepColor

Write-Info "Deployment Configuration:"
Write-Info "  Version: $Version"
Write-Info "  Environment: $Environment"
Write-Info "  Registry: $(if ($DockerRegistry) { $DockerRegistry } else { 'local' })"
Write-Info "  Skip Build: $SkipBuild"
Write-Info "  Skip Migration: $SkipMigration"

# Check prerequisites
Write-Step "1. Checking prerequisites..."

# Check if Docker is running
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker Swarm is initialized
try {
    docker node ls | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Swarm is not initialized"
    }
} catch {
    Write-Error "Docker Swarm is not initialized. Run 'docker swarm init' first."
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if environment file exists
if (-not (Test-Path ".env.production")) {
    Write-Error ".env.production file not found. Please create it from .env.production.example"
    Read-Host "Press Enter to exit"
    exit 1
}

# Source environment variables (PowerShell equivalent)
Get-Content ".env.production" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

Write-Step "2. Preparing environment..."

# Create Docker secrets
Write-Info "Creating Docker secrets..."
$secrets = @{
    "db_password" = $env:DB_PASSWORD
    "jwt_secret" = $env:JWT_SECRET
    "redis_password" = $env:REDIS_PASSWORD
    "aws_access_key" = $env:AWS_ACCESS_KEY_ID
    "aws_secret_key" = $env:AWS_SECRET_ACCESS_KEY
    "grafana_password" = $env:GRAFANA_PASSWORD
}

foreach ($secret in $secrets.GetEnumerator()) {
    $secretName = $secret.Key
    $secretValue = $secret.Value
    
    # Check if secret exists and remove it
    docker secret inspect $secretName 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Secret $secretName already exists, updating..."
        docker secret rm $secretName
    }
    
    # Create new secret
    $secretValue | docker secret create $secretName -
    Write-Info "Created secret: $secretName"
}

# Create SSL certificates secret (if files exist)
if ((Test-Path "ssl/cert.pem") -and (Test-Path "ssl/key.pem")) {
    Write-Info "Creating SSL certificate secrets..."
    
    # Remove existing secrets if they exist
    docker secret ls --filter name=ssl_cert -q | ForEach-Object { docker secret rm $_ }
    docker secret ls --filter name=ssl_key -q | ForEach-Object { docker secret rm $_ }
    
    docker secret create ssl_cert ssl/cert.pem
    docker secret create ssl_key ssl/key.pem
} else {
    Write-Warn "SSL certificate files not found. Please add ssl/cert.pem and ssl/key.pem"
}

# Create Docker configs
Write-Info "Creating Docker configs..."
$configs = @{
    "nginx_config" = "nginx/nginx.conf"
    "prometheus_config" = "monitoring/prometheus.yml"
}

foreach ($config in $configs.GetEnumerator()) {
    $configName = $config.Key
    $configFile = $config.Value
    
    if (Test-Path $configFile) {
        # Remove existing config if it exists
        docker config inspect $configName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Config $configName already exists, updating..."
            docker config rm $configName
        }
        
        docker config create $configName $configFile
        Write-Info "Created config: $configName"
    } else {
        Write-Warn "Config file not found: $configFile"
    }
}

Write-Step "3. Building and pushing Docker images..."

if (-not $SkipBuild) {
    $images = @("backend", "frontend")
    
    foreach ($image in $images) {
        $imageTag = "healthapp/${image}:${Version}"
        
        $dockerfile = if ($image -eq "backend") { "docker/Dockerfile.backend" } else { "docker/Dockerfile" }
        
        Write-Info "Building $imageTag..."
        docker build -f $dockerfile -t $imageTag .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build $imageTag"
            Read-Host "Press Enter to exit"
            exit 1
        }
        
        # Tag for registry if specified
        if ($DockerRegistry) {
            $registryTag = "${DockerRegistry}/healthapp/${image}:${Version}"
            docker tag $imageTag $registryTag
            Write-Info "Pushing to registry: $registryTag"
            docker push $registryTag
        }
    }
} else {
    Write-Info "Skipping Docker image build (-SkipBuild specified)"
}

Write-Step "4. Deploying stack..."

# Deploy the stack
$env:VERSION = $Version
docker stack deploy -c docker/docker-stack.yml healthapp

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy stack"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Step "5. Waiting for services to be ready..."

# Wait for initial deployment
Write-Info "Waiting for stack deployment..."
Start-Sleep -Seconds 20

# Check service status
Write-Info "Checking service status..."
docker stack services healthapp

# Wait for database to be ready (FIRST PRIORITY)
Write-Info "Waiting for PostgreSQL database to be ready..."
$timeout = 120
$counter = 0

while ($counter -lt $timeout) {
    $postgresStatus = docker service ls | Select-String "healthapp_postgres" | Select-String "1/1"
    if ($postgresStatus) {
        Write-Info "PostgreSQL database service is ready"
        break
    }
    Start-Sleep -Seconds 5
    $counter += 5
    Write-Host "." -NoNewline
}
Write-Host ""

if ($counter -ge $timeout) {
    Write-Error "Database failed to start within $timeout seconds!"
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for Redis to be ready (SECOND PRIORITY)
Write-Info "Waiting for Redis cache to be ready..."
$counter = 0
$timeout = 60

while ($counter -lt $timeout) {
    $redisStatus = docker service ls | Select-String "healthapp_redis" | Select-String "1/1"
    if ($redisStatus) {
        Write-Info "Redis cache service is ready"
        break
    }
    Start-Sleep -Seconds 5
    $counter += 5
    Write-Host "." -NoNewline
}
Write-Host ""

if ($counter -ge $timeout) {
    Write-Warn "Redis readiness check timed out, but continuing..."
}

# Wait for backend to be ready (THIRD PRIORITY)
Write-Info "Waiting for backend API to be ready..."
$counter = 0
$timeout = 180

while ($counter -lt $timeout) {
    $backendStatus = docker service ls | Select-String "healthapp_backend" | Select-String "/5"
    if ($backendStatus) {
        # Also check if backend health endpoint responds (assuming production domain)
        try {
            $response = Invoke-WebRequest -Uri "https://api.healthcareapp.com/health" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Info "Backend API service is ready and responding"
                break
            }
        } catch {
            # Health check failed, continue waiting
        }
    }
    Start-Sleep -Seconds 5
    $counter += 5
    Write-Host "." -NoNewline
}
Write-Host ""

if ($counter -ge $timeout) {
    Write-Error "Backend API failed to start within $timeout seconds!"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Step "6. Installing PostgreSQL extensions..."

# Install UUID extension
Write-Info "Installing PostgreSQL UUID extension..."
try {
    $postgresTaskId = docker service ps healthapp_postgres --no-trunc --format "{{.ID}}" | Select-Object -First 1
    if ($postgresTaskId) {
        $postgresContainerId = docker inspect --format='{{.Status.ContainerStatus.ContainerID}}' $postgresTaskId 2>$null | ForEach-Object { $_.Substring(0, 12) }
        if ($postgresContainerId) {
            docker exec $postgresContainerId psql -U $env:DB_USER -d $env:DB_NAME -c "CREATE EXTENSION IF NOT EXISTS `"uuid-ossp`";"
            Write-Info "PostgreSQL UUID extension installed successfully"
        }
    }
} catch {
    Write-Warn "Failed to install UUID extension, but continuing..."
}

Write-Step "7. Running database migrations..."

if (-not $SkipMigration) {
    Write-Info "Waiting for database to be ready..."
    $timeout = 120
    $counter = 0
    
    while ($counter -lt $timeout) {
        $postgresStatus = docker service ps healthapp_postgres --format "{{.CurrentState}}" | Select-String "Running"
        if ($postgresStatus) {
            break
        }
        Start-Sleep -Seconds 5
        $counter += 5
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if ($counter -ge $timeout) {
        Write-Error "Database service failed to start within $timeout seconds"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Info "Running database migrations..."
    Start-Sleep -Seconds 10
    
    # Get backend service ID and force update to run migrations
    $backendId = docker service ls --filter name=healthapp_backend --format "{{.ID}}"
    if ($backendId) {
        docker service update --force $backendId
    }
    
    Start-Sleep -Seconds 30
} else {
    Write-Info "Skipping database migrations (-SkipMigration specified)"
}

Write-Step "8. Verifying deployment..."

# Check service health
$services = @("healthapp_postgres", "healthapp_redis", "healthapp_backend", "healthapp_frontend", "healthapp_nginx")

foreach ($service in $services) {
    $replicas = (docker service ps $service --format "{{.CurrentState}}" | Select-String "Running").Count
    $desired = (docker service ls --filter name=$service --format "{{.Replicas}}" | ForEach-Object { $_.Split('/')[1] })
    
    if ($replicas -eq $desired -and $replicas -gt 0) {
        Write-Info "$service`: $replicas/$desired replicas running ✓"
    } else {
        Write-Warn "$service`: $replicas/$desired replicas running ⚠️"
        docker service ps $service --no-trunc
    }
}

Write-Step "✅ Production deployment completed!"

Write-Host ""
Write-Host "🌟 Healthcare Application Production Environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access URLs:"
Write-Host "   Frontend:    https://app.healthcareapp.com"
Write-Host "   Backend API: https://api.healthcareapp.com"
Write-Host "   Monitoring:  http://monitoring.healthcareapp.com (admin / $env:GRAFANA_PASSWORD)"
Write-Host ""
Write-Host "🔧 Management commands:"
Write-Host "   View services:    docker stack services healthapp"
Write-Host "   View service logs: docker service logs healthapp_[service_name] -f"
Write-Host "   Scale service:    docker service scale healthapp_[service_name]=N"
Write-Host "   Update service:   docker service update healthapp_[service_name]"
Write-Host "   Remove stack:     docker stack rm healthapp"
Write-Host ""

Read-Host "Press Enter to exit"