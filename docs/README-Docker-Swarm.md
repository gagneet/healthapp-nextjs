# HealthApp Docker Swarm Deployment Guide

This application is designed for **Docker Swarm** deployment with horizontal scaling and production-ready orchestration.

## Quick Start

### 1. Initialize Docker Swarm (One-time setup)

```bash
./scripts/docker-swarm-init.sh [IP_ADDRESS]
```

### 2. Deploy Development Environment

```bash
./scripts/deploy-stack.sh dev [IP_ADDRESS] [--auto-yes]
```

### 3. Deploy Production Environment

```bash
./scripts/deploy-stack.sh prod [IP_ADDRESS] [--auto-yes]
```

## Architecture Overview

### Docker Swarm Services

- **PostgreSQL Database**: Single instance with placement constraints
- **Redis Cache**: Single instance for session/data caching
- **Backend API**: Horizontally scalable (default: 5 replicas)
- **Frontend NextJS**: Horizontally scalable (default: 3 replicas)
- **NGINX Load Balancer**: High availability (2 replicas)
- **Monitoring Stack**: Prometheus + Grafana
- **Log Management**: Elasticsearch
- **Backup Service**: Automated database backups

### Key Features

- **Horizontal Scaling**: Easy scaling with `docker service scale`
- **Rolling Updates**: Zero-downtime deployments
- **Health Checks**: Comprehensive service monitoring
- **Load Balancing**: NGINX for frontend/backend traffic
- **Secrets Management**: Docker secrets for sensitive data
- **Volume Management**: Persistent data storage
- **Network Isolation**: Encrypted overlay networks

## Scaling Operations

### Scale Backend Service

```bash
docker service scale healthapp_backend=10
```

### Scale Frontend Service

```bash
docker service scale healthapp_frontend=5
```

### Scale During Deployment

```bash
./scripts/deploy-stack.sh dev --scale-backend=8 --scale-frontend=4
```

## Service Management

### View All Services

```bash
docker stack services healthapp
```

### View Service Logs

```bash
docker service logs healthapp_backend -f
docker service logs healthapp_frontend -f
```

### Update Service Configuration

```bash
docker service update --env-add NEW_VAR=value healthapp_backend
```

### Rolling Update

```bash
docker service update --image healthapp-backend:new-version healthapp_backend
```

## Node Management

### Add Worker Nodes

```bash
# On manager node, get join token
docker swarm join-token worker

# On worker node, run the join command
docker swarm join --token SWMTKN-xxx manager-ip:2377
```

### Label Nodes for Service Placement

```bash
# Database nodes
docker node update --label-add database=true worker-1

# Backend nodes  
docker node update --label-add backend=true worker-2

# Frontend nodes
docker node update --label-add frontend=true worker-3
```

## Environment Configuration

The stack supports multiple deployment modes:

### Development Mode

- Hot-reload enabled
- Debug logging
- Development database
- Simplified security

### Production Mode

- Optimized builds
- Production database
- SSL/TLS enabled
- Enhanced security
- Backup automation

## Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3002 | NextJS Application |
| Backend | 3001 | API Server |
| PostgreSQL | 5433 | Database |
| Redis | 6379 | Cache |
| pgAdmin | 5050 | Database Admin |
| NGINX | 80/443 | Load Balancer |
| Prometheus | 9090 | Metrics |
| Grafana | 3001 | Monitoring Dashboard |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | <doctor@healthapp.com> | password123 |
| Admin | <admin@healthapp.com> | password123 |
| HSP | <hsp@healthapp.com> | password123 |
| Hospital Admin | <hospital.admin@healthapp.com> | password123 |
| Patient | <patient@healthapp.com> | password123 |

## Troubleshooting

### View Service Status

```bash
docker service ps healthapp_backend --no-trunc
```

### Check Service Health

```bash
curl http://IP_ADDRESS:3001/health
```

### Remove and Redeploy Stack

```bash
docker stack rm healthapp
sleep 30
./scripts/deploy-stack.sh dev
```

### Database Issues

```bash
# Check PostgreSQL logs
docker service logs healthapp_postgres

# Access PostgreSQL directly
docker exec -it $(docker ps -q -f name=healthapp_postgres) psql -U healthapp_user -d healthapp_dev
```

## Kubernetes Migration Ready

This Docker Swarm setup is designed to be easily portable to Kubernetes:

- Service definitions map to Kubernetes Services
- Deployment configurations map to Kubernetes Deployments
- ConfigMaps and Secrets are compatible
- Health check definitions are portable
- Volume configurations are compatible

## Security Best Practices

- All networks use encrypted overlay drivers
- Secrets are managed through Docker secrets
- Services run with minimal privileges
- Health checks ensure service reliability
- Resource limits prevent resource exhaustion
- Placement constraints ensure proper distribution

## Monitoring and Observability

- **Prometheus**: Metrics collection from all services
- **Grafana**: Visualization and alerting dashboards
- **Elasticsearch**: Centralized logging
- **Health Checks**: Built-in service monitoring
- **Resource Monitoring**: CPU, memory, and disk usage tracking

This deployment approach provides enterprise-grade scalability, reliability, and maintainability for the HealthApp platform.
