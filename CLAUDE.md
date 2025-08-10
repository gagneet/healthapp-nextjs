# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Healthcare Management Platform** - a modern, full-stack TypeScript application built with Next.js 14 frontend and Node.js/Express backend. The system manages patients, doctors, medications, care plans, appointments, and vital signs tracking. It's designed to help healthcare providers monitor patient medication adherence and overall care management with real-time capabilities.

## Development Commands

```bash
# Frontend Development (Next.js)
npm run dev                    # Start Next.js development server (port 3002)
npm run build                  # Build Next.js production bundle
npm start                      # Start Next.js production server
npm run lint                   # Run Next.js ESLint
npm run type-check             # TypeScript type checking

# Backend Development (Node.js/Express)
npm run backend:dev            # Start backend development server with nodemon (port 3005)
npm run backend:start          # Start backend production server
npm run backend:build          # Build TypeScript backend to dist/
npm run backend:prod           # Build and start production backend

# Database Management
npm run migrate                # Run all pending migrations
npm run migrate:undo           # Undo last migration
npm run seed                   # Run all seeders
npm run seed:undo             # Undo all seeders
npm run migrations:build       # Build TypeScript migrations for Sequelize CLI

# Testing
npm test                      # Run Jest test suite with --detectOpenHandles
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate test coverage report

# Code Quality
npm run lint:backend          # Run ESLint on src/
npm run lint:fix              # Auto-fix ESLint issues
```

## Architecture Overview

### Core Technology Stack

- **Frontend**: Next.js 14 with App Router + TypeScript
- **Backend**: Node.js (>=22.18.0 LTS) + Express.js with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with role-based access control  
- **Security**: Helmet, CORS, rate limiting, input validation
- **Caching**: Redis integration for sessions and caching
- **Cloud Storage**: AWS S3 SDK v3 for file uploads
- **Real-time**: Socket.io ready for notifications
- **Testing**: Jest with Node.js environment

### Business Logic Rules

#### User Role Hierarchy

- **Doctor**: Can be independent or assigned/linked to a Provider
- **Health Service Provider (HSP)**: Can be independent or linked to a Provider  
- **Patient**: Can only be linked to a Doctor or HSP
- **Provider Admin**: Can view, add, edit Doctors linked to the Provider

#### Permission Matrix

| Role | Medicine/Medication Reminders | Diets | Workouts | Appointments | Vitals | Services | Subscriptions |
|------|------------------------------|-------|-----------|-------------|--------|----------|--------------|
| **Doctor** | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage |
| **HSP** | ❌ Cannot Add | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ✅ Add/Manage | ❌ Cannot Add | ❌ Cannot Add |
| **Patient** | 👁️ View Only | 👁️ View Only | 👁️ View Only | 👁️ View Only | ➕ Can Record | ❌ No Access | ❌ No Access |
| **Provider Admin** | 👁️ View Only | 👁️ View Reports | 👁️ View Reports | 👁️ View Reports | 👁️ View Reports | 👁️ View Reports | 👁️ Manage Billing |

#### Service & Subscription Logic

- **Services**: Linked to a Doctor, each has an amount and duration
- **Services**: One-time unless linked to a Subscription
- **Subscriptions**: Linked to one or more Service(s) with recurring payment duration
- **Chronic Care**: Doctors can add Services and Subscriptions for Patients

#### Provider Relationships

- **Doctor Clinic**: Doctor can have own Clinic and be linked to a Provider
- **Assignment Rules**: HSP cannot assign/link Medicine to Patient (Doctor-only privilege)

### Current Architecture: Next.js + Node.js Separation

The application uses a **separated frontend/backend architecture**:

1. **Next.js Frontend** (TypeScript) - Port 3002
   - Handles UI/UX, routing, client-side state
   - Uses Next.js rewrites to proxy API calls to backend
   - No Next.js API routes (removed for build optimization)

