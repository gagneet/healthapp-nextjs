# Healthcare Application Project Structure

## 📁 Complete Project Architecture

This document outlines the current project structure for the Healthcare Management Platform, which uses a hybrid architecture combining NextJS frontend with Node.js Express API backend.

```
healthapp-nextjs/
├── 📂 docker/                           # Docker Configuration Files
│   ├── Dockerfile                       # NextJS frontend container
│   ├── Dockerfile.backend               # Node.js API container
│   ├── docker-compose.dev.yml           # Development environment
│   ├── docker-compose.prod.yml          # Production environment
│   └── docker-stack.yml                 # Docker Swarm deployment
│
├── 🎨 Frontend (NextJS 14 + TypeScript)
│   ├── 📂 app/                          # NextJS App Router
│   │   ├── 📂 api/                      # API route handlers
│   │   │   └── health/
│   │   │       └── route.ts             # Health check endpoint
│   │   ├── 📂 auth/                     # Authentication pages
│   │   │   └── login/
│   │   │       └── page.tsx             # Login page
│   │   ├── 📂 dashboard/                # Dashboard layouts & pages
│   │   │   ├── 📂 doctor/               # Doctor-specific pages
│   │   │   │   ├── layout.tsx           # Doctor layout
│   │   │   │   ├── page.tsx            # Doctor dashboard
│   │   │   │   ├── 📂 patients/        # Patient management
│   │   │   │   ├── 📂 services/        # Service management
│   │   │   │   └── 📂 templates/       # Care plan templates
│   │   │   ├── 📂 patient/             # Patient-specific pages
│   │   │   │   ├── layout.tsx          # Patient layout
│   │   │   │   └── page.tsx           # Patient dashboard
│   │   │   └── 📂 hospital/            # Hospital/Provider pages
│   │   │       ├── layout.tsx          # Hospital layout
│   │   │       ├── page.tsx           # Hospital dashboard
│   │   │       ├── 📂 staff/          # Staff management
│   │   │       └── 📂 organizations/  # Organization management
│   │   ├── globals.css                  # Global styles
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Landing page
│   │
│   ├── 📂 components/                   # Reusable React Components
│   │   ├── 📂 dashboard/                # Dashboard-specific components
│   │   │   ├── doctor-sidebar.tsx       # Doctor navigation ✅ Accessibility fixed
│   │   │   ├── patient-sidebar.tsx      # Patient navigation ✅ Accessibility fixed
│   │   │   ├── sidebar.tsx              # General sidebar ✅ Accessibility fixed
│   │   │   ├── notification-drawer.tsx  # Notifications ✅ Accessibility fixed
│   │   │   ├── patient-quick-view.tsx   # Patient overview drawer
│   │   │   └── prescription-generator.tsx # PDF prescription generator
│   │   └── 📂 ui/                       # Base UI components
│   │       ├── card.tsx                 # Card component
│   │       ├── body-diagram.tsx         # Interactive body diagram ✅ New
│   │       └── symptoms-timeline.tsx    # Symptoms timeline ✅ New
│   │
│   ├── 📂 lib/                          # Frontend Utilities
│   │   ├── api.ts                       # API client configuration
│   │   ├── auth-context.tsx             # Authentication context
│   │   └── utils.ts                     # Utility functions
│   │
│   └── 📂 types/                        # TypeScript Type Definitions
│       ├── auth.ts                      # Authentication types
│       └── dashboard.ts                 # Dashboard types
│
├── 🔧 Backend (Node.js + Express + Sequelize)
│   └── 📂 src/                          # Backend Source Code
│       ├── 📂 config/                   # Configuration Files
│       │   ├── cloud.js                 # AWS S3 configuration
│       │   ├── config.js                # Main configuration
│       │   ├── constants.js             # Application constants
│       │   ├── database.js              # MySQL database config
│       │   ├── database-postgres.js     # PostgreSQL database config
│       │   ├── enums.js                 # Enumeration definitions
│       │   └── jwt.js                   # JWT configuration
│       │
│       ├── 📂 controllers/              # Route Controllers
│       │   ├── adminController.js       # Admin operations
│       │   ├── appointmentController.js # Appointment management
│       │   ├── authController.js        # Authentication
│       │   ├── carePlanController.js    # Care plan management
│       │   ├── doctorController.js      # Doctor operations
│       │   ├── medicationController.js  # Medication tracking
│       │   ├── patientController.js     # Patient management
│       │   ├── secondaryDoctorController.js # Secondary doctor assignments ✅ New
│       │   ├── symptomsDiagnosisController.js # Symptoms & diagnosis management ✅ New
│       │   └── vitalsController.js      # Vital signs tracking
│       │
│       ├── 📂 middleware/               # Express Middleware
│       │   ├── auth.js                  # Authentication middleware
│       │   ├── errorHandler.js          # Error handling
│       │   ├── hipaaCompliance.js       # HIPAA compliance
│       │   ├── logger.js                # Request logging
│       │   ├── providerCapability.js    # Provider capabilities
│       │   ├── rateLimiter.js           # Rate limiting
│       │   └── vaidation.js             # Input validation
│       │
│       ├── 📂 models/                   # Sequelize Models
│       │   ├── index.js                 # Model exports
│       │   ├── associations.js          # Model relationships
│       │   ├── User.js                  # User model
│       │   ├── Doctor.js                # Doctor profile
│       │   ├── Patient.js               # Patient profile
│       │   ├── Provider.js              # Healthcare provider (legacy)
│       │   ├── HealthcareProvider.js    # New provider model ✅
│       │   ├── PatientDoctorAssignment.js # Secondary doctor management ✅ New
│       │   ├── CarePlan.js              # Care plans
│       │   ├── Medications.js           # Medication instances
│       │   ├── Medicine.js              # Medicine templates
│       │   ├── Appointment.js           # Appointments
│       │   ├── Vital.js                 # Vital sign readings
│       │   ├── VitalTemplate.js         # Vital templates
│       │   ├── VitalType.js             # Vital types ✅ New
│       │   ├── VitalReading.js          # Enhanced vital readings ✅ New
│       │   ├── Symptom.js               # Patient symptoms ✅ New
│       │   ├── SymptomsDatabase.js      # Symptoms database ✅ New
│       │   ├── TreatmentDatabase.js     # Treatment database ✅ New
│       │   ├── Notification.js          # System notifications
│       │   └── [additional models...]   # Other domain models
│       │
│       ├── 📂 routes/                   # API Route Definitions
│       │   ├── index.js                 # Route aggregation
│       │   ├── auth.js                  # Authentication routes
│       │   ├── patients.js              # Patient endpoints
│       │   ├── doctors.js               # Doctor endpoints
│       │   ├── medications.js           # Medication endpoints
│       │   ├── appointments.js          # Appointment endpoints
│       │   ├── carePlans.js             # Care plan endpoints
│       │   ├── vitals.js                # Vital signs endpoints
│       │   ├── admin.js                 # Admin endpoints
│       │   ├── search.js                # Search functionality
│       │   ├── secondaryDoctorRoutes.js # Secondary doctor management ✅ New
│       │   └── symptoms.js              # Symptoms & diagnosis endpoints ✅ New
│       │
│       ├── 📂 services/                 # Business Logic Layer
│       │   ├── AuthService.js           # Authentication services
│       │   ├── PatientService.js        # Patient business logic
│       │   ├── MedicationService.js     # Medication management
│       │   ├── SchedulingService.js     # Appointment scheduling
│       │   └── SecondaryDoctorService.js # Secondary doctor management ✅ New
│       │
│       ├── 📂 utils/                    # Backend Utilities
│       │   ├── helpers.js               # Helper functions
│       │   ├── responseFormatter.js     # API response formatting
│       │   └── validators.js            # Data validation
│       │
│       ├── 📂 migrations/               # Database Migrations (24 files)
│       │   ├── 001-create-organizations.cjs
│       │   ├── 002-create-users.cjs
│       │   ├── [003-022...]            # PostgreSQL migrations
│       │   ├── 023-add-patient-id-field.cjs
│       │   └── 20250105120000-create-patient-doctor-assignments.js ✅ New
│       │
│       ├── 📂 seeders/                  # Database Seeders
│       │   ├── 001-specialists.js       # Medical specialties
│       │   ├── 002-medicines.js         # Medicine catalog
│       │   └── 003-vital-templates.js   # Vital sign templates
│       │
│       └── server.js                    # Express server entry point
│
├── 🚀 Deployment & Infrastructure
│   ├── 📂 scripts/                      # Deployment Scripts
│   │   ├── deploy-dev.sh                # Development deployment ✅ Updated paths
│   │   ├── deploy-prod.sh               # Production deployment ✅ Updated paths
│   │   ├── reset-dev.sh                 # Environment reset ✅ Updated paths
│   │   ├── backup-prod.sh               # Backup script ✅ Updated paths
│   │   ├── docker-swarm-init.sh         # Swarm initialization
│   │   └── [additional scripts...]      # Database and utility scripts
│   │
│   ├── 📂 nginx/                        # NGINX Configuration
│   │   └── nginx.conf                   # Reverse proxy config
│   │
│   └── 📂 monitoring/                   # Monitoring Configuration
│       └── prometheus.yml               # Prometheus metrics config
│
├── 📚 Documentation
│   └── 📂 docs/                         # Project Documentation
│       ├── architecture.md              # System architecture
│       ├── docker_deployment_guide.md   # Docker deployment ✅ Updated
│       ├── docker_implementation.md     # Docker implementation
│       ├── project_folder_structure.md  # This file ✅ Updated
│       ├── nextjs_implementation_for_app_ui.md # Frontend implementation
│       └── [additional docs...]         # Other documentation
│
├── 🔧 Configuration Files (Root Level)
│   ├── package.json                     # Node.js dependencies & scripts
│   ├── package-lock.json               # Dependency lock file
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── next.config.js                  # NextJS configuration
│   ├── tailwind.config.js              # TailwindCSS configuration
│   ├── postcss.config.js               # PostCSS configuration
│   ├── CLAUDE.md                       # AI assistant instructions
│   ├── README.md                       # Project overview
│   └── LICENSE                         # License file
│
└── 📂 typings/                          # TypeScript Definition Files
    └── 📂 src/                          # Backend type definitions
        ├── 📂 config/
        ├── 📂 controllers/
        ├── 📂 middleware/
        ├── 📂 models/
        ├── 📂 services/
        └── 📂 utils/
```

