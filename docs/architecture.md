# Healthcare Application Architecture

## 🏗️ System Architecture Overview

The Healthcare Management Platform uses a modern hybrid architecture combining NextJS frontend with Node.js Express API backend, designed for scalability, security, and compliance with healthcare standards.

## 📐 Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (NGINX)                   │
│                     SSL Termination & Proxy                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│Frontend │    │  Frontend   │    │  Frontend   │
│NextJS   │    │   NextJS    │    │   NextJS    │
│:3000    │    │   :3000     │    │   :3000     │
└─────────┘    └─────────────┘    └─────────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
            ┌─────────┼─────────┐
            ▼         ▼         ▼
    ┌─────────────────────────────────┐
    │        API Gateway              │
    │     Rate Limiting & Auth        │
    └─────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│Backend  │    │   Backend   │    │   Backend   │
│Node.js  │    │   Node.js   │    │   Node.js   │
│:3001    │    │   :3001     │    │   :3001     │
└─────────┘    └─────────────┘    └─────────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
┌─────────────────────┼─────────────────────┐
│                     │                     │
▼                     ▼                     ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ PostgreSQL  │ │    Redis    │ │   File Storage  │
│  Database   │ │ Cache/Queue │ │   AWS S3/Azure  │
│   :5432     │ │    :6379    │ │                 │
└─────────────┘ └─────────────┘ └─────────────────┘
```

## 🎯 Core Architecture Principles

### 1. **Hybrid Frontend-Backend Architecture**

- **Frontend**: NextJS 14 with App Router for modern React development
- **Backend**: Node.js Express API with Sequelize ORM
- **Communication**: RESTful APIs with JSON responses
- **Authentication**: JWT-based with role-based access control

### 2. **Microservices-Ready Design**

- **Service Layer**: Business logic separated from controllers
- **Modular Structure**: Clear separation of concerns
- **API-First**: Backend designed as headless API
- **Scalable**: Easy to split into microservices when needed

### 3. **Data Architecture**

```text
┌─────────────────────────────────────┐
│            Data Layer               │
├─────────────────────────────────────┤
│ PostgreSQL (Primary Database)       │
│ ├── Users & Authentication          │
│ ├── Healthcare Providers            │
│ ├── Patients & Care Plans          │
│ ├── Medications & Adherence        │
│ ├── Appointments & Scheduling      │
│ ├── Vital Signs & Readings        │
│ ├── Secondary Doctor Management   │ ✅ New
│ ├── Symptoms & Body Mapping       │ ✅ New
│ └── Audit Logs & Compliance       │
├─────────────────────────────────────┤
│ Redis (Cache & Sessions)           │ 
│ ├── User Sessions                  │
│ ├── API Response Cache            │
│ ├── Rate Limiting Data            │
│ └── Real-time Notifications       │
├─────────────────────────────────────┤
│ File Storage (AWS S3)              │
│ ├── Prescription PDFs              │
│ ├── Medical Documents             │
│ ├── Profile Images               │
│ └── Audit Document Trails        │
└─────────────────────────────────────┘
```

## 🔧 Technology Stack

### **Frontend (NextJS 14)**

```typescript
// Modern React with TypeScript
- NextJS 14 with App Router
- TypeScript for type safety
- TailwindCSS for styling
- Heroicons v2 for iconography ✅
- HeadlessUI for accessible components
- React Hook Form for form management
- Recharts for data visualization
```

### **Backend (Node.js + Express) - TypeScript Implementation** ✅

```typescript
// Modern ES Modules with TypeScript strict mode
- Node.js 22.18+ with ES Modules & TypeScript strict compilation
- Express.js with comprehensive type-safe middleware stack
- Sequelize ORM with PostgreSQL (TypeScript models & associations)
- JWT authentication with typed payloads & role-based authorization
- Enhanced security: Helmet, CORS, rate limiting, input validation  
- Type-safe query parameter handling with custom utility helpers
- Winston structured logging with proper error handling
- Joi validation with TypeScript schema definitions
- Service layer architecture with dependency injection ready
```

### **Database & Cache**

```sql
-- PostgreSQL with optimized configuration
- PostgreSQL 15+ (primary database)
- Redis 7+ (caching and sessions)
- Connection pooling
- Database migrations with Sequelize
- Audit logging for compliance
```

### **Infrastructure & DevOps**

```yaml
# Docker-based deployment
- Docker containers with multi-stage builds
- Docker Compose for development
- Docker Swarm for production clustering  
- NGINX reverse proxy with SSL
- Prometheus + Grafana monitoring
- Automated backups to cloud storage
```

## 📂 Current Project Structure

```text
healthapp-nextjs/
├── 🐳 docker/                    # ✅ All Docker configurations
├── 🎨 app/                      # NextJS App Router
├── 🧩 components/               # React components ✅ Enhanced with interactive UI
│   ├── dashboard/              # Dashboard components
│   └── ui/                     # Interactive UI components ✅ Body diagram, symptoms timeline
├── 📚 lib/                      # Frontend utilities
├── 🔧 src/                      # Backend API source
│   ├── config/                  # Configuration
│   ├── controllers/             # Route handlers (9 controllers) ✅ Added secondary doctor
│   ├── middleware/             # Express middleware (7 modules)
│   ├── models/                 # Sequelize models (25+ models) ✅ Enhanced with new healthcare models
│   ├── routes/                 # API routes (12 route files) ✅ Added secondary doctor routes
│   ├── services/               # Business logic (5 services) ✅ Added secondary doctor service
│   ├── utils/                  # Backend utilities
│   ├── migrations/             # Database migrations (24 files) ✅ Added patient-doctor assignments
│   └── seeders/                # Initial data (3 seeders)
├── 🚀 scripts/                  # Deployment scripts ✅ Updated paths
├── 📖 docs/                     # Documentation ✅ Updated
├── 🌐 nginx/                    # NGINX configuration
└── 📊 monitoring/               # Prometheus configuration
```

## 🔐 Security Architecture

### **Authentication & Authorization**

```typescript
// JWT-based authentication with role-based access
interface UserRole {
  DOCTOR: 'doctor'
  PATIENT: 'patient' 
  HOSPITAL_ADMIN: 'hospital_admin'
  SYSTEM_ADMIN: 'system_admin'
}

