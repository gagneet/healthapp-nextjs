# 🚀 Quick Start Guide - Healthcare Management Platform

## ⚡ 5-Minute Setup

### Prerequisites Check

```bash
# Verify you have these installed:
node --version    # Should be 18.0.0+
docker --version  # Any recent version
git --version     # Any recent version
```

### One-Command Deployment

```bash
# 1. Clone repository
git clone <repository-url>
cd healthapp-nextjs

# 2. Install dependencies
npm install

# 3. Deploy everything (includes migrations & seeding)
chmod +x scripts/deploy-dev.sh
./scripts/deploy-dev.sh
```

## 🎯 What You Get

After successful deployment:

| Service | URL | Purpose |
|---------|-----|---------|
| **🏥 Frontend** | [http://localhost:3002](http://localhost:3002) | Healthcare Management UI |
| **🔧 Backend API** | [http://localhost:3001](http://localhost:3001) | REST API Server |
| **📊 pgAdmin** | [http://localhost:5050](http://localhost:5050) | Database Management |
| **📈 API Docs** | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) | API Documentation |

### Default Credentials

- **pgAdmin**: admin @healthapp.com / admin123
- **Application**: Create account through frontend UI

## ⚙️ Environment Configuration

The deployment script will prompt you to configure `.env.development` if it doesn't exist.

### Required Changes (Minimum)

```bash
# Edit .env.development
POSTGRES_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-256-bit-secret-key-here (25af6001e43881f727388f44e0f6fff837510b0649fe9393987f009c595156f778442654270516863b00617b478aa46dea6311f74fb95325d3c9a344b125d033)
```

### Generate Secure JWT Secret

```bash
# Run this command to generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔧 Post-Deployment Verification

### Check All Services

```bash
docker stack services healthapp
```

Expected output:

```text
         Name                       State           Ports
----------------------------------------------------------------
healthapp-backend-dev     Up      0.0.0.0:3001->3001/tcp
healthapp-frontend-dev    Up      0.0.0.0:3002->3000/tcp
healthapp-pgadmin-dev     Up      0.0.0.0:5050->80/tcp
healthapp-postgres-dev    Up      0.0.0.0:5433->5432/tcp
healthapp-redis-dev       Up      0.0.0.0:6379->6379/tcp
```

### Test API Health

```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test Frontend

```bash
curl -I http://localhost:3002
# Expected: HTTP/1.1 200 OK
```

## 🆘 Quick Troubleshooting

### Common Issues & Solutions

**Port Already in Use:**

```bash
# Kill processes using conflicting ports
sudo fuser -k 3000/tcp 3001/tcp 5432/tcp
```

**Database Connection Issues:**

```bash
# Check PostgreSQL service
docker service logs healthapp_postgres -f
docker service update --force healthapp_postgres
```

**Complete Reset (Nuclear Option):**

```bash
# Stop everything and start fresh
docker stack rm healthapp
sleep 30
./scripts/deploy-stack.sh dev --auto-yes
```

## 📚 Useful Commands

### Docker Management

```bash
# View logs
docker service logs healthapp_[service] -f

# Restart specific service
docker service update --force healthapp_[service]

# Scale services
docker service scale healthapp_backend=5 healthapp_frontend=3

# Stop all services
docker stack rm healthapp
```

### Database Operations

```bash
# Database operations (get container ID first)
BACKEND_CONTAINER=$(docker ps -q -f name=healthapp_backend)
docker exec $BACKEND_CONTAINER npm run migrate
docker exec $BACKEND_CONTAINER npm run seed
docker exec $BACKEND_CONTAINER npm run migrate:undo
```

### Development

```bash
# Run locally (without Docker)
npm run backend:dev  # Backend on :3001
npm run dev          # Frontend on :3000
```

## 🎯 Key Features Available

Once deployed, you have access to:

- ✅ **Patient Management** - Complete CRUD operations
- ✅ **Provider Management** - Doctor profiles and specialties  
- ✅ **Medication Tracking** - Prescription management
- ✅ **Appointment Scheduling** - Calendar system
- ✅ **Care Plans** - Treatment planning
- ✅ **Vital Signs** - Health monitoring
- ✅ **Real-time Notifications** - Alert system
- ✅ **File Uploads** - Document management
- ✅ **API Documentation** - Swagger/OpenAPI docs
- ✅ **Database Admin** - pgAdmin interface

## 📝 Next Steps

1. **Explore the UI**: Visit [http://localhost:3002](http://localhost:3002)
2. **Create Admin Account**: Use the registration form
3. **Review API Docs**: Visit [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
4. **Database Exploration**: Use pgAdmin at [http://localhost:5050](http://localhost:5050)
5. **Read Full Guide**: See `SETUP_GUIDE.md` for detailed configuration

## 🔒 Security Notes

**Development Environment:**

- Uses development passwords (change for production!)
- CORS is open for localhost
- Debug logging is enabled
- `POSTGRES_HOST_AUTH_METHOD=trust` allows passwordless connections

**Before Production:**

- Change all passwords and secrets
- Enable SSL/TLS
- Configure proper firewall rules
- Set up monitoring and backups
- Review security checklist in `SETUP_GUIDE.md`

---

## 💡 Need Help?

- **Full Setup Guide**: `SETUP_GUIDE.md`
- **Architecture Overview**: `README.md`
- **API Documentation**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (after deployment)
- **Docker Guide**: `docs/docker_deployment_guide.md`

---

**🎉 That's it! Your Healthcare Management Platform is ready to use!**

## *Last updated: January 2025*
