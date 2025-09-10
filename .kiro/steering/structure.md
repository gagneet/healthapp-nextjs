# Project Structure & Organization

## Architecture Pattern

This is a **Next.js 14 full-stack application** using the App Router pattern. Both frontend and backend logic coexist in the same codebase, with API routes handling server-side operations and React components managing the UI.

## Directory Structure

### Core Application (`/app`)
- `app/api/` - Next.js API routes (backend functionality)
  - `app/api/auth/` - Auth.js v5 authentication endpoints
  - `app/api/patients/`, `app/api/doctors/` - Healthcare entity management
  - `app/api/appointments/`, `app/api/care-plans/` - Medical workflow APIs
  - `app/api/lab/`, `app/api/video-consultations/` - Advanced features
- `app/dashboard/` - Role-based dashboard pages
  - `app/dashboard/doctor/` - Doctor interface with real-time data
  - `app/dashboard/patient/` - Patient interface with care tracking
  - `app/dashboard/admin/` - System administration interface
- `app/auth/` - Authentication UI pages
- `app/globals.css` - Global styles and Tailwind imports
- `app/layout.tsx` - Root layout with providers and error boundaries

### Reusable Components (`/components`)
- `components/ui/` - Base UI components (buttons, forms, modals)
- `components/dashboard/` - Dashboard-specific components
- `components/patient/`, `components/care-plans/` - Feature-specific components
- `components/providers/` - React Context providers
- `components/video-consultation/` - Telemedicine components

### Business Logic (`/lib`)
- `lib/auth.ts` - Auth.js v5 configuration with healthcare roles
- `lib/prisma.ts` - Prisma client with connection pooling
- `lib/api-services.ts` - Healthcare API service functions
- `lib/services/` - Business logic services
- `lib/validations/` - Zod schemas for data validation
- `lib/utils.ts` - Utility functions

### Database (`/prisma`)
- `prisma/schema.prisma` - 46+ healthcare models with proper relations
- `prisma/migrations/` - Versioned database migrations
- `prisma/seed.ts` - Production-ready seeding system

### Type Definitions (`/types`)
- `types/auth.ts` - Authentication and user role types
- `types/dashboard.ts` - Dashboard-specific interfaces
- `types/next-auth.d.ts` - Auth.js v5 type extensions

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`PatientDashboard.tsx`)
- **Pages**: kebab-case for routes (`care-plans/`, `video-consultation/`)
- **API Routes**: RESTful naming (`/api/patients/[id]/appointments`)
- **Utilities**: camelCase (`api-services.ts`, `auth-helpers.ts`)

### Code Conventions
- **Interfaces**: PascalCase with descriptive names (`PatientProfile`, `DoctorDashboardData`)
- **Functions**: camelCase (`getDoctorDashboard`, `validatePatientAccess`)
- **Constants**: UPPER_SNAKE_CASE (`USER_ROLES`, `API_ENDPOINTS`)
- **Database Fields**: snake_case (matches Prisma schema)

## Import Path Aliases

```typescript
// Configured in tsconfig.json
"@/*": ["./*"]                    // Root imports
"@/components/*": ["./components/*"]
"@/lib/*": ["./lib/*"]
"@/app/*": ["./app/*"]
"@/types/*": ["./types/*"]
```

## Healthcare-Specific Organization

### Role-Based Access Control
- Each API route implements healthcare role validation
- Components check user permissions before rendering sensitive data
- Database queries filter data based on user role and relationships

### Medical Data Flow
1. **Input**: Forms with Zod validation
2. **Processing**: Business logic in `/lib/services`
3. **Storage**: Prisma ORM with PostgreSQL
4. **Output**: Type-safe API responses with healthcare formatting

### Compliance Structure
- Audit logging implemented across all medical data operations
- Error boundaries protect against crashes with sensitive data
- Null safety patterns enforced throughout (see CODING_RULES.md)

## Deployment Structure

### Docker Configuration (`/docker`)
- Multi-environment Dockerfiles (local, test, production)
- Docker Compose configurations for each environment
- Universal deployment scripts in `/scripts`

### Documentation (`/docs`)
- Technical implementation guides
- Healthcare business logic documentation
- Deployment and migration guides