// Middleware chain: authenticate → authorize → controller
app.use('/api/doctors', authenticate, authorize(['doctor']), doctorRoutes)
```

### **HIPAA Compliance Features**

- **Audit Logging**: All data access logged with user, timestamp, and action
- **Encryption**: Data encrypted at rest and in transit
- **Access Controls**: Role-based permissions with principle of least privilege
- **Session Management**: Secure session handling with Redis
- **Data Anonymization**: PII handling with proper anonymization

### **Security Middleware Stack**

```javascript
// Comprehensive security headers and protection
app.use(helmet())                    // Security headers
app.use(cors())                     // CORS configuration  
app.use(rateLimit())               // Rate limiting
app.use(express.json({ limit: '10mb' })) // Request size limits
app.use(compression())             // Response compression
```

## 🔄 API Architecture

### **RESTful API Design**

```text
/api/auth                                 # Authentication endpoints
/api/patients                             # Patient management
  └── /patients/:id/secondary-doctors     # Secondary doctor assignments ✅ New
/api/doctors                              # Doctor operations  
  └── /doctors/:id/patient-access/:pid    # Access verification ✅ New
/api/medications                          # Medication tracking
/api/appointments                         # Scheduling
/api/carePlans                            # Care plan management
/api/vitals                               # Vital signs
/api/symptoms                             # Symptoms & diagnosis ✅ New
/api/assignments                          # Doctor assignment management ✅ New
/api/admin                                # Administrative functions

