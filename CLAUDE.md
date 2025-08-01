# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **AdhereLive Healthcare Management Platform** backend - a modern, robust Node.js/Express application built with ES modules. The system manages patients, doctors, medications, care plans, appointments, and vital signs tracking. It's designed to help healthcare providers monitor patient medication adherence and overall care management with real-time capabilities.

## Development Commands

```bash
# Development
npm run dev                    # Start development server with nodemon
npm start                     # Start production server

# Database Management
npm run migrate               # Run all pending migrations
npm run migrate:undo          # Undo last migration
npm run seed                  # Run all seeders
npm run seed:undo            # Undo all seeders

# Testing
npm test                     # Run Jest test suite with --detectOpenHandles
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate test coverage report

# Code Quality
npm run lint                 # Run ESLint on src/
npm run lint:fix             # Auto-fix ESLint issues
```

## Architecture Overview

### Core Technology Stack
- **Runtime**: Node.js (>=18.0.0) with ES Modules
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with role-based access control  
- **Security**: Helmet, CORS, rate limiting, input validation
- **Caching**: Redis integration for sessions and caching
- **Cloud Storage**: AWS S3 SDK v3 for file uploads
- **Real-time**: Socket.io ready for notifications
- **Testing**: Jest with Node.js environment

### Database Architecture
The application uses Sequelize with the following core models and relationships:

**User Management**:
- `User` (base user table) → `UserRole` (many-to-many roles)
- `User` → `Doctor`, `Patient`, `Provider` (one-to-one specialized profiles)

**Healthcare Domain**:
- `Doctor` → `Speciality` (belongs to speciality)
- `Patient` → `CarePlan` (one-to-many care plans)
- `CarePlan` → `Medication`, `Vital` (one-to-many)
- `Medicine` → `Medication` (template to instance relationship)
- `VitalTemplate` → `Vital` (template to instance relationship)

### Project Structure (Complete Implementation)
```
src/
├── config/           # Database, JWT, constants, cloud config
├── controllers/      # Route handlers for each domain (8 controllers)
├── middleware/       # Auth, validation, error handling, rate limiting, logging
├── models/          # Sequelize models and associations (13+ models)
├── routes/          # API route definitions (10 route files)
├── services/        # Business logic and data processing (4 services)
├── utils/           # Helper functions, validators, response formatters
├── migrations/      # Database schema migrations
├── seeders/         # Initial data seeding
└── server.js        # Modern ES module application entry point
```

### Key Structural Changes from Initial Analysis
- **Complete Routes Layer**: Now includes `/routes` directory with organized API endpoints
- **Service Layer**: Added business logic separation with dedicated service classes
- **Database Migrations**: Proper migration system with versioned schema changes
- **Seeders**: Initial data population for specialists, medicines, vital templates
- **TypeScript Definitions**: Complete type definitions in `/typings` directory
- **Modern Module System**: Full ES module conversion with `.js` imports

### Key Architectural Patterns

**Modern ES Module Architecture**:
- Full ES module implementation with `import/export` syntax
- All imports use `.js` extensions for proper module resolution
- Top-level await support ready for Node.js 18+
- Modern async/await patterns throughout

**Authentication & Authorization**:
- JWT-based authentication with Bearer tokens
- Role-based access control via `USER_CATEGORIES` constants
- Middleware chain: `authenticate` → `authorize(...roles)` → controller
- Service layer separation for auth business logic

**Database Patterns**:
- All models use Sequelize with consistent naming (camelCase in code, snake_case in DB)
- Associations defined centrally in `src/models/associations.js`
- Migration-driven schema management with versioned changes
- Seeded data for initial system setup (specialists, medicines, vital templates)
- Connection pooling configured for production scalability
- Database timezone set to UTC (+00:00)

**Service Layer Architecture**:
- `AuthService.js` - Authentication and user management logic
- `PatientService.js` - Patient data processing and business rules
- `MedicationService.js` - Medication management and adherence tracking
- `SchedulingService.js` - Appointment and scheduling logic

**API Response Format**:
All API responses follow a consistent structure via `responseFormatter.js`:
```javascript
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
- CORS configured for frontend integration
- Helmet for security headers
- Rate limiting on `/api` and `/m-api` routes
- Input validation using Joi and express-validator
- Password hashing with bcryptjs
- Request size limits (10mb)
- Redis integration for session management and caching
- AWS S3 SDK v3 for secure file uploads

## Development Guidelines

### Modern ES Module Development
- Always use `import/export` syntax, never `require()`
- Include `.js` file extensions in all relative imports
- Use top-level await when needed (Node.js 18+ support)
- Leverage modern async/await patterns over callbacks or promises chains

### Database Development  
- Use migrations for all schema changes (`npx sequelize-cli migration:generate`)
- Database syncs automatically in development with `{ alter: true }`
- Production deployments must use migrations, never sync
- Use seeders for initial data population (`npm run seed`)
- All sensitive data must use environment variables

### API Development
- Controllers should be thin - business logic belongs in the service layer
- Use the established service classes: AuthService, PatientService, MedicationService, SchedulingService
- Utilize middleware for cross-cutting concerns (auth, validation, logging, rate limiting)
- Follow consistent error handling via `errorHandler.js` middleware
- Use `responseFormatter.js` for consistent API responses
- All routes prefixed with `/api` (web) and `/m-api` (mobile) - both use same routes

### Code Quality & Testing
- Run `npm run lint` before commits - ESLint configured for modern JavaScript
- Use `npm run lint:fix` for auto-fixable issues
- Jest configured with `--detectOpenHandles` for proper cleanup
- Write tests using modern async/await syntax
- Use `npm run test:coverage` to maintain coverage standards

### Environment Configuration
- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- Authentication: `JWT_SECRET` for token signing
- Application: `PORT`, `NODE_ENV`, `FRONTEND_URL` for CORS
- Cloud: AWS S3 credentials for file uploads
- Caching: Redis connection parameters

## Key Implementation Notes

### Fully Implemented Architecture
The codebase now includes a complete, production-ready implementation:

**✅ Complete Route Layer**: 
- 10 organized route files covering all healthcare domains
- Proper route organization with `/api` and `/m-api` endpoints
- Comprehensive CRUD operations for all entities

**✅ Service Layer Architecture**:
- AuthService: User authentication and JWT management
- PatientService: Patient data processing and business rules  
- MedicationService: Medication adherence and tracking logic
- SchedulingService: Appointment and calendar management

**✅ Database Infrastructure**:
- Migration system with versioned schema changes
- Seeded initial data (specialists, medicines, vital templates)
- 13+ comprehensive models with proper associations

**✅ Modern Development Stack**:
- Full ES module conversion for better tree-shaking and maintainability
- TypeScript definitions for improved developer experience
- ESLint configuration for code quality
- Enhanced Jest testing setup with coverage reporting

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

### Performance & Scalability Features
- **Database Optimization**: Connection pooling, proper indexing patterns
- **Modern Caching**: Redis integration for high-performance data access
- **Monitoring Ready**: Winston logging configured for production monitoring
- **Security Hardened**: Rate limiting, input validation, secure headers
- **Mobile Optimized**: Separate mobile API endpoints with optimized responses