2. **Node.js Backend** (TypeScript) - Port 3005  
   - Handles all business logic, database operations, authentication
   - Express.js REST API with comprehensive endpoints
   - JWT authentication and role-based authorization

3. **API Proxying Strategy**
   - Frontend calls `/api/*` routes
   - Next.js `rewrites()` proxies to `http://backend:3005/api/*`
   - This eliminates build issues with backend dependencies in frontend

### Database Architecture

The application uses Sequelize with PostgreSQL and the following core models:

**User Management**:
- `User` (base user table) → `UserRole` (many-to-many roles)
- `User` → `Doctor`, `Patient`, `Provider`, `HSP` (one-to-one specialized profiles)

**Healthcare Domain**:
- `Doctor` → `Speciality` (belongs to speciality)
- `Patient` → `CarePlan` (one-to-many care plans)
- `CarePlan` → `Medication`, `Vital` (one-to-many)
- `Medicine` → `Medication` (template to instance relationship)
- `VitalTemplate` → `Vital` (template to instance relationship)

**Provider Management**:
- `Provider` → `Doctor` (one-to-many assignment)
- `Provider` → `HSP` (one-to-many assignment)
- `PatientDoctorAssignment` (primary, specialist, substitute, transferred)

**Services & Subscriptions**:
- `Service` → `Doctor` (belongs to doctor)
- `Subscription` → `Service[]` (many-to-many)
- `PatientService` (patient service assignments)
- `PatientSubscription` (patient subscription tracking)

### Project Structure

```text
healthapp-nextjs/
├── app/                    # Next.js 14 App Router (Frontend)
│   ├── dashboard/          # Role-based dashboard layouts
│   │   ├── doctor/         # Doctor dashboard pages
│   │   ├── patient/        # Patient dashboard pages
│   │   ├── hospital/       # HSP dashboard pages
│   │   └── admin/          # Provider admin pages
│   ├── auth/               # Authentication pages
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # Base UI components
│   └── dashboard/          # Dashboard-specific components
├── lib/                    # Frontend utilities
│   ├── auth-context.tsx    # Authentication context
│   └── utils.ts            # Utility functions
├── types/                  # TypeScript type definitions
├── src/                    # Node.js Backend (TypeScript)
│   ├── config/             # Database, JWT, constants
│   ├── controllers/        # Route handlers (TypeScript)
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # Sequelize models (TypeScript)
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic services
│   ├── utils/              # Helper functions
│   ├── migrations/         # Database schema migrations (TypeScript)
│   ├── seeders/            # Initial data seeding (TypeScript)
│   └── server.ts           # Express server entry point
├── dist/                   # Compiled JavaScript (backend)
├── dist-migrations/        # Compiled migrations for Sequelize CLI
├── docker/                 # Docker configurations
├── scripts/                # Deployment and utility scripts
└── docs/                   # Documentation
```

### Key Architectural Patterns

**TypeScript-First Development**:
- Both frontend and backend use strict TypeScript
- Shared types between frontend and backend
- TypeScript compilation for backend: `npm run backend:build`
- TypeScript migration compilation: `npm run migrations:build`

**Modern ES Module Architecture**:
- Full ES module implementation with `import/export` syntax
- All imports use `.js` extensions for proper module resolution (TypeScript compilation requirement)
- Top-level await support ready for Node.js 22+
- Modern async/await patterns throughout

**Authentication & Authorization**:
- JWT-based authentication with Bearer tokens
- Role-based access control via `USER_CATEGORIES` constants
- Middleware chain: `authenticate` → `authorize(...roles)` → controller
- Service layer separation for auth business logic

**Database Patterns**:
- All models use Sequelize with PostgreSQL
- Consistent naming (camelCase in code, snake_case in DB)
- Associations defined centrally in `src/models/associations.ts`
- Migration-driven schema management with versioned changes
- Seeded data for initial system setup (specialists, medicines, vital templates)
- Connection pooling configured for production scalability
- Database timezone set to UTC (+00:00)