## 🏗️ Architecture Overview

### Frontend Architecture (NextJS 14)
- **App Router**: Modern NextJS routing with layouts
- **TypeScript**: Full type safety across the application
- **TailwindCSS**: Utility-first CSS framework
- **Component Architecture**: Reusable, accessible components
- **Role-based Layouts**: Separate dashboards for doctors, patients, and hospitals

### Backend Architecture (Node.js + Express)
- **RESTful API**: Well-structured API endpoints
- **Sequelize ORM**: Database abstraction with PostgreSQL
- **Service Layer**: Business logic separation
- **Middleware Stack**: Authentication, validation, rate limiting
- **Modern ES Modules**: Full ES6+ module support

### Recent Improvements ✅
- **Secondary Doctor Management**: Complete system for managing multiple doctors per patient with consent workflows
- **Interactive UI Components**: Body diagram with 4-view rotation and symptoms timeline
- **Enhanced Patient Management**: Comprehensive patient detail pages with 11 specialized tabs
- **Accessibility**: All icon-only buttons have proper `aria-label` attributes
- **Icon Standardization**: Migrated to Heroicons v2 compatible icons
- **Project Organization**: Docker files moved to dedicated `docker/` folder
- **Mobile Responsiveness**: Enhanced sidebar navigation for all devices
- **Clean Architecture**: Organized root directory structure

