# Healthcare Application Docker Swarm Deployment Guide

This comprehensive guide covers deploying the Healthcare Application Management Platform using **Docker Swarm** for both development and production environments with enterprise-grade scalability.

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Project Structure](#-project-structure)
3. [Development Deployment](#-development-deployment)
4. [Production Deployment](#production-deployment)
5. [Docker Swarm Setup](#-docker-swarm-setup)
6. [Scaling & Performance](#-scaling--performance)
7. [Monitoring & Logging](#-monitoring--logging)
8. [Backup & Recovery](#-backup--recovery)
9. [Troubleshooting](#-troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Minimum (Development):**

- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Docker: 20.10+
- Docker Swarm: Single node

**Recommended (Production):**

- CPU: 8+ cores per node
- RAM: 16GB+ per node
- Storage: 100GB+ SSD
- Docker: 20.10+
- Docker Swarm: Multi-node cluster

### Software Installation

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker info
```

## 📁 Project Structure

### Docker Swarm Files Organization

All Docker Swarm configurations are organized for production-ready deployment:

```text
healthapp-nextjs/
├── docker/                      # Docker Swarm configurations
│   ├── Dockerfile               # NextJS frontend container
│   ├── Dockerfile.backend       # Node.js API container  
│   ├── Dockerfile.dev           # Development container
│   └── docker-stack.yml         # Docker Swarm stack definition
├── scripts/                     # Deployment automation
│   ├── deploy-stack.sh          # Main deployment script
│   ├── deploy-prod.sh           # Production deployment
│   ├── deploy-prod.ps1          # Windows PowerShell
│   ├── docker-swarm-init.sh     # Swarm initialization
│   └── docker-cleanup.sh        # Cleanup utilities
├── app/                         # NextJS app directory
├── components/                  # React components
├── lib/                         # Utilities and helpers
├── src/                         # Backend API source
└── [config files]               # Application configuration
```

## 🚀 Development Deployment

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd healthapp-nextjs

# Make scripts executable
chmod +x scripts/*.sh

# Initialize Docker Swarm (one-time)
./scripts/docker-swarm-init.sh

# Deploy development environment
./scripts/deploy-stack.sh dev --auto-yes
```

### Development Services

The development stack includes horizontally scalable services:

| Service | Port | Replicas | Description |
|---------|------|----------|-------------|
| Frontend | 3002 | 1-3 | NextJS application |
| Backend | 3001 | 1-5 | Node.js API server |
| PostgreSQL | 5433 | 1 | Database |
| Redis | 6379 | 1 | Cache & sessions |
| pgAdmin | 5050 | 1 | Database management |

### Development Commands

```bash
# View all services
docker stack services healthapp

# Scale services
docker service scale healthapp_backend=3
docker service scale healthapp_frontend=2

# View service logs
docker service logs healthapp_backend -f
docker service logs healthapp_frontend -f

# Remove deployment
docker stack rm healthapp

# Clean up resources
./scripts/docker-cleanup.sh
```

### Custom Scaling During Deployment

```bash
# Deploy with custom scaling
./scripts/deploy-stack.sh dev --scale-backend=5 --scale-frontend=3 --auto-yes

# Deploy with specific IP
./scripts/deploy-stack.sh dev 192.168.1.100 --auto-yes
```

## 🏭 Production Deployment

### Pre-deployment Checklist

- [ ] Docker Swarm initialized on production cluster
- [ ] SSL certificates obtained and configured
- [ ] Environment variables configured
- [ ] DNS records configured
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring systems configured

### Environment Configuration

```bash
# Copy and configure production environment
cp env_files/.env.production.example env_files/.env.production

# Edit with production values
nano env_files/.env.production
```

### Required Production Variables

```bash
# Database Security
DB_PASSWORD=your-strong-database-password
REDIS_PASSWORD=your-redis-password

# Application Security
JWT_SECRET=your-256-bit-jwt-secret
SESSION_SECRET=your-session-secret

# AWS Configuration (for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name

# Application URLs
FRONTEND_URL=https://app.healthcareapp.com
NEXT_PUBLIC_API_URL=https://api.healthcareapp.com

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

### SSL Certificates

```bash
# Create SSL directory
mkdir -p ssl/

# Add your SSL certificates
cp your-certificate.pem ssl/cert.pem
cp your-private-key.pem ssl/key.pem

# Set proper permissions
chmod 600 ssl/key.pem
```

### Production Deployment

```bash
# Initialize Swarm cluster (if not done)
./scripts/docker-swarm-init.sh

# Deploy production stack
./scripts/deploy-prod.sh --version v1.0.0

# Deploy with scaling
./scripts/deploy-stack.sh prod --scale-backend=10 --scale-frontend=5
```

## 🐳 Docker Swarm Setup

### Single Node Setup (Development)

```bash
# Initialize swarm
./scripts/docker-swarm-init.sh

# Verify setup
docker node ls
docker network ls --filter driver=overlay
```

### Multi-Node Cluster (Production)

**On Manager Node:**

```bash
# Initialize swarm
docker swarm init --advertise-addr <MANAGER-IP>

# Get join tokens
docker swarm join-token worker
docker swarm join-token manager
```

**On Worker Nodes:**

```bash
# Join as worker
docker swarm join --token <WORKER-TOKEN> <MANAGER-IP>:2377
```

**Label Nodes for Service Placement:**

```bash
# Database nodes (usually manager nodes)
docker node update --label-add database=true node1

# Backend nodes (worker nodes)
docker node update --label-add backend=true node2
docker node update --label-add backend=true node3

# Frontend nodes (worker nodes)  
docker node update --label-add frontend=true node2
docker node update --label-add frontend=true node3
docker node update --label-add frontend=true node4

# Monitoring nodes (manager nodes)
docker node update --label-add monitoring=true node1
docker node update --label-add logging=true node1
```

### High Availability Configuration

For production clusters, ensure:

- **3+ manager nodes** (odd number for quorum)
- **Multiple worker nodes** for load distribution
- **Node labeling** for proper service placement
- **Resource reservations** for critical services
- **Health checks** for all services
- **Automated backup strategies**

## 🔄 Scaling & Performance

### Horizontal Scaling Commands

```bash
# Scale backend services (handles API load)
docker service scale healthapp_backend=10

# Scale frontend services (serves web traffic)
docker service scale healthapp_frontend=5

# Scale multiple services simultaneously
docker service scale healthapp_backend=15 healthapp_frontend=8

# View current scaling status
docker service ls --format "table {{.Name}}\\t{{.Replicas}}\\t{{.Image}}"
```

### Performance Scaling Examples

**High Traffic Scaling:**

```bash
# Scale for high traffic scenarios
docker service scale healthapp_backend=20      # More API capacity
docker service scale healthapp_frontend=10     # More web servers
docker service scale healthapp_nginx=3         # Load balancer redundancy
```

**Resource-Optimized Scaling:**

```bash
# Development/testing environment
docker service scale healthapp_backend=2
docker service scale healthapp_frontend=1

# Production environment
docker service scale healthapp_backend=12
docker service scale healthapp_frontend=6
```

### Advanced Service Updates

```bash
# Rolling update with specific parallelism
docker service update --replicas 10 --update-parallelism 2 healthapp_backend

# Update with resource constraints
docker service update --limit-memory 1GB --limit-cpu 0.75 healthapp_backend

# Update image version
docker service update --image healthapp-backend:v2.0 healthapp_backend
```

### Load Testing

```bash
# Install Apache Bench for load testing
sudo apt install apache2-utils

# Test API endpoints under load
ab -n 10000 -c 50 http://your-domain.com/api/health

# Test frontend performance
ab -n 1000 -c 20 http://your-domain.com/

# Monitor during load testing
watch docker service ls
```

## 📊 Monitoring & Logging

### Production Monitoring Stack

The production deployment includes comprehensive monitoring:

| Service | Port | Purpose | Replicas |
|---------|------|---------|----------|
| Prometheus | 9090 | Metrics collection | 1 |
| Grafana | 3001 | Dashboards & alerting | 1 |
| Elasticsearch | 9200 | Log aggregation | 1 |
| NGINX | 80/443 | Load balancer | 2 |

### Service Monitoring Commands

```bash
# View all service status
docker stack services healthapp

# Monitor service health in real-time
watch docker service ls

# Check service resource usage
docker stats --no-stream

# View service placement across nodes
docker service ps healthapp_backend --no-trunc
```

### Log Management

```bash
# View service logs
docker service logs healthapp_backend -f --tail 100
docker service logs healthapp_frontend -f --tail 50

# Export logs for analysis
docker service logs healthapp_backend --since 1h > backend-logs.txt

# Monitor logs from all replicas
docker service logs healthapp_backend -f --raw
```

### Grafana Dashboard Access

Access monitoring dashboard at `https://monitoring.healthcareapp.com`:

- Username: `admin`
- Password: `${GRAFANA_PASSWORD}`

Pre-configured dashboards include:

- Application performance metrics
- Database query performance
- System resource utilization
- Service health and availability
- Error rates and response times

## 💾 Backup & Recovery

### Automated Backup Service

The stack includes an automated backup service that:

- Creates daily PostgreSQL dumps
- Backs up Redis data snapshots
- Stores configuration files
- Uploads to AWS S3 (if configured)

```bash
# Manual backup execution
./scripts/backup-prod.sh

# View backup service logs
docker service logs healthapp_backup -f
```

### Database Backup & Restore

```bash
# Manual database backup
docker exec $(docker ps -q -f name=healthapp_postgres) \
    pg_dump -U healthapp_user healthapp_prod > backup-$(date +%Y%m%d).sql

# Restore from backup
docker exec -i $(docker ps -q -f name=healthapp_postgres) \
    psql -U healthapp_user -d healthapp_prod < backup-20240101.sql
```

### Full Stack Recovery

```bash
# Emergency stack recovery
docker stack rm healthapp
sleep 30  # Wait for cleanup
./scripts/deploy-prod.sh --skip-migration

# Restore database after stack recovery
docker exec -i $(docker ps -q -f name=healthapp_postgres) \
    psql -U healthapp_user -d healthapp_prod < latest-backup.sql
```

## 🔍 Troubleshooting

### Service Health Diagnostics

```bash
# Check service status and health
docker service ps healthapp_backend --no-trunc

# View detailed service configuration
docker service inspect healthapp_backend

# Check service resource constraints
docker service ls --format "table {{.Name}}\\t{{.Replicas}}\\t{{.Image}}"
```

### Common Issues & Solutions

**Service Won't Start:**

```bash
# Check service logs for errors
docker service logs healthapp_backend --tail 100

# Verify node resources
docker node ls
docker system df

# Check placement constraints
docker service inspect healthapp_backend | grep -A 10 Placement
```

**Database Connection Issues:**

```bash
# Test database connectivity
docker exec $(docker ps -q -f name=healthapp_postgres) \
    pg_isready -U healthapp_user -d healthapp_prod

# Check database service health
docker service logs healthapp_postgres --tail 50

# Verify network connectivity
docker network inspect healthapp-backend
```

**Scaling Issues:**

```bash
# Check node capacity for scaling
docker node ls --format "table {{.Hostname}}\\t{{.Status}}\\t{{.Availability}}"

# Verify resource availability
docker node inspect <node-name> | grep -A 10 Resources

# Check service update status
docker service ps healthapp_backend
```

### Performance Troubleshooting

**High Memory Usage:**

```bash
# Identify memory-intensive services
docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"

# Update service with memory limits
docker service update --limit-memory 1GB --reserve-memory 512MB healthapp_backend

# Force service restart if needed
docker service update --force healthapp_backend
```

**Network Performance Issues:**

```bash
# Test inter-service connectivity
docker exec $(docker ps -q -f name=healthapp_backend) nslookup postgres

# Check network throughput
docker exec $(docker ps -q -f name=healthapp_backend) wget -O /dev/null http://frontend:3000

# Verify load balancer performance
docker service logs healthapp_nginx --tail 100
```

## 🚨 Emergency Procedures

### Complete Stack Recovery

```bash
# Stop all services gracefully
docker stack rm healthapp

# Wait for complete cleanup
sleep 60

# Redeploy with latest configuration
./scripts/deploy-prod.sh --version latest

# Restore from backup if needed
./scripts/restore-prod.sh /path/to/backup.tar.gz
```

### Service Rollback

```bash
# Rollback individual service
docker service rollback healthapp_backend
docker service rollback healthapp_frontend

# Rollback to specific version
docker service update --image healthapp-backend:v1.0 healthapp_backend
```

### Zero-Downtime Updates

```bash
# Update with rolling deployment
docker service update --update-parallelism 1 --update-delay 30s healthapp_backend

# Monitor update progress
watch docker service ps healthapp_backend
```

## 📚 Additional Resources

### Docker Swarm Best Practices

- Use placement constraints for service distribution
- Implement health checks for all services
- Set resource limits and reservations
- Use secrets for sensitive configuration
- Implement proper backup strategies
- Monitor service performance continuously

### Security Considerations

- Enable Docker Content Trust
- Use Docker secrets for sensitive data
- Implement network segmentation
- Regular security updates
- Access controls and audit logging
- SSL/TLS for all external communications

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Swarm Initialization
./scripts/docker-swarm-init.sh

# Deployment
./scripts/deploy-stack.sh dev|prod [--auto-yes] [--scale-backend=N] [--scale-frontend=N]

# Service Management
docker stack services healthapp
docker service logs <service> -f
docker service scale <service>=<replicas>

# Monitoring
docker service ps <service>
docker stats --no-stream
docker system df

# Maintenance
docker system prune -a
./scripts/docker-cleanup.sh
```

### Scaling Examples

```bash
# Development scaling
docker service scale healthapp_backend=3 healthapp_frontend=2

# Production scaling
docker service scale healthapp_backend=15 healthapp_frontend=8

# High-availability scaling
docker service scale healthapp_backend=20 healthapp_frontend=10 healthapp_nginx=3
```

---

*This guide provides comprehensive Docker Swarm deployment instructions for the Healthcare Application Management Platform. The platform is designed for enterprise-grade scalability with horizontal scaling, load balancing, and zero-downtime updates.*