**Service Layer Architecture**:
- `AuthService.ts` - Authentication and user management logic
- `PatientService.ts` - Patient data processing and business rules
- `MedicationService.ts` - Medication management and adherence tracking
- `SchedulingService.ts` - Appointment and scheduling logic

**API Response Format**:

All API responses follow a consistent structure via `responseFormatter.ts`:

```typescript
{
  status: boolean,
  statusCode: number,
  payload: {
    data?: any,
    message?: string,
    error?: { status: string, message: string }
  }
}
```

**Enhanced Security Stack**:
- CORS configured for frontend integration with multiple origins
- Helmet for security headers
- Rate limiting on `/api` and `/m-api` routes
- Input validation using Joi and express-validator
- Password hashing with bcryptjs
- Request size limits (10mb)
- Redis integration for session management and caching
- AWS S3 SDK v3 for secure file uploads

## Development Guidelines

### TypeScript Development Rules

1. **Always use TypeScript** - Never convert to JavaScript
2. **Strict type checking** - Enable strict mode in tsconfig.json
3. **Proper type definitions** - Use interfaces for complex objects
4. **Type-safe API calls** - Define request/response types
5. **Shared types** - Use common types between frontend and backend

### Modern ES Module Development

- Always use `import/export` syntax, never `require()`
- Include `.js` file extensions in all relative imports (TypeScript requirement)
- Use top-level await when needed (Node.js 22+ support)
- Leverage modern async/await patterns over callbacks or promises chains

### Database Development

- Use migrations for all schema changes (`npx sequelize-cli migration:generate`)
- Compile TypeScript migrations: `npm run migrations:build`
- Database syncs automatically in development with `{ alter: true }`
- Production deployments must use migrations, never sync
- Use seeders for initial data population (`npm run seed`)
- All sensitive data must use environment variables

### API Development

- Controllers should be thin - business logic belongs in the service layer
- Use the established service classes: AuthService, PatientService, MedicationService, SchedulingService
- Utilize middleware for cross-cutting concerns (auth, validation, logging, rate limiting)
- Follow consistent error handling via `errorHandler.ts` middleware
- Use `responseFormatter.ts` for consistent API responses
- All routes prefixed with `/api` (web) and `/m-api` (mobile) - both use same routes
- Follow business logic rules for role permissions

### Frontend Development

- Use Next.js 14 App Router patterns
- TypeScript for all components and pages
- Follow role-based access control in UI
- Use Next.js rewrites for API proxying (no Next.js API routes)
- Implement proper loading states and error handling
- Follow accessibility guidelines (WCAG 2.1 AA)

### Code Quality & Testing

- Run `npm run lint:backend` before commits - ESLint configured for TypeScript
- Use `npm run lint:fix` for auto-fixable issues
- Use `npm run type-check` for TypeScript validation
- Jest configured with `--detectOpenHandles` for proper cleanup
- Write tests using modern async/await syntax with TypeScript
- Use `npm run test:coverage` to maintain coverage standards

### Environment Configuration

- Database: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- Authentication: `JWT_SECRET` for token signing
- Application: `PORT`, `NODE_ENV`, `FRONTEND_URL`, `BACKEND_URL` for CORS
- Cloud: AWS S3 credentials for file uploads
- Caching: Redis connection parameters
- Docker: `HOST_IP` for multi-service deployment

## Key Implementation Notes

### Fully Implemented Architecture

The codebase now includes a complete, production-ready implementation:

#### ✅ Complete TypeScript Stack

- Frontend: Next.js 14 with TypeScript and App Router
- Backend: Node.js/Express with TypeScript
- Database: PostgreSQL with TypeScript Sequelize models
- Migrations: TypeScript migrations with proper compilation

#### ✅ Complete Route Layer

- 10+ organized route files covering all healthcare domains
- Proper route organization with `/api` and `/m-api` endpoints
- Comprehensive CRUD operations for all entities
- Role-based access control implemented

