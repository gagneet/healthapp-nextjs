# 🚀 Quick Start Guide - Healthcare Management Platform
## **Pure Next.js Full-Stack + NextAuth.js + Prisma Architecture**

## ⚡ 5-Minute Setup

### Prerequisites Check

```bash
# Verify you have these installed:
node --version    # Should be 22.18.0+ (LTS)
docker --version  # Any recent version  
git --version     # Any recent version
```

### One-Command Local Development

```bash
# 1. Clone repository
git clone <repository-url>
cd healthapp-nextjs

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Quick start with Next.js application
chmod +x quick-start-nextjs.sh
./quick-start-nextjs.sh
```

## 🎯 What You Get

After successful deployment (Pure Next.js Architecture):

| Service | URL | Purpose |
|---------|-----|---------|
| **🏥 Next.js Full-Stack App** | [http://localhost:3000](http://localhost:3000) | **Complete Healthcare Management Platform** |
| **💊 Health Check** | [http://localhost:3000/api/health](http://localhost:3000/api/health) | **Real Database Statistics** |
| **📊 PostgreSQL** | localhost:5432 | Advanced Healthcare Schema with Prisma |
| **⚡ Redis Cache** | localhost:6379 | Session management and caching |
| **🗄️ Database Admin** | [http://localhost:5050](http://localhost:5050) | **PgAdmin Interface** |

### **Current Architecture** ✅

- ✅ **Pure Next.js 14 Full-Stack** with App Router (port 3000)
- ✅ **NextAuth.js Authentication** with healthcare role-based permissions
- ✅ **Integrated API routes** in `/app/api` directory - no separate backend
- ✅ **Prisma ORM** with introspected PostgreSQL healthcare schema  
- ✅ **Business ID generation** (DOC-2025-001, PAT-2025-001, HSP-2025-001)
- ✅ **Type-safe operations** with full TypeScript integration
- ✅ **Simplified deployment** - single Next.js service only

### Default Access

- **Application**: [http://localhost:3000](http://localhost:3000)
- **Doctor Dashboard**: `/dashboard/doctor` (requires authentication)  
- **Patient Dashboard**: `/dashboard/patient` (requires authentication)
- **Admin Dashboard**: `/dashboard/admin` (requires authentication)
- **NextAuth.js Sign In**: `/api/auth/signin`
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## ⚙️ Environment Configuration

The deployment script will create `.env.local` if it doesn't exist.

### Required Environment Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nextjs_healthcare_secret_key_for_development_not_for_production

# Database Connection (Prisma)
DATABASE_URL="postgresql://healthapp_user:pg_password@localhost:5432/healthapp_dev?schema=public"

# Application Settings
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Generate Secure NextAuth Secret

```bash
# Run this command to generate a secure NextAuth secret:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🔧 Post-Deployment Verification

### Check All Services

```bash
docker-compose -f docker/docker-compose.nextjs-local.yml ps
```

Expected output:

```text
              Name                            State           Ports
-------------------------------------------------------------------------
healthapp-nextjs-app-local        Up      0.0.0.0:3000->3000/tcp
healthapp-nextjs-postgres-local   Up      0.0.0.0:5432->5432/tcp
healthapp-nextjs-redis-local      Up      0.0.0.0:6379->6379/tcp
healthapp-nextjs-pgadmin-local    Up      0.0.0.0:5050->80/tcp
```

### Test API Health

```bash
curl http://localhost:3000/api/health
# Expected: {"status":true,"payload":{"data":{...}}}
```

### Test Frontend

```bash
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

## 🆘 Quick Troubleshooting

### Common Issues & Solutions

**Port Already in Use:**

```bash
# Kill processes using conflicting ports
sudo fuser -k 3000/tcp 5432/tcp 6379/tcp
```

**Database Connection Issues:**

```bash
# Check PostgreSQL container
docker logs healthapp-nextjs-postgres-local
docker restart healthapp-nextjs-postgres-local
```

**Complete Reset (Nuclear Option):**

```bash
# Stop everything and start fresh
docker-compose -f docker/docker-compose.nextjs-local.yml down -v
sleep 10
./quick-start-nextjs.sh
```

## 📚 Useful Commands

### Docker Management

```bash
# View logs
docker-compose -f docker/docker-compose.nextjs-local.yml logs -f nextjs

# Restart Next.js service
docker-compose -f docker/docker-compose.nextjs-local.yml restart nextjs

# Stop all services
docker-compose -f docker/docker-compose.nextjs-local.yml down
```

### Database Operations

```bash
# Prisma operations (get container ID first)
NEXTJS_CONTAINER=$(docker ps -q -f name=healthapp-nextjs-app-local)
docker exec $NEXTJS_CONTAINER npx prisma migrate dev
docker exec $NEXTJS_CONTAINER npx prisma db seed
docker exec $NEXTJS_CONTAINER npx prisma migrate reset
```

### Development

```bash
# Run locally (without Docker)
npm run dev          # Full-stack Next.js on :3000
# Note: No separate backend needed - APIs are integrated
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

1. **Explore the UI**: Visit [http://localhost:3000](http://localhost:3000)
2. **Sign In**: Use NextAuth.js at `/api/auth/signin`
3. **Create Test Data**: Use Prisma seed data for testing
4. **Database Exploration**: Use pgAdmin at [http://localhost:5050](http://localhost:5050)
5. **API Testing**: Test endpoints at [http://localhost:3000/api/health](http://localhost:3000/api/health)
6. **Read Full Guide**: See `SETUP_GUIDE.md` for detailed configuration

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
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health) (after deployment)
- **Docker Guide**: `docs/docker_deployment_guide.md`

---

**🎉 That's it! Your Healthcare Management Platform is ready to use!**

## *Last updated: August 2025 - Pure Next.js Migration Complete*
