# Healthcare Management Platform

A **production-ready healthcare management system** built with **Next.js 14** full-stack architecture, featuring **video consultations, laboratory integration, IoT device monitoring, and medical safety systems** with enterprise-grade security and **Prisma ORM**.

## 🎯 **Current Implementation Status (January 2025)**

### ✅ **Fully Implemented & Production-Ready**
- **Phase 1**: Medical Safety & Drug Interactions (100%)
- **Phase 3**: IoT Device Integration & Advanced Monitoring (100%) 
- **Phase 4**: Telemedicine & Laboratory Integration (85%)

### 🚧 **Development Roadmap**
- **Phase 2**: Indian Healthcare Integration (Deferred)
- **Phase 4**: Healthcare Analytics & Patient Gamification (15% remaining)

## 🚀 **Enterprise Healthcare Features**

### 📹 **Telemedicine Platform**
- **WebRTC Video Consultations**: Professional doctor-patient video sessions
- **Smart Booking System**: Automated scheduling with availability management
- **Consultation Recording**: HIPAA-compliant session recording and storage
- **Real-time Chat & Notes**: In-session communication and documentation

### 🧪 **Laboratory Integration**
- **Test Ordering System**: Complete lab test catalog (CBC, CMP, Lipid, HbA1c, TSH, UA)
- **Results Processing**: Automated result analysis with critical value alerting
- **External Lab APIs**: Ready for integration with major lab providers
- **Cost Management**: Automated fee calculation and insurance processing

### 🔒 **Medical Safety Systems**
- **Drug Interaction Checking**: Real-time medication safety validation
- **Allergy Management**: Patient-specific allergy tracking and alerts
- **Emergency Alerts**: Critical value notifications and emergency protocols
- **Comprehensive Audit Logging**: HIPAA-compliant activity tracking

### 📱 **IoT Device Integration**
- **Connected Device Management**: Support for medical monitoring devices
- **Real-time Data Streaming**: Live vital sign monitoring and alerts
- **Device Plugin Architecture**: Extensible system for new device types
- **Automated Health Monitoring**: AI-powered health trend analysis

## 🏗️ Architecture

This application uses a **modern Next.js 14 full-stack architecture** with **Auth.js v5 authentication**:

- **Full-Stack**: Next.js 14 with App Router and API routes handling both frontend and backend
- **Database**: PostgreSQL with Prisma ORM v6+ for type-safe database operations  
- **Authentication**: Auth.js v5 (NextAuth.js v5) with PrismaAdapter and database-backed sessions
- **Security**: Role-based access control with healthcare-specific business logic enforcement
- **Deployment**: Universal Docker Swarm deployment scripts with automated database migrations
- **Session Management**: Database-backed sessions with Auth.js v5 for enhanced security over JWT tokens

```text
healthapp-nextjs/
├── 🔧 Next.js 14 Full-Stack Application
│   ├── app/                  # Next.js 14 App Router
│   │   ├── api/              # API routes (backend functionality)
│   │   │   ├── admin/        # Admin management APIs
│   │   │   ├── auth/         # Auth.js v5 authentication endpoints
│   │   │   ├── doctors/      # Doctor management and dashboard APIs
│   │   │   ├── patients/     # Patient management APIs
│   │   │   ├── appointments/ # Appointment scheduling
│   │   │   ├── care-plans/   # Care plan management  
│   │   │   ├── medications/  # Medication tracking APIs
│   │   │   ├── vitals/       # Vital signs monitoring
│   │   │   ├── symptoms/     # Symptom reporting
│   │   │   ├── lab/          # Laboratory integration
│   │   │   ├── video-consultations/ # Telemedicine APIs
│   │   │   └── health/       # Health check endpoint
│   │   ├── auth/             # Authentication UI pages
│   │   └── dashboard/        # Role-based dashboard pages
│   │       ├── doctor/       # Doctor interface with real-time data
│   │       ├── patient/      # Patient interface with care tracking
│   │       ├── hospital/     # HSP interface
│   │       └── admin/        # System admin interface
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components (3D body diagram, etc.)
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── video-consultation/ # Telemedicine components
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utilities and configurations
│   │   ├── auth.ts           # Auth.js v5 configuration with healthcare roles
│   │   ├── prisma.ts         # Prisma client with connection pooling
│   │   ├── api-services.ts   # Healthcare API service functions
│   │   ├── seed.ts           # TypeScript-based database seeding
│   │   └── services/         # Business logic services
│   └── types/                # TypeScript definitions
├── 🗄️ Database & Schema (Prisma v6+)
│   └── prisma/
│       ├── schema.prisma     # 46+ healthcare models with proper relations
│       ├── migrations/       # Versioned database migrations
│       └── seed files        # Production-ready seeding system
├── 🐳 Universal Deployment System
│   ├── docker/               # Multi-stage production Dockerfiles
│   └── scripts/              # Universal deploy.sh for dev/test/prod
│       └── deploy.sh         # Single script with environment support
└── 🚀 Production Features (2025)
    ├── Auth.js v5 with database sessions and healthcare RBAC
    ├── Prisma ORM v6+ with PostgreSQL and connection pooling
    ├── Real-time dashboard APIs with medical safety features
    ├── Docker Swarm deployment with proper service orchestration
    ├── Medical device integration and IoT data streaming
    ├── Telemedicine with WebRTC video consultations
    ├── Laboratory integration with test ordering and results
    └── Enhanced security with audit logging and compliance features
```