#### ✅ Service Layer Architecture

- AuthService: User authentication and JWT management
- PatientService: Patient data processing and business rules
- MedicationService: Medication adherence and tracking logic
- SchedulingService: Appointment and calendar management

#### ✅ Database Infrastructure

- Migration system with versioned schema changes
- Seeded initial data (specialists, medicines, vital templates)
- 20+ comprehensive models with proper associations
- PostgreSQL optimization with proper indexing

#### ✅ Modern Development Stack

- Full TypeScript conversion for type safety
- ESLint configuration for code quality
- Enhanced Jest testing setup with coverage reporting
- Docker containerization for development and production

### Ready-to-Implement Features

The dependencies and structure are in place for:

- **Real-time Notifications**: Socket.io integrated, ready for medication reminders
- **File Upload System**: AWS S3 SDK v3 configured for document/image uploads
- **Caching Layer**: Redis integration ready for session management and data caching
- **Scheduled Tasks**: node-cron available for medication reminders and alerts
- **Background Jobs**: Infrastructure ready for adherence monitoring

### Healthcare-Specific Implementation Ready

- **HIPAA Compliance**: Audit logging patterns established, secure data handling
- **Medication Safety**: Models support drug interaction checking and adherence tracking
- **Care Coordination**: Comprehensive care plan management with provider workflows
- **Patient Engagement**: Timeline tracking for medications, vitals, and appointments
- **Role-Based Permissions**: Strict business logic enforcement for healthcare roles

### Performance & Scalability Features

- **Database Optimization**: Connection pooling, proper indexing patterns
- **Modern Caching**: Redis integration for high-performance data access
- **Monitoring Ready**: Winston logging configured for production monitoring
- **Security Hardened**: Rate limiting, input validation, secure headers
- **Mobile Optimized**: Separate mobile API endpoints with optimized responses
- **Docker Deployment**: Production-ready containerization with Docker Swarm support

# CODING_RULES - Healthcare Management Platform

## 1. Primary Development Principles

### 1.1 TypeScript-First Development ✅
- **MANDATORY**: Always use TypeScript for all new code
- **PROHIBITION**: Never convert TypeScript code to JavaScript unless absolutely critical for build optimization
- **REQUIREMENT**: Maintain strict type checking enabled in tsconfig.json
- **STANDARD**: Use proper interfaces and types for all complex objects and API contracts

### 1.2 Research-Based Problem Solving ✅
- **APPROACH**: Always research and analyze issues thoroughly before implementing solutions
- **PROHIBITION**: Do not assume solutions based solely on error messages
- **REQUIREMENT**: Understand the overall application architecture before making changes
- **STANDARD**: Document your analysis and reasoning for architectural decisions

### 1.3 Next.js + Node.js + PostgreSQL Architecture ✅
- **ARCHITECTURE**: Maintain separation of concerns between Next.js frontend and Node.js backend
- **DATABASE**: Use PostgreSQL with TypeScript Sequelize models exclusively
- **API STRATEGY**: Use Next.js rewrites to proxy to backend, not Next.js API routes
- **REQUIREMENT**: Follow modern full-stack TypeScript patterns and best practices

### 1.4 Healthcare Business Logic Compliance ✅
- **ENFORCEMENT**: Strictly enforce role-based permission rules in both frontend and backend
- **VALIDATION**: Always validate user permissions before executing healthcare operations
- **AUDIT**: Implement proper audit logging for all healthcare data modifications
- **SECURITY**: Follow HIPAA compliance patterns for data handling and storage

## 2. Code Quality Standards

### 2.1 TypeScript Standards
```typescript
// ✅ GOOD: Proper interface definition
interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  medicalHistory: MedicalRecord[];
}

// ❌ BAD: Using 'any' type
function processPatient(data: any): any {
  return data;
}

// ✅ GOOD: Strict typing
function processPatient(data: PatientData): ProcessedPatient {
  return validateAndProcess(data);
}
```

