# Healthcare Management Platform

A comprehensive, modern healthcare management system built with **Next.js 14** full-stack architecture, featuring patient care management, medication tracking, appointment scheduling, and real-time monitoring capabilities with **NextAuth.js** authentication and **Prisma ORM**.

## ✨ Latest Architecture - Pure Next.js Implementation

### 🚀 **Complete Next.js Migration**
- **Full-Stack Next.js 14**: Unified frontend and backend with API routes
- **NextAuth.js Authentication**: Modern, secure authentication with role-based access control
- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **Healthcare Business Logic**: Role-based permissions enforcing medical workflow compliance

### 🏗️ **Modern Technology Stack**
- **Next.js 14 with App Router**: Modern React patterns with server-side rendering
- **PostgreSQL with Prisma**: Production-ready database with type-safe queries
- **TypeScript Throughout**: Complete type safety across the entire application
- **Healthcare Compliance**: HIPAA-ready audit logging and role-based data access

### 🔧 **Production-Ready Features**
- **Comprehensive API Routes**: 15+ API endpoints covering all healthcare domains
- **Role-Based Access Control**: Doctor, HSP, Patient, and Admin role enforcement
- **Modern Authentication**: NextAuth.js with JWT and session management
- **Multi-Deployment Options**: Docker, VM, and hybrid deployment strategies

## 🏗️ Architecture

This application uses a **modern Next.js full-stack architecture**:

- **Full-Stack**: Next.js 14 with API routes handling both frontend and backend
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication**: NextAuth.js with healthcare role-based permissions
- **Deployment**: Docker Compose, VM local, and hybrid deployment options

```text
healthapp-nextjs/
├── 🔧 Next.js Full-Stack Application
│   ├── app/                  # Next.js 14 App Router
│   │   ├── api/              # API routes (backend functionality)
│   │   │   ├── admin/        # Admin management APIs
│   │   │   ├── appointments/ # Appointment scheduling
│   │   │   ├── care-plans/   # Care plan management  
│   │   │   ├── patients/     # Patient management
│   │   │   ├── symptoms/     # Symptom reporting
│   │   │   └── vitals/       # Vital signs tracking
│   │   ├── auth/             # Authentication pages
│   │   └── dashboard/        # Role-based dashboards
│   │       ├── doctor/       # Doctor interface
│   │       ├── patient/      # Patient interface
│   │       ├── hospital/     # HSP interface
│   │       └── admin/        # Admin interface
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── lib/                  # Utilities and configurations
│   │   ├── auth.ts           # NextAuth.js configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── validations/      # Zod schemas for validation
│   └── types/                # TypeScript definitions
├── 🗄️ Database & Schema
│   └── prisma/
│       ├── schema.prisma     # Database schema definition
│       └── seed.ts           # Initial data seeding
├── 🐳 Deployment Configurations
│   ├── docker/               # Docker configurations
│   └── scripts/              # Deployment scripts
└── 🚀 Production Features
    ├── NextAuth.js authentication with healthcare roles
    ├── Prisma ORM with PostgreSQL for data integrity
    ├── Role-based API access control and business logic
    └── Multi-environment deployment strategies
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

- **🔐 NextAuth.js Authentication**: Modern authentication with role-based access
- **🚀 Full-Stack Next.js**: Unified development experience with API routes
- **📱 Responsive Design**: Mobile-first healthcare interfaces
- **🎯 Type Safety**: End-to-end TypeScript with Prisma
- **🔍 Advanced Search**: Full-text search with PostgreSQL
- **🛡️ Healthcare Compliance**: Role-based data access and audit logging
- **♿ Accessibility**: WCAG 2.1 compliant healthcare interfaces

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ LTS or higher
- **PostgreSQL** 15+ (or Docker for containerized setup)
- **Docker** (optional, for containerized deployment)

### Installation Options

Choose your preferred deployment method:

#### **Option 1: Full Development Environment (Docker Compose)**

Complete development setup with all services:

```bash
# Clone repository
git clone <repository-url>
cd healthapp-nextjs

