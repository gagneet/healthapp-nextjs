# Docker Deployment Guide - DEPRECATED

⚠️ **DEPRECATED: This file is now deprecated.**

## Use Docker Swarm Instead

This application now uses **Docker Swarm** exclusively for deployment. 

Please refer to:
- **[README-Docker-Swarm.md](./README-Docker-Swarm.md)** - Complete Docker Swarm deployment guide
- **[scripts/deploy-stack.sh](./scripts/deploy-stack.sh)** - Main deployment script
- **[scripts/docker-swarm-init.sh](./scripts/docker-swarm-init.sh)** - Swarm initialization

## Quick Start

```bash
# Initialize Docker Swarm (one-time)
./scripts/docker-swarm-init.sh

# Deploy development environment
./scripts/deploy-stack.sh dev

# Deploy production environment  
./scripts/deploy-stack.sh prod
```

## Why Docker Swarm?

- **Horizontal Scaling**: Easy service scaling with `docker service scale`
- **Rolling Updates**: Zero-downtime deployments
- **Load Balancing**: Built-in load balancer across replicas
- **Health Checks**: Automatic service health monitoring
- **High Availability**: Multi-node deployment support
- **Kubernetes Ready**: Easy migration path to Kubernetes

Docker Compose is no longer supported for this application.

## Migration from Docker Compose

If you were using the old Docker Compose setup:

1. **Stop old containers**: `docker-compose down`
2. **Initialize Swarm**: `./scripts/docker-swarm-init.sh`
3. **Deploy with Swarm**: `./scripts/deploy-stack.sh dev`

The new Docker Swarm setup provides:
- Better scalability
- Production-ready orchestration
- Built-in load balancing
- Health monitoring
- Rolling updates
- Multi-node support