### 2.2 Error Handling Standards
```typescript
// ✅ GOOD: Comprehensive error handling with typing
async function getDoctorDashboard(req: Request, res: Response): Promise<Response> {
  try {
    const result = await doctorService.getDashboardData(req.user!.id);
    return res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    logger.error('Dashboard fetch failed:', error);
    return res.status(500).json(formatErrorResponse('Failed to fetch dashboard data'));
  }
}

// ❌ BAD: Generic error handling without typing
async function getDashboard(req, res) {
  const data = await someService.getData();
  res.json(data);
}
```

### 2.3 Business Logic Enforcement
```typescript
// ✅ GOOD: Proper role-based permission checking
async function prescribeMedication(req: Request, res: Response): Promise<Response> {
  const user = req.user!;
  
  // Enforce business rule: Only doctors can prescribe medication
  if (user.role !== USER_CATEGORIES.DOCTOR) {
    return res.status(403).json(formatErrorResponse('Only doctors can prescribe medication'));
  }
  
  // Validate doctor-patient relationship
  const hasAccess = await doctorService.validatePatientAccess(user.id, req.params.patientId);
  if (!hasAccess) {
    return res.status(403).json(formatErrorResponse('Access denied to patient'));
  }
  
  // Proceed with prescription logic...
}

// ❌ BAD: No permission validation
async function prescribeMedication(req, res) {
  // Direct medication creation without permission checks
  const medication = await Medication.create(req.body);
  res.json(medication);
}
```

## 3. Architecture Guidelines

### 3.1 Next.js Frontend Patterns
```typescript
// ✅ GOOD: Proper Next.js 14 App Router component
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { DashboardData, APIResponse } from '@/types/dashboard'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      // API call will be proxied to backend via next.config.js rewrites
      const response = await fetch('/api/doctors/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result: APIResponse<DashboardData> = await response.json()
      setData(result.payload.data)
    } catch (error) {
      console.error('Dashboard fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Component render logic...
}
```

### 3.2 Node.js Backend Patterns
```typescript
// ✅ GOOD: Proper TypeScript Express controller
import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/express.js';
import { DoctorService } from '../services/DoctorService.js';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.js';

class DoctorController {
  private doctorService: DoctorService;
  
  constructor() {
    this.doctorService = new DoctorService();
  }
  
  async getDashboardData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user!.id;
      const dashboardData = await this.doctorService.getDashboardData(userId);
      
      return res.status(200).json(formatSuccessResponse(dashboardData));
    } catch (error) {
      return next(error); // Let error middleware handle it
    }
  }
}

export default new DoctorController();
```

### 3.3 Database Migration Patterns
```typescript
// ✅ GOOD: Proper TypeScript migration with medical standards
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('vital_readings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    vital_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vital_types',
        key: 'id',
      },
    },
    // Medical best practice: separate systolic/diastolic for blood pressure
    systolic_value: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    diastolic_value: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    // Medical alert system
    alert_level: {
      type: DataTypes.ENUM('normal', 'warning', 'critical', 'emergency'),
      defaultValue: 'normal',
    },
    alert_reasons: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
  
  // Add proper indexes for performance
  await queryInterface.addIndex('vital_readings', ['patient_id', 'created_at']);
  await queryInterface.addIndex('vital_readings', ['alert_level']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('vital_readings');
}
```

## 4. Deployment and Environment Standards

### 4.1 Docker Configuration
- **REQUIREMENT**: Use TypeScript compilation in production deployments
- **STANDARD**: Use `npm run migrations:build` for database operations
- **ENVIRONMENT**: Properly configure CORS for multi-container environments