## ✨ Key Features

### Healthcare Management

- **👥 Patient Management**: Complete patient lifecycle with medical records
- **👨‍⚕️ Provider Management**: Doctor profiles, HSP profiles, and specialties
- **💊 Medication Tracking**: Prescription management with adherence monitoring
- **📅 Appointment System**: Scheduling with provider availability
- **📋 Care Plans**: Templated and customized treatment plans
- **📊 Vital Signs**: Real-time monitoring with 2D/3D body mapping
- **🏥 Admin Dashboard**: System administration and provider management

### Technical Features

- **🔐 Auth.js v5 Authentication**: Modern authentication with database sessions and healthcare RBAC
- **🚀 Next.js 14 Full-Stack**: App Router with unified frontend/backend development
- **📱 Responsive Design**: Mobile-first healthcare interfaces optimized for clinical workflows
- **🎯 Type Safety**: End-to-end TypeScript with Prisma ORM v6+ and strict type checking
- **🔍 Advanced Search**: Full-text search with PostgreSQL and healthcare-specific queries
- **🛡️ Healthcare Compliance**: HIPAA-compliant data handling with comprehensive audit logging
- **♿ Accessibility**: WCAG 2.1 AA compliant interfaces for healthcare accessibility
- **🐳 Universal Deployment**: Single deployment script supporting dev/test/prod environments
- **⚡ Real-time APIs**: Live dashboard data with proper database relationships
- **🔒 Medical Safety**: Drug interaction checking, allergy management, and emergency alerts

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ LTS (required for latest Auth.js v5 and ES modules)
- **PostgreSQL** 17+ (or Docker for containerized setup)
- **Docker** & **Docker Swarm** (recommended for production deployment)
- **TypeScript** knowledge (the entire system is TypeScript-first)

### Installation Options

Choose your preferred deployment method using the **universal deployment system**:

#### **Option 1: Local Development Environment**

Complete development setup with Docker Compose:

```bash
# Clone repository
git clone <repository-url>
cd healthapp-nextjs

# Deploy local development environment
./scripts/deploy.sh dev deploy --migrate --seed
# OR use the dedicated local script
./scripts/deploy-local.sh start --migrate --seed
```

**Includes**: PostgreSQL, Redis, Next.js app, PgAdmin, Redis Commander, MailHog

#### **Option 2: Development Server (Docker Swarm)**

For team development server deployment:

```bash
# Deploy development server with Docker Swarm
./scripts/deploy.sh dev deploy --host-ip 192.168.1.100 --migrate --seed
```

#### **Option 3: Test Environment**

For automated testing and QA:

```bash
# Deploy test environment with automated testing
./scripts/deploy.sh test deploy --migrate --seed --test
```

#### **Option 4: Production Deployment**

For production deployment with high availability:

```bash
# Set required Auth.js v5 environment variables
export NEXTAUTH_SECRET=healthcare-nextauth-secret-2025-secure
export POSTGRES_PASSWORD=secure_prod_password
export REDIS_PASSWORD=secure_redis_password

# Deploy to production with full stack
./scripts/deploy.sh prod deploy --domain healthapp.gagneet.com --migrate --seed --auto-yes
```

#### **Option 5: Manual Setup**

```bash
# Clone and install
git clone <repository-url>
cd healthapp-nextjs
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your PostgreSQL connection

# Set up database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Start development
npm run dev
```

### Access Your Application