### Database Layer
- **PostgreSQL**: Primary database with connection pooling
- **Redis**: Caching and session management
- **Migrations**: Version-controlled schema changes
- **Seeders**: Initial data population
- **HIPAA Compliance**: Secure data handling patterns

### Infrastructure
- **Docker**: Containerized deployment with multi-stage builds
- **NGINX**: Reverse proxy with SSL termination
- **Monitoring**: Prometheus + Grafana stack
- **Automated Backups**: S3 integration with retention policies
- **Docker Swarm**: Production-ready clustering

## 🎯 Key Features Implemented

### Healthcare Domain
- **Patient Management**: Complete patient lifecycle management
- **Medication Tracking**: Adherence monitoring and reminders
- **Care Plans**: Templated and customized care management
- **Appointment Scheduling**: Provider and patient scheduling
- **Vital Signs**: Tracking and trend analysis
- **Prescription Management**: Digital prescription generation

### Technical Features
- **Authentication**: JWT-based with role-based access control
- **Real-time**: Socket.io ready for notifications
- **Cloud Storage**: AWS S3 integration for file uploads
- **Audit Logging**: HIPAA-compliant activity tracking
- **Performance**: Caching, connection pooling, optimized queries

This structure supports a scalable, maintainable healthcare management platform with clear separation of concerns and modern development practices.