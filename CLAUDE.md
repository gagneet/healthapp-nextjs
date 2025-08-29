# CLAUDE.md

Healthcare Management Platform guidance for Claude Code.

## Project Overview

**Healthcare Management Platform** - Full-stack TypeScript Next.js 14 with Auth.js v5. Manages patients, doctors, medications, care plans, appointments, vital signs tracking with real-time capabilities.

## Development Commands

```bash
# Core Commands
npm run dev build start lint type-check
npx prisma generate migrate dev deploy db seed studio
./scripts/deploy-local.sh start --migrate --seed
./scripts/deploy.sh {dev|test|prod} deploy
npm test test:watch test:coverage lint:fix
```

## Architecture

**Stack**: Next.js 14 + TypeScript + PostgreSQL/Prisma + Auth.js v5 + Redis + AWS S3 + Docker Swarm

### Business Rules

**Roles**: Doctor (full access), HSP (limited - no medications/services), Patient (view + record vitals), Provider Admin (view/billing)

**Critical**: Only Doctors can prescribe medications, create services/subscriptions. HSPs cannot manage medications. Patients can only record own vitals.

### Architecture

**Next.js Full-Stack** (TypeScript, Port 3002) + **PostgreSQL/Prisma** + **Auth.js v5 PrismaAdapter** (database sessions) + **Docker Swarm** deployment

### Database Models

**Core**: User → Doctor/Patient/Provider/HSP profiles, CarePlan → Medication/Vital, Medicine/VitalTemplate (templates), Service/Subscription management, PatientDoctorAssignment

### Structure

`app/dashboard/{doctor,patient,hospital,admin}`, `components/{ui,dashboard}`, `lib/{auth,prisma,utils}`, `prisma/{schema,migrations,seed}`, `scripts/deploy`

### Patterns

**TypeScript**: Strict typing, ES modules, `.js` imports
**Auth**: Auth.js v5 + PrismaAdapter, `getServerSession()`, role validation
**Database**: Prisma migrations, camelCase client/snake_case DB, UTC timezone
**API**: Consistent `responseFormatter.ts` structure, `/api` + `/m-api` routes
**Security**: CORS, Helmet, rate limiting, input validation, Redis caching

## Guidelines

**TypeScript**: Always strict mode, proper interfaces, shared types, `.js` imports
**Database**: Prisma migrations only (never sync), environment variables
**API**: Thin controllers, service layer logic, Auth.js v5 auth, consistent responses
**Frontend**: Next.js 14 App Router, TypeScript, role-based access, rewrites not API routes
**Quality**: `npm run lint type-check` before commits, Jest with TypeScript
**Environment**: PostgreSQL, JWT_SECRET, CORS URLs, AWS S3, Redis, Docker HOST_IP

## Implementation Status

**Complete**: TypeScript stack, 10+ API routes, service layer, 40+ Prisma models, deployment scripts
**Ready**: Socket.io notifications, AWS S3 uploads, Redis caching, HIPAA compliance patterns, Docker Swarm

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

### 1.4 Auth.js v5 Authentication Standards ✅
- **VERSION**: Always use Auth.js v5 (NextAuth.js v5), not v4 or earlier versions
- **AUTHENTICATION**: Use `getServerSession()` for API route authentication, never legacy `auth()` function
- **DATABASE SESSIONS**: Use PrismaAdapter for database-backed sessions, not JWT tokens
- **ROLE ENFORCEMENT**: Implement strict role-based access control with healthcare business rules
- **SESSION MANAGEMENT**: Use Auth.js v5 session management for secure healthcare data access