- **Healthcare App**: [http://localhost:3002](http://localhost:3002) (Next.js full-stack application)
- **Doctor Dashboard**: [http://localhost:3002/dashboard/doctor](http://localhost:3002/dashboard/doctor)  
- **Patient Dashboard**: [http://localhost:3002/dashboard/patient](http://localhost:3002/dashboard/patient)
- **Admin Dashboard**: [http://localhost:3002/dashboard/admin](http://localhost:3002/dashboard/admin)
- **Health Check**: [http://localhost:3002/api/health](http://localhost:3002/api/health)

### Test User Accounts

**Doctor Accounts** (for testing healthcare provider features):
- Email: `doctor@healthapp.com` / Password: `T3mpP@ssw0rd168!`  
- Email: `doctor1@healthapp.com` / Password: `T3mpP@ssw0rd168!`

**Other Test Accounts** (seeded with development data):
- Various patient, HSP, and admin accounts with password: `T3mpP@ssw0rd168!` (or from `SEED_DEFAULT_PASSWORD` env var)

### Administrative Interfaces (Docker Setup)
- **Database Admin (PgAdmin)**: [http://localhost:5050](http://localhost:5050)
- **Redis Commander**: [http://localhost:8081](http://localhost:8081) (if available)
- **System Monitoring**: Health check endpoint for uptime monitoring

## 🐛 Troubleshooting

### Common Deployment Issues

**1. Database Connection Errors**
```bash
# Check if PostgreSQL is ready
docker exec $(docker ps -q -f name=postgres) pg_isready -U healthapp_user

# Check deployment status
./scripts/deploy.sh [env] status
```

**2. Seeding Failures**  
```bash
# Check container logs
docker logs $(docker ps -q -f name=app)

# Re-run seeds manually
docker exec $(docker ps -q -f name=app) npm run seed
```

**3. Auth.js v5 Session Issues**
- Ensure `NEXTAUTH_SECRET` is set and consistent across deployments
- Verify database sessions table exists after migration
- Check browser cookies are not blocking cross-site requests

**4. Docker Swarm Service Issues**
```bash
# Check service status
docker stack services healthapp-[env]

# View service logs  
docker service logs healthapp-[env]_app -f
```

**5. Port Conflicts**
- Default ports: 3002 (app), 5432 (postgres), 6379 (redis), 5050 (pgadmin)
- Configure different ports in `.env.[environment]` files if needed

## 🔧 Configuration

### Environment Variables

#### **Required Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `NEXTAUTH_URL` | NextAuth.js URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret (32+ chars) | `your-nextauth-secret-32-chars-min` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/healthapp` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `http://localhost:3000/api` |

#### **Production Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `secure_production_password` |
| `REDIS_PASSWORD` | Redis password | `secure_redis_password` |
| `PGADMIN_PASSWORD` | PgAdmin password | `secure_admin_password` |

### Healthcare Role Configuration

The application supports four main healthcare roles:

- **DOCTOR**: Full medical privileges (prescriptions, diagnoses, care plans)
- **HSP** (Health Service Provider): Limited privileges (no prescriptions)
- **PATIENT**: Read-only access to own data, can record vitals
- **SYSTEM_ADMIN**: Full system administration access

## 📚 API Documentation

### Base URL

- **API Routes**: `/api/*`

### Response Format

All API responses follow a consistent healthcare-compliant structure:

```json
{
  "status": true,
  "statusCode": 200,
  "payload": {
    "data": {},
    "message": "Success message"
  }
}
```

### Authentication

Auth.js v5 (NextAuth.js v5) with PrismaAdapter manages authentication with healthcare RBAC:

```typescript
// API route example with Auth.js v5 protection
import { getServerSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user || !['DOCTOR', 'HSP'].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Healthcare business logic with role enforcement...
  const dashboardData = await getDoctorDashboard(session.user.id)
  return NextResponse.json(formatApiSuccess(dashboardData))
}
```

**Auth.js v5 Features (Latest 2025):**
- **Database Sessions**: Enhanced security with PrismaAdapter instead of JWT tokens
- **Healthcare RBAC**: Role-based access control with medical business logic enforcement  
- **Improved Performance**: Faster session handling and reduced client-side overhead
- **TypeScript-First**: Full type safety with healthcare role definitions
- **Medical Compliance**: Extended session timeouts and audit logging for healthcare workflows
- **Production-Ready**: PostgreSQL integration with connection pooling and migration support

### Core API Endpoints

#### 🔐 Authentication (Auth.js v5)

- `POST /api/auth/signin` - Auth.js v5 credential sign in
- `POST /api/auth/signout` - Sign out with session cleanup
- `GET /api/auth/session` - Get current session with healthcare roles
- `GET /api/auth/[...nextauth]` - Auth.js v5 handler for all auth routes
- `POST /api/auth/register` - User registration with healthcare role assignment

#### 👥 Patient Management

- `GET /api/patients` - Get patient list (role-based filtering)
- `GET /api/patients/[id]` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/[id]` - Update patient information

#### 👨‍⚕️ Doctor Management (Real-time APIs)

- `GET /api/doctors/dashboard` - Get doctor dashboard with live statistics
- `GET /api/doctors/profile` - Get doctor profile with specialty info
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/recent-patients` - Get recent patient activity
- `GET /api/doctors/critical-alerts` - Get urgent patient alerts
- `GET /api/doctors/adherence-analytics` - Get medication adherence data

#### 💊 Care Plans & Medications

- `GET /api/care-plans` - Get care plans
- `POST /api/care-plans` - Create care plan
- `GET /api/care-plans/templates` - Get care plan templates
- `POST /api/care-plans/templates` - Create template

#### 📅 Appointments

- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/[id]` - Update appointment

#### 📊 Vitals & Symptoms

- `POST /api/vitals` - Record vital signs
- `GET /api/vitals/[patientId]` - Get patient vitals
- `POST /api/symptoms` - Report symptoms with body mapping

#### 🩺 Medical Safety & Integrations (New 2025)

- `GET /api/drug-interactions/check` - Check medication interactions
- `GET /api/patient-allergies` - Get patient allergy information
- `POST /api/emergency-alerts` - Create emergency medical alerts
- `GET /api/lab/tests` - Get available laboratory tests
- `POST /api/lab/orders` - Order laboratory tests
- `GET /api/video-consultations` - Telemedicine consultation management
- `GET /api/health` - System health check with database connectivity

## 🚀 Latest Updates (January 2025)

### ✅ **Recently Fixed Issues**

1. **Auth.js v5 Migration Completed**
   - Upgraded from NextAuth.js v4 to Auth.js v5 with database sessions
   - Fixed authentication credential validation and password hashing
   - Implemented healthcare-specific role-based access control

2. **Production Deployment System**
   - Fixed Docker container dependency management for seeding
   - Implemented proper database migration timing with service health checks
   - Added comprehensive Docker Swarm deployment with service orchestration

3. **Real Dashboard APIs**
   - Replaced mock data with real Prisma database queries
   - Fixed dashboard statistics to show actual patient counts and appointments
   - Implemented proper healthcare relationship modeling

4. **TypeScript Consistency**  
   - Eliminated JavaScript/ES module files in favor of TypeScript-first approach
   - Fixed import path issues and webpack build errors
   - Implemented proper TypeScript compilation for database seeding

5. **Medical Safety Features**
   - Added drug interaction checking with RxNorm integration
   - Implemented patient allergy management and emergency alerts
   - Enhanced vital sign monitoring with medical alert thresholds

### 🔧 **Key Technical Improvements**

- **Database Connection Pooling**: Prisma v6+ with retry logic for production reliability
- **Enhanced Security**: HIPAA-compliant audit logging and role-based data access
- **Performance Optimization**: Real-time API responses with proper database indexing
- **Medical Device Integration**: IoT device plugin architecture for health monitoring
- **Telemedicine Platform**: WebRTC video consultations with recording capabilities

#### 🏥 Admin Management

- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/doctors` - Manage doctors
- `POST /api/admin/doctors` - Create doctor account

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start Next.js development server
npm run build                  # Build Next.js production bundle  
npm start                      # Start Next.js production server

# Database Management (Prisma)
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations in production
npx prisma db seed            # Seed database with initial data
npx prisma studio             # Open Prisma Studio (database GUI)

# Code Quality
npm run lint                  # Run Next.js ESLint
npm run type-check            # TypeScript type checking
npm run lint:fix              # Auto-fix ESLint issues

# Testing
npm test                     # Run Jest test suite
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate test coverage report
```

### Database Development

The application uses **Prisma ORM** with **PostgreSQL**:

```bash
# Create new migration
npx prisma migrate dev --name add-new-feature

# Reset database (development only)
npx prisma migrate reset

# Generate TypeScript client
npx prisma generate

# Seed with healthcare data
npx prisma db seed
```

### Healthcare Business Logic

The application enforces strict healthcare business rules:

```typescript
// Example: Only doctors can prescribe medications
if (session.user.role !== 'DOCTOR') {
  return NextResponse.json({
    status: false,
    statusCode: 403,
    payload: { 
      error: { 
        status: 'forbidden', 
        message: 'Only doctors can prescribe medications' 
      } 
    }
  }, { status: 403 });
}
```

## 🐳 Deployment Options

### Universal Deployment System

Use the **universal deployment script** for all environments:

```bash
# Universal deployment script syntax
./scripts/deploy.sh [environment] [command] [options]
# Environments: dev, test, prod
# Commands: deploy, stop, logs, status, migrate, seed, scale
```

### Development Environment

Full containerized development setup:

```bash
# Start complete development environment
./scripts/deploy.sh dev deploy --migrate --seed --domain localhost
# OR use dedicated local script
./scripts/deploy-local.sh start --migrate --seed

# Services included:
# - Next.js application (port 3002)
# - PostgreSQL database (port 5432) 
# - Redis cache (port 6379)
# - PgAdmin (port 5050)
# - Redis Commander (port 8081)
# - MailHog email testing (port 8025)
```

### Test Environment

```bash
# Deploy test environment with automated testing
./scripts/deploy.sh test deploy --migrate --seed --test

# Run tests only
./scripts/deploy.sh test test

# Includes:
# - Automated test execution
# - Separate port allocation (3003, 5433, etc.)
# - CI/CD integration ready
```

### Production Deployment

```bash
# Set required NextAuth.js environment variables
export NEXTAUTH_SECRET="your-32-char-nextauth-secret"
export POSTGRES_PASSWORD="secure_production_password"
export REDIS_PASSWORD="secure_redis_password"
export PGADMIN_PASSWORD="secure_admin_password"

# Deploy to production with Docker Swarm
./scripts/deploy.sh prod deploy \
  --domain your-healthcare-app.com \
  --scale 4 \
  --migrate

# Zero-downtime updates
./scripts/deploy.sh prod update

# Create backups
./scripts/deploy.sh prod backup

# Includes:
# - Docker Swarm orchestration
# - High availability scaling
# - Automated health checks
# - Zero-downtime deployments
# - Database-first deployment approach
```

### Service Management

#### Docker Swarm Services (Production/Test/Dev)

```bash
# Check service status
./scripts/deploy.sh prod status

# View service logs
./scripts/deploy.sh prod logs
./scripts/deploy.sh prod logs app  # specific service

# Scale services
./scripts/deploy.sh prod scale 6

# Update services (zero-downtime)
./scripts/deploy.sh prod update

# Database management
docker exec -it $(docker ps -q -f name=postgres) psql -U healthapp_user -d healthapp
```

#### Local Development Services

```bash
# Check service status
./scripts/deploy-local.sh status

# View logs
./scripts/deploy-local.sh logs

# Restart services
./scripts/deploy-local.sh restart

# Database access
docker exec -it healthapp-postgres psql -U healthapp_user -d healthapp
```

## 🔒 Security & Healthcare Compliance

### Security Features

- **NextAuth.js with PrismaAdapter**: Modern authentication with database-backed sessions
- **Enhanced Session Security**: Database sessions instead of JWT tokens
- **Role-Based Access Control**: Healthcare workflow compliance
- **Input Validation**: Zod schemas for all healthcare data
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **XSS Protection**: Next.js built-in security features
- **Healthcare Audit Logging**: Complete activity tracking
- **Environment Security**: Secure credential management for multi-environment deployments

### HIPAA Compliance Features

- **Role-Based Data Access**: Doctors, HSPs, and Patients have appropriate data access
- **Audit Logging**: All healthcare data access is logged
- **Data Encryption**: Sensitive data encrypted in transit and at rest
- **Access Controls**: Business logic enforces medical workflow rules
- **Secure Communications**: HTTPS enforced in production

### Healthcare Business Logic for NextJS Architecture

```typescript
// Patient data access control
if (user.role === 'PATIENT' && patientId !== user.patientId) {
  throw new Error('Patients can only access their own data');
}

// HSP prescription restrictions  
if (user.role === 'HSP' && action === 'PRESCRIBE_MEDICATION') {
  throw new Error('HSPs cannot prescribe medications - Doctor privileges required');
}

// Provider-patient relationship validation
if (user.role === 'DOCTOR') {
  await validateDoctorPatientRelationship(user.id, patientId);
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific component
npm test -- PatientDashboard

# Test API routes
npm test -- api/patients
```

Healthcare-specific testing includes:

- **Role-Based Access**: Testing proper healthcare role enforcement
- **Business Logic**: Testing medical workflow compliance
- **Data Validation**: Testing healthcare data integrity
- **API Security**: Testing authentication and authorization

## 📈 Performance & Monitoring

### Next.js Performance Features

- **App Router**: Server-side rendering and static generation
- **Automatic Code Splitting**: Optimized bundle loading
- **Image Optimization**: Next.js automatic image optimization
- **Database Connection Pooling**: Prisma connection management

### Healthcare Monitoring

- **Audit Logging**: All healthcare data access tracked
- **Error Tracking**: Healthcare-specific error handling
- **Performance Metrics**: Database query optimization
- **Health Checks**: Built-in API health endpoints

## 🔄 Migration Completed: Auth.js v5 + Enhanced Infrastructure

This application has been **successfully migrated to Auth.js v5** with comprehensive **Docker deployment infrastructure** and enhanced authentication:

### ✅ **Latest: Auth.js v5 Migration (August 2025)**

- **Modern Auth.js v5**: Latest authentication framework with improved performance
- **Enhanced Field Mapping**: Proper mapping between legacy and Auth.js v5 fields
- **Database Schema Updates**: Automated migration for Auth.js v5 compatibility
- **Backward Compatibility**: Seamless migration preserving all existing user data
- **Improved Session Management**: Enhanced JWT strategy with healthcare-specific timeouts

### ✅ **Completed Migration Benefits**

- **Modern Authentication**: NextAuth.js with PrismaAdapter instead of custom JWT handling
- **Enhanced Security**: Database-backed sessions replace stateless JWT tokens
- **Unified Deployment**: Universal Docker Swarm deployment scripts for all environments
- **Better Type Safety**: End-to-end TypeScript with Prisma
- **Scalable Infrastructure**: Database-first deployment approach with Docker Swarm
- **Multi-Environment Support**: Dedicated dev/test/prod deployment configurations

### ✅ **Key Migration Changes Completed**

- **Authentication System**: JWT → NextAuth.js with PrismaAdapter and database sessions
- **Deployment Infrastructure**: Added universal deployment scripts supporting dev/test/prod
- **Docker Architecture**: Comprehensive Docker Swarm configuration with scaling support
- **Environment Management**: Proper environment variable handling for NextAuth.js
- **Database Integration**: Enhanced PostgreSQL integration with Prisma for session management
- **Security Enhancement**: Role-based healthcare workflow enforcement with NextAuth.js

### 🚀 **New Deployment Capabilities**

- **Universal Scripts**: Single deployment system for all environments (`./scripts/deploy.sh`)
- **Docker Swarm**: Production-ready orchestration with auto-scaling
- **Database-First**: Proper migration and seeding in deployment pipeline
- **Zero-Downtime Updates**: Rolling updates for production environments
- **Environment Isolation**: Separate configurations and port allocations
- **Automated Testing**: Integrated test execution in deployment pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/healthcare-feature`
3. Commit your changes: `git commit -m 'Add healthcare feature'`
4. Push to the branch: `git push origin feature/healthcare-feature`
5. Open a Pull Request

### Development Guidelines

- Follow Next.js App Router patterns
- Use TypeScript throughout the application
- Implement proper healthcare role-based access control
- Write tests for healthcare business logic
- Update documentation for API changes
- Run `npm run lint` and `npm run type-check` before committing

## 📝 Documentation

- **📖 [Healthcare Business Logic](CLAUDE.md)** - Complete healthcare workflow rules
- **🚀 [Deployment Guide](scripts/)** - All deployment options and scripts
- **🔐 [Authentication Guide](lib/auth.ts)** - NextAuth.js healthcare configuration
- **🗄️ [Database Schema](prisma/schema.prisma)** - Complete healthcare data model

## 📊 Database Schema

The application uses **PostgreSQL with Prisma** featuring 40+ models:

### Core Healthcare Tables

- **User** - Authentication with healthcare roles
- **Patient** - Patient records and medical history
- **doctors** - Healthcare provider profiles  
- **hsps** - Health service provider profiles
- **CarePlan** - Treatment and care management
- **Medication** - Prescription tracking
- **Appointment** - Scheduling system
- **VitalReading** - Health monitoring data
- **Symptom** - Patient symptom reporting with body mapping

### Healthcare Compliance Features

- **Role-Based Access**: Database-level access control
- **Audit Logging**: Complete healthcare data activity tracking
- **Data Relationships**: Proper medical data relationships
- **HIPAA Compliance**: Privacy and security requirements met
- **Business Logic**: Healthcare workflow rules enforced

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection:**

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test database connection
npx prisma db push
```

**Port Conflicts:**

```bash
# Check what's using port 3000
lsof -i :3000

# Check database port
lsof -i :5432
```

**Authentication Issues:**

```bash
# Regenerate NextAuth secret
openssl rand -base64 32

# Clear Next.js cache
rm -rf .next
npm run build
```

### Getting Help

- **Healthcare Business Logic**: Check [CLAUDE.md](CLAUDE.md) for role rules
- **API Issues**: Review API route files in `app/api/`
- **Database Problems**: Use `npx prisma studio` to inspect data
- **Authentication**: Check NextAuth.js configuration in `lib/auth.ts`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 Healthcare Standards Compliance

This application is designed for real-world healthcare use:

- **HIPAA Compliance** - Privacy and security requirements
- **Role-Based Workflows** - Doctor/HSP/Patient role enforcement  
- **Medical Data Integrity** - Proper healthcare data relationships
- **Audit Requirements** - Complete activity logging and tracking
- **Scalable Architecture** - Production-ready for healthcare organizations

---

## Patient Adherence Healthcare Application - Core Rules & Requirements

## Core Purpose & Principles

### Primary Objective
A Medical Healthcare application focused on **Patient Adherence** - monitoring and ensuring patients follow their prescribed treatment regimens across multiple health dimensions.

### Key Monitoring Areas
1. **Medication Adherence** - Prescribed vs. actual medication intake
2. **Appointment Compliance** - Critical and non-critical appointment attendance
3. **Dietary Adherence** - Prescribed diet vs. actual food consumption
4. **Exercise Compliance** - Prescribed workouts vs. actual physical activity
5. **Vital Signs Monitoring** - Regular health metrics tracking (BP, temperature, urine samples, etc.)

## System Architecture Rules

### 1. Core Data Relationships

#### Patient-Centric Model
```
Patient → Care Plan Templates → Active Care Plans → Components
```

#### Care Plan Composition
A Care Plan consists of:
- **Medication Reminders** (linked to Medicine database)
- **Appointments** (critical/non-critical)
- **Vitals Schedules** (BP, temperature, urine samples, etc.)
- **Diet Plans** (prescribed meals/nutrition)
- **Workout Plans** (exercise routines)
- **Subscription Services** (ongoing care services)
- **Symptoms** (patient-reported)

#### Initial Patient Setup Workflow
1. Doctor adds Patient → Creates initial **Treatment Plan**
2. System generates a "ghost" Care Plan with:
    - Empty Treatment placeholder
    - Empty Diagnosis placeholder
    - Empty Symptoms placeholder
3. Care Plan gets populated as components are added

### 2. User Role Hierarchy & Permissions

#### Doctor (Primary)
- **Can do everything**: Add/edit patients, medications, appointments, care plans
- Create and manage Care Plan Templates
- Convert Services to Subscriptions
- Add Medicine to database (if not exists via Algolia)
- Link to Secondary Doctors with patient consent
- Access all patient data and analytics

#### Secondary Doctor
- **Limited access**: Based on primary doctor permissions and patient consent
- Requires OTP-based consent workflow
- Can view/edit only permitted patient data

#### HSP User (Healthcare Service Provider)
- **Cannot add medicines** to database
- **Cannot add medication reminders** (only doctors can)
- Limited to service-related functions

#### Patient
- **View-only** for prescribed plans
- **Input actual data**: What they ate, exercises done, vitals taken
- **Add symptoms** to their care plan
- Mobile-optimized interface for daily compliance tracking

#### Admin
- **System management**: Doctor profiles, medicine database
- **Cannot access** patient medical data directly
- Manage clinics and provider relationships

### 3. Medicine & Medication Management

#### Medicine Database Integration
- **Algolia integration** for medicine search/autocomplete
- When adding medication reminder:
    1. Search Algolia for medicine
    2. If exists in local `medicines` table → use existing
    3. If not exists → add to `medicines` table
    4. Create medication reminder linked to medicine

#### Medication Reminder Workflow
- **Only Doctors** can create medication reminders
- Links: `Patient → Care Plan → Medication Reminder → Medicine`
- Contains: dosage, frequency, timing, criticality
- **Not directly linked** to Care Plan (through Medication Reminder)

### 4. Doctor-Provider-Clinic Relationships

#### Hierarchy
```
Provider → Clinic → Doctor → Patients
```

#### Clinic Management
- Doctors belong to Clinics
- Clinics belong to Providers
- Doctor profiles include clinic information
- Clinic details: location, services, contact info

### 5. Care Plan vs Treatment Distinction

#### Treatment Plan
- **Initial medical assessment**
- Contains: Diagnosis, Symptoms, Medical History
- Created when patient is first added
- **Foundation** for Care Plans

#### Care Plan
- **Actionable adherence plan**
- Contains: Specific tasks, schedules, reminders
- **Derived from** Treatment Plan
- **Dynamic**: Updated as treatment progresses

#### Care Plan Templates
- **Reusable patterns** for common conditions
- Applied to patients to create active Care Plans
- Customizable per patient needs

### 6. Subscription & Service Model

#### Service to Subscription Workflow
1. Doctor creates a **Service** (e.g., "Daily BP Monitoring")
2. Service defines: frequency, duration, requirements
3. Doctor converts Service to **Subscription** for patient
4. Subscription generates recurring tasks in Care Plan
5. Patient sees scheduled activities in "My Scheduled Activities"

### 7. Consent & Secondary Doctor Linking

#### OTP Consent Process
1. Primary Doctor initiates Secondary Doctor link
2. System sends OTP to Patient
3. Patient confirms consent via OTP
4. Secondary Doctor gains specified access permissions
5. Audit trail maintained for all access

## Mobile-First Requirements

### Patient Mobile Experience
- **Daily Dashboard**: Today's medications, appointments, meals, exercises
- **Quick Input**: Simple forms for "taken/done" confirmations
- **Visual Progress**: Charts showing adherence percentages
- **Reminders**: Push notifications for upcoming tasks
- **Offline Support**: Basic functionality without internet

### Doctor Mobile Experience
- **Patient Overview**: Quick access to patient adherence data
- **Emergency Alerts**: Critical missed medications/appointments
- **Quick Messaging**: Communication with patients
- **Approval Workflows**: Medication adjustments, plan modifications

## Missing Requirements & Enhancements

### 1. Advanced Patient Adherence Features
- **Adherence Scoring**: Algorithm to calculate overall patient compliance
- **Predictive Analytics**: ML models to predict non-adherence risk
- **Behavioral Insights**: Patterns in missed medications/appointments
- **Family/Caregiver Access**: Limited view for patient supporters

### 2. Clinical Decision Support
- **Drug Interaction Checking**: Integration with pharmaceutical databases
- **Allergy Alerts**: Patient allergy checks against prescribed medications
- **Dosage Validation**: Age/weight/condition-based dosage recommendations
- **Clinical Guidelines**: Evidence-based treatment recommendations

### 3. Integration & Interoperability
- **EHR Integration**: Connect with existing hospital systems
- **Pharmacy Integration**: Direct prescription sending
- **Lab Results**: Automatic vital signs from connected devices
- **Insurance Verification**: Real-time coverage checking

### 4. Advanced Monitoring
- **IoT Device Integration**: Smart pill dispensers, BP monitors, glucometers
- **Biometric Tracking**: Heart rate, sleep patterns, activity levels
- **Environmental Factors**: Weather, air quality impact on conditions
- **Social Determinants**: Transportation, financial barriers to adherence

### 5. Communication & Support
- **Telemedicine**: Video consultations within app
- **AI Chatbot**: 24/7 patient support for basic questions
- **Peer Support**: Patient community features (anonymized)
- **Educational Content**: Condition-specific learning materials

### 6. Regulatory & Compliance
- **HIPAA Compliance**: Complete audit trails, encryption
- **FDA Integration**: Drug safety alerts and recalls
- **Clinical Trial Matching**: Connect eligible patients to research
- **Quality Metrics**: HEDIS measures for healthcare quality

### 7. Analytics & Reporting
- **Population Health**: Aggregate adherence trends
- **Provider Scorecards**: Doctor performance metrics
- **Outcome Tracking**: Treatment effectiveness measurements
- **Cost Analysis**: Healthcare cost reduction through adherence

## Technical Architecture Considerations

### Backend Scalability
- **Microservices**: Separate services for each major component
- **Message Queues**: For notification and reminder processing
- **Caching Strategy**: Redis for frequently accessed patient data
- **Database Optimization**: Proper indexing for patient lookup queries

### Security Requirements
- **End-to-End Encryption**: All patient data transmission
- **Role-Based Access Control**: Granular permissions by user type
- **Audit Logging**: Complete trail of all data access/modifications
- **Secure Authentication**: Multi-factor authentication for healthcare providers

### Mobile Performance
- **Progressive Web App**: Works across all devices
- **Offline Sync**: Local storage with background synchronization
- **Image Optimization**: Efficient handling of medical images/documents
- **Battery Optimization**: Minimal background processing

## Compliance & Standards
- **HL7 FHIR**: Standard healthcare data exchange
- **SNOMED CT**: Standardized medical terminology
- **ICD-10**: Diagnosis coding standards
- **CPT Codes**: Procedure coding integration

This framework provides a comprehensive foundation for building a robust Patient Adherence healthcare application that prioritizes patient outcomes while maintaining clinical workflow efficiency.

---

- **Built with ❤️ for healthcare providers and patients**

- *Next.js Healthcare Management Platform - Production-ready full-stack application with NextAuth.js, Prisma, and PostgreSQL*

**Last updated: August 2025** | Next.js 14 | PostgreSQL 17+ | NextAuth.js | TypeScript