### 4.2 Environment Variables
```bash
# ✅ GOOD: Comprehensive environment configuration
# Database (PostgreSQL)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=healthapp_dev
POSTGRES_USER=healthapp_user
POSTGRES_PASSWORD=secure_password

# Authentication
JWT_SECRET=secure_jwt_secret_key

# Application URLs
FRONTEND_URL=http://localhost:3002
BACKEND_URL=http://backend:3005
NEXT_PUBLIC_API_URL=http://localhost:3005/api

# Docker Configuration
HOST_IP=192.168.0.148
```

## 5. Healthcare Compliance Requirements

### 5.1 Role-Based Access Control (RBAC)
```typescript
// ✅ GOOD: Strict RBAC implementation
const HEALTHCARE_PERMISSIONS = {
  DOCTOR: {
    medication: ['create', 'read', 'update', 'delete'],
    patient: ['create', 'read', 'update'],
    services: ['create', 'read', 'update', 'delete'],
    subscriptions: ['create', 'read', 'update', 'delete'],
  },
  HSP: {
    medication: [], // HSPs cannot manage medications
    patient: ['read', 'update'], // Limited patient access
    vitals: ['create', 'read', 'update'],
    appointments: ['create', 'read', 'update'],
    services: [], // Cannot create services
  },
  PATIENT: {
    medication: ['read'], // View only
    vitals: ['create', 'read'], // Can record own vitals
    appointments: ['read'],
  },
} as const;
```

### 5.2 Medical Data Validation
```typescript
// ✅ GOOD: Medical standards validation
interface BloodPressureReading {
  systolic: number; // 90-180 normal range
  diastolic: number; // 60-120 normal range
  alertLevel: 'normal' | 'warning' | 'critical' | 'emergency';
}

function validateBloodPressure(reading: BloodPressureReading): ValidationResult {
  if (reading.systolic > 180 || reading.diastolic > 120) {
    return { isValid: true, alertLevel: 'emergency', message: 'Hypertensive crisis' };
  }
  if (reading.systolic > 140 || reading.diastolic > 90) {
    return { isValid: true, alertLevel: 'critical', message: 'High blood pressure' };
  }
  // ... additional medical validation logic
}
```

## 6. Testing and Quality Assurance

### 6.1 Testing Requirements
```typescript
// ✅ GOOD: Comprehensive TypeScript testing
import request from 'supertest';
import { app } from '../src/server.js';
import type { APIResponse, DashboardData } from '../types/api.js';

describe('Doctor Dashboard API', () => {
  let authToken: string;
  
  beforeEach(async () => {
    authToken = await getTestAuthToken('DOCTOR');
  });
  
  it('should return dashboard data for authenticated doctor', async () => {
    const response = await request(app)
      .get('/api/doctors/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    const apiResponse: APIResponse<DashboardData> = response.body;
    
    expect(apiResponse.status).toBe(true);
    expect(apiResponse.payload.data).toHaveProperty('totalPatients');
    expect(apiResponse.payload.data).toHaveProperty('criticalAlerts');
    expect(typeof apiResponse.payload.data.totalPatients).toBe('number');
  });
  
  it('should enforce role-based access control', async () => {
    const hspToken = await getTestAuthToken('HSP');
    
    await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${hspToken}`)
      .send(mockMedicationData)
      .expect(403); // HSPs cannot create medications
  });
});
```

## 7. Performance and Security Standards

### 7.1 Database Performance
- **REQUIREMENT**: Use proper indexing for all query patterns
- **STANDARD**: Implement connection pooling for production
- **OPTIMIZATION**: Use JSONB for flexible data storage with proper indexing

### 7.2 Security Standards
```typescript
// ✅ GOOD: Comprehensive security implementation
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security middleware stack
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://frontend:3002', // Docker container access
    ...(process.env.HOST_IP ? [`http://${process.env.HOST_IP}:3002`] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many API requests from this IP',
});

app.use('/api', apiLimiter);
```

These coding rules ensure maintainable, secure, and compliant healthcare application development while leveraging modern TypeScript and Next.js best practices.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.