### 1.5 Healthcare Business Logic Compliance ✅
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
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    vitalTypeId: {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
  
  // Add proper indexes for performance
  await queryInterface.addIndex('vital_readings', ['patientId', 'createdAt']);
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

## 10. Prisma Naming Convention Standards ⚠️ CRITICAL

### 10.1 Official Prisma Naming Convention Rules - FINAL STANDARD
- **MANDATORY**: Follow these exact Prisma naming conventions for consistency across the entire codebase
- **SCHEMA MODELS**: Use PascalCase (model User, model Patient, model Doctor)
- **DATABASE TABLES**: Use PascalCase via @@map directive (@@map("Users"), @@map("Patients"), @@map("Doctors"))
- **CLIENT PROPERTIES**: Always use camelCase (prisma.user, prisma.patient, prisma.doctor)
- **ABSOLUTE RULE**: Do not fight Prisma conventions → accept camelCase client properties
- **STANDARD**: This approach keeps database pretty (PascalCase tables), schema standard (PascalCase models), and code consistent (camelCase client)

### 10.2 Correct Implementation Pattern
```typescript
// ✅ GOOD: Schema definition (prisma/schema.prisma)
model User {
  id       String @id @default(uuid())
  email    String @unique
  name     String?
  // ... other fields
  @@map("Users")  // PascalCase database table
}

model Patient {
  id      String @id @default(uuid())  
  userId String @unique
  // ... other fields
  @@map("Patients")  // PascalCase database table
}

// ✅ GOOD: Client usage in application code
const users = await prisma.user.findMany()        // camelCase client property
const patient = await prisma.patient.findFirst()  // camelCase client property
const doctors = await prisma.doctor.findMany()    // camelCase client property

// ❌ BAD: Using PascalCase client properties
const users = await prisma.User.findMany()        // Wrong - don't use PascalCase
const patient = await prisma.Patient.findFirst()  // Wrong - inconsistent
```

### 10.3 Database Architecture Benefits
- **Database Tables**: Clean PascalCase names (Users, Patients, Doctors, Appointments)
- **Schema Models**: Standard PascalCase (model User, model Patient) 
- **Application Code**: Consistent camelCase client usage (prisma.user, prisma.patient)
- **Type Safety**: Full TypeScript support maintained throughout

### 10.4 Migration and Schema Consistency Rules - CRITICAL
- **REQUIREMENT**: ALL @@map directives MUST use PascalCase table names consistently
- **STANDARD**: Every model MUST have @@map("PascalCaseTableName") directive  
- **VALIDATION**: Migrations must create PascalCase tables to match schema expectations
- **ENFORCEMENT**: Schema changes require corresponding @@map directives for PascalCase tables
- **ABSOLUTE RULE**: If migrations create lowercase tables, schema must be updated or migrations must be fixed to create PascalCase tables
- **TESTING**: Always test that prisma.camelCaseModel correctly maps to PascalCaseTable after schema changes

## 8. Critical System-Wide Impact Rules

### 8.1 NO ISOLATION TESTING - System-Wide Impact Analysis ⚠️ CRITICAL
- **MANDATORY**: Never fix issues in isolation without considering system-wide implications
- **PROHIBITION**: Do not make changes to shared components, utilities, or configurations without full system analysis
- **REQUIREMENT**: Before any code change, analyze ALL functions, components, and systems that may use the same code
- **VALIDATION**: Test changes across ALL affected areas (authentication, database, frontend, backend, deployment)
- **ANALYSIS**: For any configuration change (DATABASE_URL, environment variables, Docker settings), check impact on:
  - Authentication and session management
  - Database connectivity and migrations
  - Frontend API calls and data flow
  - Deployment and containerization
  - All user roles and dashboard functionality
- **STANDARD**: One fix should not break other functionality - verify end-to-end system health

### 8.2 Comprehensive Impact Assessment Process
```typescript
// ✅ GOOD: Before changing DATABASE_URL
// 1. Check: How does AUTH.JS v5 use DATABASE_URL?
// 2. Check: How does Prisma use DATABASE_URL?
// 3. Check: How do migrations use DATABASE_URL?
// 4. Check: How does Docker Swarm service discovery work?
// 5. Check: Will this affect session storage?
// 6. Check: Will this affect user authentication?
// 7. Test: All critical user flows after change

// ❌ BAD: Changing DATABASE_URL without system-wide analysis
// Just fix database connectivity without considering auth implications
```

### 8.3 Pre-Change Verification Checklist
- **Database Changes**: Test authentication, migrations, seeding, all API routes
- **Authentication Changes**: Test all user roles, session management, API access
- **Docker/Deployment Changes**: Test all services, networking, data persistence
- **API Route Changes**: Test frontend integration, error handling, response formatting
- **Configuration Changes**: Test development, test, and production environments

## 9. Critical Schema-First Development Rule

### 9.1 Schema Verification Before Code Changes ⚠️ CRITICAL
- **MANDATORY**: Always check the actual Prisma schema first before making any database-related code changes
- **PROHIBITION**: Never assume model names, relationship names, or field names without verifying against schema
- **REQUIREMENT**: Use `grep -A20 "model ModelName" prisma/schema.prisma` to verify exact model definitions
- **STANDARD**: Align all API route code to match the exact schema definitions, not the other way around
- **BEST PRACTICE**: Follow Prisma and PostgreSQL naming conventions as defined in the schema
- **VALIDATION**: Always verify relationship field names (e.g., `patient` vs `Patient`) before using in queries
- **COMPLIANCE**: Ensure all database operations align with the established Prisma schema structure

### 9.2 Prisma Model Naming Convention Verification
```typescript
// ✅ GOOD: Always check schema first
// Schema shows: model Patient { ... } @@map("patients")  
// Schema shows: model doctors { ... }
// Schema shows: model EmergencyAlert { ... } @@map("emergency_alerts")

// Then use correct Prisma client calls:
const patient = await prisma.Patient.findFirst() // PascalCase model
const doctor = await prisma.doctors.findFirst()  // snake_case model  
const alert = await prisma.EmergencyAlert.findMany() // PascalCase model

// ❌ BAD: Assuming model names without checking schema
const patient = await prisma.patients.findFirst() // Wrong if schema uses "Patient"
const alert = await prisma.emergency_alerts.findMany() // Wrong if schema uses "EmergencyAlert"
```

### 9.3 Relationship Name Verification
```typescript
// ✅ GOOD: Check schema for exact relationship field names
// Schema: model EmergencyAlert { patient Patient @relation(...) }
const alerts = await prisma.EmergencyAlert.findMany({
  include: { patient: { include: { User: true } } }  // Use exact relationship name from schema
})

// ❌ BAD: Assuming relationship names
const alerts = await prisma.EmergencyAlert.findMany({
  include: { patients: { include: { user: true } } }  // Wrong relationship names
})
```

### 8.4 Prisma and PostgreSQL Best Practices Alignment ⚠️ CRITICAL
- **SCHEMA AUTHORITY**: The Prisma schema in `prisma/schema.prisma` is the single source of truth
- **MODEL CONVENTIONS**: Follow the exact model naming as defined in schema (PascalCase vs snake_case)
- **FIELD VALIDATION**: Always verify field existence before using in queries (e.g., `startDate` vs `appointment_date`)
- **RELATIONSHIP ACCURACY**: Use correct relationship field names (e.g., `user` vs `User`, `patient` vs `Patient`)
- **TYPE SAFETY**: Leverage Prisma's TypeScript generation for compile-time validation
- **POSTGRESQL COMPLIANCE**: Ensure all operations align with PostgreSQL constraints and data types
- **MIGRATION FIRST**: Never modify schema assumptions without checking migration history

```typescript
// ✅ GOOD: Schema-first approach
// 1. Check schema: model AdherenceRecord { patient Patient @relation(...) }
// 2. Use correct relationship name:
const records = await prisma.AdherenceRecord.findMany({
  where: { patient: { primary_care_doctor_id: doctorId } }  // Lowercase 'patient' per schema
})

// ❌ BAD: Assumption-based approach  
const records = await prisma.AdherenceRecord.findMany({
  where: { Patient: { primary_care_doctor_id: doctorId } }  // Wrong! Assumes capital 'Patient'
})
```

### 8.4 Systematic Cross-Application Fixes
- **REQUIREMENT**: When fixing schema inconsistencies, check ALL dashboards (Doctor, Patient, Provider, Admin)
- **STANDARD**: Use grep to find all instances of incorrect model usage across the entire codebase
- **ENFORCEMENT**: Fix all related API routes, not just the one causing immediate errors

## 9. ✅ Validated Prisma + Next.js Best Practices ⚠️ CRITICAL

### **9.1 Naming Conventions**

#### Schema Level (prisma.schema)
- **Models**: Use PascalCase singular form (e.g., `User`, `Post`, `Comment`)
- **Fields**: Use camelCase for field names (e.g., `firstName`, `createdAt`)
- **Enums**: Use PascalCase for enum names and UPPER_CASE for values

#### Database Level
- **Tables**: Common practice is plural snake_case (e.g., `users`, `posts`)
- **Columns**: Snake_case is the general database convention (e.g., `createdAt`, `userId`)

#### Client Level
- **The Prisma Client ALWAYS generates camelCase property names** - this is not configurable
- You access models via `prisma.user`, `prisma.post` (lowercase first letter)

### **9.2 Mapping Strategy**

Use `@@map` and `@map` to bridge the naming convention gap:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  firstName String   @map("firstName")
  createdAt DateTime @default(now()) @map("createdAt")
  posts     Post[]

  @@map("users")
}
```

This approach gives you:
- ✅ Clean PascalCase models in schema
- ✅ Standard snake_case in database
- ✅ Natural camelCase in TypeScript/JavaScript code

### **9.3 Next.js Specific Best Practices**

#### Singleton Pattern (Critical)
To prevent multiple Prisma Client instances during Next.js hot-reloading:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

#### Data Caching Considerations
Next.js Data Cache can cause stale data issues. Use `export const dynamic = 'force-dynamic'` in route segments when you need fresh data

### **9.4 Additional Validated Rules**

#### Performance
- Strategic index placement is crucial for query performance
- Use `@unique` and `@@unique` for constraints
- Consider `@@index` for frequently queried field combinations

#### Type Safety
- The generated Prisma Client provides full TypeScript support
- Model types are automatically generated (e.g., `User`, `Post` types)
- Relation fields are not included in base types by default but can be accessed via helper types

**Migrations**: `npx prisma generate` after changes, `migrate dev/deploy`

**Field Rules**: camelCase client operations (firstName), snake_case DB (@map), never mix conventions

**Separation**: Database (snake_case) → Schema (PascalCase) → Client (camelCase)

# Reminders

- Do only what's asked, nothing more
- Edit existing files, don't create new ones unless absolutely necessary  
- Never proactively create documentation files unless explicitly requested