# Deploy full development environment
./scripts/deploy-nextjs-dev.sh --auto-yes --migrate --seed --domain localhost
```

**Includes**: PostgreSQL, Redis, Next.js app, PgAdmin, Redis Commander, MailHog

#### **Option 2: VM Local Installation**

For VM deployment with local PostgreSQL:

```bash
# Deploy on VM with local PostgreSQL
./scripts/deploy-vm-local.sh --domain your.domain.com --local-db
```

#### **Option 3: Hybrid Setup**

Containerized database with local Next.js:

```bash
# Hybrid deployment
./scripts/deploy-vm-hybrid.sh --domain your.domain.com
```

#### **Option 4: Manual Setup**

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

- **Healthcare App**: http://localhost:3000 (or your domain)
- **Doctor Dashboard**: http://localhost:3000/dashboard/doctor  
- **Patient Dashboard**: http://localhost:3000/dashboard/patient
- **Admin Dashboard**: http://localhost:3000/dashboard/admin
- **Database Admin** (dev): http://localhost:5050 (if using Docker setup)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `NEXTAUTH_URL` | NextAuth.js URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | `your-nextauth-secret` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/healthapp` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `http://localhost:3000/api` |

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

NextAuth.js manages authentication with healthcare role enforcement:

```typescript
// API route example with role protection
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['DOCTOR', 'HSP'].includes(session.user.role)) {
    return new Response('Unauthorized', { status: 401 })
  }
  // Healthcare business logic...
}
```

### Core API Endpoints

#### 🔐 Authentication
- `POST /api/auth/signin` - NextAuth.js sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

#### 👥 Patient Management
- `GET /api/patients` - Get patient list (role-based filtering)
- `GET /api/patients/[id]` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/[id]` - Update patient information

#### 👨‍⚕️ Doctor Management
- `GET /api/doctors/profile` - Get doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/patients` - Get assigned patients

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

### Development Environment

Full containerized development setup:

```bash
# Start complete development environment
./scripts/deploy-nextjs-dev.sh \
  --auto-yes \
  --migrate \
  --seed \
  --domain localhost

# Services included:
# - Next.js application (port 3000)
# - PostgreSQL database (port 5432) 
# - Redis cache (port 6379)
# - PgAdmin (port 5050)
# - Redis Commander (port 8081)
# - MailHog email testing (port 8025)
```

### Production Deployment

#### VM with Local PostgreSQL

```bash
# Production deployment on VM
./scripts/deploy-vm-local.sh \
  --domain your-healthcare-app.com \
  --local-db

# Includes:
# - Local PostgreSQL installation
# - Next.js production build
# - Nginx reverse proxy
# - SSL certificate setup (manual)
# - Systemd service configuration
```

#### Hybrid Container Setup

```bash
# Containerized database with local Next.js
./scripts/deploy-vm-hybrid.sh \
  --domain your-healthcare-app.com

# Includes:
# - PostgreSQL container
# - Redis container  
# - Local Next.js production build
# - Systemd service management
```

### Service Management

```bash
# Check application status
sudo systemctl status healthapp-nextjs

# View application logs
sudo journalctl -u healthapp-nextjs -f

# Restart application
sudo systemctl restart healthapp-nextjs

# Database management
psql -h localhost -p 5432 -U healthapp_user -d healthapp_dev
```

## 🔒 Security & Healthcare Compliance

### Security Features

- **NextAuth.js**: Modern authentication with secure session management
- **Role-Based Access Control**: Healthcare workflow compliance
- **Input Validation**: Zod schemas for all healthcare data
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **XSS Protection**: Next.js built-in security features
- **Healthcare Audit Logging**: Complete activity tracking

### HIPAA Compliance Features

- **Role-Based Data Access**: Doctors, HSPs, and Patients have appropriate data access
- **Audit Logging**: All healthcare data access is logged
- **Data Encryption**: Sensitive data encrypted in transit and at rest
- **Access Controls**: Business logic enforces medical workflow rules
- **Secure Communications**: HTTPS enforced in production

### Healthcare Business Logic

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

## 🔄 Migration from Express Backend

This application has been **completely migrated** from Express.js to pure Next.js:

### Migration Benefits

- **Unified Stack**: Single Next.js application instead of separate frontend/backend
- **Better Type Safety**: End-to-end TypeScript with Prisma
- **Modern Authentication**: NextAuth.js instead of custom JWT handling
- **Simplified Deployment**: Single application deployment
- **Better Performance**: Next.js optimizations and server-side rendering

### Key Changes

- **API Routes**: Migrated from Express routes to Next.js API routes
- **Authentication**: NextAuth.js with healthcare role management
- **Database**: PostgreSQL with Prisma instead of MySQL/Sequelize
- **Validation**: Zod schemas for healthcare data validation
- **Business Logic**: Role-based healthcare workflow enforcement

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

**Built with ❤️ for healthcare providers and patients**

*Next.js Healthcare Management Platform - Production-ready full-stack application with NextAuth.js, Prisma, and PostgreSQL*

**Last updated: August 2025** | Next.js 14 | PostgreSQL 15+ | NextAuth.js | TypeScript