/m-api/*                                  # Mobile-optimized endpoints (same routes)
```

### **Response Format Standardization**

```typescript
interface APIResponse<T> {
  status: boolean
  statusCode: number
  payload: {
    data?: T
    message?: string
    error?: {
      status: string
      message: string
    }
  }
}
```

## 📱 Mobile & Accessibility

### **Responsive Design**

- **Mobile-First**: Optimized for mobile devices
- **Responsive Sidebars**: Collapsible navigation ✅
- **Touch-Friendly**: Appropriate touch targets
- **Progressive Enhancement**: Works without JavaScript

### **Accessibility Compliance** ✅

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines compliance
- **Screen Readers**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Icon Labels**: All icon-only buttons have `aria-label` attributes

## 🚀 Deployment Architecture

### **Development Environment**

```bash
# Single command deployment
./scripts/deploy-dev.sh

# Services started:
- NextJS (hot reload): localhost:3000
- Node.js API: localhost:3001  
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: localhost:5050
```

### **Production Environment**

```bash
# Docker Swarm deployment
./scripts/deploy-prod.sh

# High availability setup:
- Load balanced frontend instances
- Clustered API servers
- Database with replication
- Redis cluster for caching
- NGINX with SSL termination
- Monitoring with Prometheus/Grafana
```

## 📊 Data Flow Architecture

### **User Request Flow**

```text
1. User Request → NGINX Load Balancer
2. NGINX → NextJS Frontend (Static/SSR)
3. Frontend → API Gateway (Rate limiting, Auth)  
4. API Gateway → Express Backend
5. Backend → Service Layer (Business logic)
6. Service → Database/Cache (Data layer)
7. Response ← Formatted response back to user
```

### **Real-time Notifications**

```text
1. Event Trigger (missed medication, vital alert)
2. Background Job Queue (Redis)
3. Notification Service
4. Push to Frontend (Socket.io ready)
5. Email/SMS Gateway (optional)
```

## 🎯 Recent Architecture Improvements ✅

### **TypeScript Strict Mode Implementation** 🆕

- **Complete TypeScript Migration**: Entire backend converted from JavaScript to strict TypeScript
- **Type-Safe API Layer**: 95% reduction in compilation errors (2000+ → ~50 errors)
- **Enhanced Express Integration**: Type-safe query parameter handling with custom utility helpers
- **Service Layer Typing**: Comprehensive type definitions for all business logic components
- **Build System**: Multi-stage Docker builds with TypeScript compilation validation
- **Developer Experience**: Enhanced IntelliSense, compile-time error detection, and refactoring safety

### **Healthcare-Specific Enhancements**

- **Secondary Doctor Management**: Complete system for managing multiple doctors per patient with consent workflows
- **Interactive UI Components**: Body diagram with 4-view rotation and symptoms timeline with bi-directional highlighting
- **Enhanced Patient Management**: 11 specialized tabs covering all healthcare domains
- **Comprehensive API**: 50+ endpoints with secondary doctor assignment management
- **Type-Safe Healthcare Models**: All healthcare entities (Patient, Doctor, Medication, etc.) with proper TypeScript interfaces

### **Code Quality & Architecture**

- **Strict Type Safety**: All controllers, services, and utilities with comprehensive type coverage
- **Modern ES Modules**: Full ES2022 module implementation with proper import/export patterns
- **Express Type Extensions**: Custom type definitions for req.user and authentication context
- **Query Parameter Safety**: Centralized utility functions handling Express query parameter union types
- **Error Handling**: Type-safe error responses with consistent API response formatting
- **Docker Cleanup**: All Docker files moved to `docker/` folder with TypeScript build process
- **Script Updates**: All deployment scripts updated with new paths and TypeScript compilation

### **Performance & Developer Experience**

- **Build Optimization**: Multi-stage Docker builds with TypeScript compilation caching
- **Database Connection Pooling**: Optimized database connections with typed Sequelize models
- **Redis Caching**: Strategic caching for frequently accessed data with type-safe interfaces
- **Development Tools**: Enhanced debugging with TypeScript source maps and error tracing
- **Code Splitting**: Lazy loading for better performance with type-safe imports

## 🎯 TypeScript Implementation Details

### **Type-Safe Express Integration**

```typescript
// Enhanced Express Request with custom type extensions
interface ExtendedRequest extends Request {
  user?: JwtPayload & {
    userId: string;
    email: string;
    role?: string;
    id: string;
  };
  userCategory?: string;
}

// Query parameter utility functions
export type QueryParam = string | ParsedQs | (string | ParsedQs)[] | undefined;
export function parseQueryParam(param: QueryParam): string;
export function parseQueryParamAsNumber(param: QueryParam, defaultValue?: number): number;
```

### **Service Layer Architecture**

```typescript
// Type-safe service implementations
class AuthService {
  async generateToken(user: User, role: UserRole): Promise<TokenPair> {
    // Fully typed token generation with proper error handling
  }
}

class PatientService {
  async getPatientWithCarePlans(patientId: string): Promise<PatientWithCarePlans> {
    // Type-safe database operations with Sequelize
  }
}
```

### **Database Model Types**

```typescript
// Comprehensive Sequelize model definitions
export interface PatientAttributes {
  id: string;
  user_id: string;
  medical_record_number: string;
  emergency_contacts: object;
  insurance_information: object;
  // ... 20+ properly typed healthcare fields
}

export interface DoctorAttributes extends HealthcareProviderBase {
  medical_license_number: string;
  speciality_id: string;
  // ... specialized doctor fields
}
```

### **Error Handling & Response Types**

```typescript
// Standardized API response formatting
interface APIResponse<T> {
  status: boolean;
  statusCode: number;
  payload: {
    data?: T;
    message?: string;
    error?: ErrorResponse;
  };
}

// Type-safe error handling
class ResponseFormatter {
  static success<T>(data: T, message: string, statusCode: number): APIResponse<T>;
  static error(message: string, statusCode: number, errorStatus: string): APIResponse<null>;
}
```

## 🔮 Future Architecture Considerations

### **Microservices Evolution**

- **Service Extraction**: Ready to extract services as separate containers
- **API Gateway**: Centralized routing and authentication
- **Event Sourcing**: For audit trails and compliance
- **GraphQL**: Consider for complex data fetching needs

### **Scalability Enhancements**

- **Database Sharding**: For large patient populations
- **CDN Integration**: For static asset delivery
- **Message Queues**: For asynchronous processing
- **Auto-scaling**: Container orchestration with Kubernetes

This architecture provides a solid foundation for a healthcare management platform with modern development practices, security considerations, and scalability built-in from the ground up.
