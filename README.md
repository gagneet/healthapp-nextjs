# Healthcare Management Platform

A comprehensive, modern healthcare management system built with **Node.js/Express** backend and **NextJS 14** frontend, featuring patient care management, medication tracking, appointment scheduling, and real-time monitoring capabilities.

## ✨ Latest Enhancements

### 🚀 **Complete Architecture Implementation**
- **Full ES Module Migration**: Complete conversion from CommonJS to modern ES modules with `.js` extensions
- **Production-Ready Routes**: 10 organized route files with comprehensive CRUD operations
- **Service Layer Architecture**: Business logic separation with AuthService, PatientService, MedicationService, and SchedulingService
- **Complete Database Schema**: 22 migration files with 13+ Sequelize models and proper associations

### 🏗️ **Modern Development Stack**
- **Node.js 22+ with ES Modules**: Modern async/await patterns and top-level await support
- **PostgreSQL with Prisma ORM**: Production-ready database with connection pooling and optimized queries
- **TypeScript Definitions**: Complete type safety across backend with `/typings` directory
- **Enhanced Security**: Helmet, CORS, rate limiting, JWT authentication, and HIPAA compliance features

### 🔧 **Development Experience**
- **Comprehensive Testing**: Jest with `--detectOpenHandles` and coverage reporting
- **Code Quality**: ESLint configured for modern JavaScript with auto-fix capabilities
- **Database Seeding**: Initial data for specialists, medicines, and vital templates
- **Docker Swarm Ready**: Production deployment with horizontal scaling and zero-downtime updates

## 🏗️ Architecture

This application uses a **modern architecture** combining:

- **Backend**: Node.js 22+ with Express.js, ES Modules, and Sequelize ORM
- **Frontend**: NextJS 14 with TypeScript, TailwindCSS, and App Router (ready for integration)
- **Database**: MySQL 8.0+ with advanced features and Redis caching
- **Deployment**: Docker Swarm with horizontal scaling and production orchestration

```text
healthapp-nextjs/
├── 🔧 Backend (Node.js 22+ + Express + ES Modules)
│   └── src/
│       ├── config/          # Database, JWT, constants, cloud config
│       ├── controllers/     # Route handlers for each domain (8 controllers)
│       ├── middleware/      # Auth, validation, error handling, rate limiting, logging
│       ├── models/          # Sequelize models and associations (13+ models)
│       ├── routes/          # API route definitions (10 route files)
│       ├── services/        # Business logic and data processing (4 services)
│       ├── utils/           # Helper functions, validators, response formatters
│       ├── migrations/      # Database schema migrations (22+ files)
│       ├── seeders/         # Initial data seeding
│       └── server.js        # Modern ES module application entry point
├── 🎨 Frontend (NextJS 14 + TypeScript) - Ready for Integration
│   ├── app/                 # NextJS App Router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Frontend utilities & API client
│   └── types/               # TypeScript definitions
├── 🏗️ Development & Infrastructure
│   ├── docker/              # Docker configurations & Swarm orchestration
│   ├── scripts/             # Deployment and automation scripts
│   ├── typings/             # TypeScript definitions for backend
│   └── docs/                # Comprehensive documentation
└── 🚀 Production Ready Features
    ├── Migration system with versioned schema changes
    ├── Seeded initial data (specialists, medicines, vital templates)
    ├── Complete ES module conversion for modern development
    └── Docker Swarm deployment with scaling capabilities
```

## ✨ Key Features

### Healthcare Management

- **👥 Patient Management**: Complete patient lifecycle with medical records
- **👨‍⚕️ Provider Management**: Doctor profiles, specialties, and credentials
- **💊 Medication Tracking**: Prescription management with adherence monitoring
- **📅 Appointment System**: Scheduling with recurring appointments and reminders  
- **📋 Care Plans**: Templated and customized treatment plans
- **📊 Vital Signs**: Real-time monitoring and trend analysis
- **🔔 Smart Notifications**: Multi-channel reminders and alerts

### Technical Features

- **🔐 Authentication & Authorization**: JWT with role-based access control
- **🚀 Modern Stack**: ES Modules, async/await, TypeScript support
- **📱 Real-time Updates**: Socket.io integration ready
- **☁️ Cloud Storage**: AWS S3 integration for file uploads
- **🔍 Advanced Search**: Full-text search with PostgreSQL
- **📈 Performance**: Redis caching, connection pooling, optimized queries
- **🛡️ Security**: HIPAA compliance, rate limiting, input validation
- **♿ Accessibility**: WCAG 2.1 compliant UI components

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.18.0 LTS or higher
- **MySQL** 8.0+ (primary database)
- **Redis** (optional, for caching and sessions)
- **Docker** (optional, for containerized deployment)

### Installation

#### **Clone and install dependencies:**

```bash
git clone <repository-url>
cd healthapp-nextjs
npm install
```

#### **Environment setup:**

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

#### **Database setup:**

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE healthapp_dev;"

# Run migrations
npm run migrate

# Seed initial data (specialties, medicines, vital templates)
npm run seed
```

#### **Start development server:**

```bash
# Start backend development server with nodemon
npm run dev

# Or start production server
npm start
```

#### **Access the application:**

- **Backend API**: [http://localhost:5000](http://localhost:5000) (development)
- **Frontend**: Ready for integration at [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend API port | `5000` |
| `DB_NAME` | Database name | `healthapp_dev` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | `your-aws-key` |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | `your-aws-secret` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_BUCKET_NAME` | S3 bucket name | `healthapp-files` |

### Database Schema

The application uses a comprehensive MySQL schema with:

- **13+ Core Models**: Users, Patients, Providers, Care Plans, Medications, etc.
- **Advanced Features**: Proper relationships, foreign keys, indexes, and constraints
- **HIPAA Compliance**: Audit logging, soft deletes, encrypted sensitive data
- **Performance**: Optimized indexes, connection pooling, query optimization

See the `/src/migrations/` directory for complete schema definitions with 22+ migration files.

## 📚 API Documentation

### Base URLs

- **Web API**: `/api/*`
- **Mobile API**: `/m-api/*` (optimized responses)

### Response Format

All API responses follow a consistent structure:

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

Include JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### 🔐 Authentication

- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration  
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

#### 👥 Patient Management

- `GET /api/patients/pagination` - Get paginated patient list
- `GET /api/patients/:patientId` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:patientId` - Update patient information
- `DELETE /api/patients/:patientId` - Soft delete patient

#### 💊 Medication Management

- `GET /api/medications/:patientId` - Get patient medications
- `POST /api/medications/treatment/:patientId/:carePlanId` - Add medication
- `GET /api/medications/:medicationId/timeline` - Get adherence timeline
- `PUT /api/medications/:medicationId/adherence` - Record medication taken

#### 📅 Appointments

- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:patientId` - Get patient appointments
- `GET /api/appointments/date?date=YYYY-MM-DD` - Get appointments by date
- `PUT /api/appointments/:appointmentId` - Update appointment

#### 📋 Care Plans

- `GET /api/careplan/patients/:patientId/careplan-details` - Get patient care plan
- `POST /api/careplan/patients/add-careplan-for-patient/:patientId` - Create care plan
- `PUT /api/careplan/:carePlanId` - Update care plan

#### 📊 Vital Signs

- `POST /api/vitals` - Add vital sign reading
- `GET /api/vitals/:patientId` - Get patient vitals
- `GET /api/vitals/:vitalId/timeline` - Get vital trends

## 🛠️ Development

### Available Scripts

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

### Database Development

The application uses Sequelize with MySQL:

```bash
# Generate new migration
npx sequelize-cli migration:generate --name create-new-table

# Generate new seeder
npx sequelize-cli seed:generate --name demo-data

# Check database connection
npm run db:test
```

### Modern ES Module Implementation

The codebase has been **completely converted** from CommonJS to modern ES Modules:

#### **Key Implementation Details:**
- **Full `import/export` Syntax**: No more `require()` or `module.exports`
- **`.js` Extensions Required**: All relative imports must include `.js` extensions for proper module resolution
- **Top-level Await Support**: Ready for Node.js 22+ async patterns
- **Modern Async/Await**: Consistent patterns throughout the application

#### **Migration Benefits:**
- **Better Tree Shaking**: Improved bundle optimization and dead code elimination
- **Static Analysis**: Enhanced IDE support and tooling capabilities  
- **Future-Ready**: Aligned with modern JavaScript and web standards
- **Performance**: Faster module loading and better optimization

#### **Development Guidelines:**
```javascript
// ✅ Correct ES Module patterns
import { User } from '../models/User.js';
import config from '../config/database.js';
export default AuthService;

// ❌ Avoid CommonJS patterns  
const User = require('../models/User');
module.exports = AuthService;
```

### Code Quality

The project enforces modern JavaScript standards:

- **ES Modules**: Complete `import/export` implementation with `.js` extensions
- **ESLint**: Configured for modern JavaScript with ES2022+ features
- **TypeScript Definitions**: Complete type safety with `/typings` directory
- **Jest**: Comprehensive testing with `--detectOpenHandles` for proper cleanup

## 🐳 Docker Swarm Deployment

This application uses **Docker Swarm** for production-ready deployment with horizontal scaling, load balancing, and zero-downtime updates.

### Quick Start

```bash
# 1. Initialize Docker Swarm (one-time setup)
./scripts/docker-swarm-init.sh

# 2. Deploy development environment
./scripts/deploy-stack.sh dev --auto-yes

# 3. Deploy production environment  
./scripts/deploy-stack.sh prod --auto-yes
```

### Scaling Services

```bash
# Scale backend to 10 replicas
docker service scale healthapp_backend=10

# Scale frontend to 5 replicas
docker service scale healthapp_frontend=5

# Scale during deployment
./scripts/deploy-stack.sh dev --scale-backend=8 --scale-frontend=4
```

### Service Management

```bash
# View all services
docker stack services healthapp

# View service logs
docker service logs healthapp_backend -f

# Remove deployment
docker stack rm healthapp
```

📖 **Complete Guide**: See [README-Docker-Swarm.md](./README-Docker-Swarm.md) for comprehensive documentation.

### Production Deployment

```bash
# Production deployment
./scripts/deploy-prod.sh

# Docker Swarm (multi-node)
./scripts/docker-swarm-init.sh
docker stack deploy -c docker/docker-stack.yml healthapp
```

### Services Overview

| Service | Development Port | Production | Description |
|---------|------------------|------------|-------------|
| Backend | 5000 | Internal | Node.js API server with ES Modules |
| Frontend | 3000 | 80/443 | NextJS application (ready for integration) |
| MySQL | 3306 | Internal | Primary database |
| Redis | 6379 | Internal | Cache & sessions |
| NGINX | - | 80/443 | Reverse proxy |
| phpMyAdmin | 8080 | - | Database management (dev only) |

See `docs/docker_deployment_guide.md` for comprehensive deployment instructions.

## 🔒 Security & Compliance

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Rate Limiting**: API abuse protection
- **Input Validation**: Comprehensive request validation with Joi
- **SQL Injection Protection**: Sequelize ORM parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS Configuration**: Configurable cross-origin requests

### HIPAA Compliance

- **Audit Logging**: Complete activity tracking
- **Data Encryption**: Sensitive data encrypted at rest
- **Access Controls**: Role-based data access
- **Secure Communications**: HTTPS/TLS in production
- **Data Backup**: Encrypted backup procedures

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Test specific component/service
npm test -- --testPathPattern=AuthService
```

The testing setup includes:

- **Jest**: Testing framework with Node.js environment
- **Supertest**: API endpoint testing
- **Test Coverage**: Comprehensive coverage reporting
- **Mock Services**: Database and external service mocking

## 📈 Performance & Monitoring

### Performance Features

- **Database Optimization**: Connection pooling, proper indexing
- **Caching Strategy**: Redis integration for high-performance data access
- **Query Optimization**: Efficient Sequelize queries with eager loading
- **Static Asset Optimization**: NextJS automatic optimization
- **Code Splitting**: Dynamic imports for reduced bundle sizes

### Monitoring

- **Winston Logging**: Structured logging with multiple transports
- **Prometheus Metrics**: Application and system metrics
- **Health Checks**: Built-in health monitoring endpoints
- **Error Tracking**: Comprehensive error handling and reporting

## 🔄 Migration Guides

### From Development to Production

See `docs/docker_deployment_guide.md` for production deployment steps.

### Database Migrations

All schema changes are version-controlled through Sequelize migrations:

- **22 Migration Files**: Complete schema evolution
- **Rollback Support**: Safe migration rollback procedures
- **Seeded Data**: Initial specialties, medicines, and vital templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the established ES Module patterns
- Use the service layer for business logic
- Write tests for new features
- Update documentation for API changes
- Run `npm run lint:fix` before committing

## 📝 Documentation

- **📖 [Architecture Overview](docs/architecture.md)** - System design and patterns
- **🐳 [Docker Deployment Guide](docs/docker_deployment_guide.md)** - Complete deployment instructions
- **🗂️ [Project Structure](docs/project_folder_structure.md)** - Detailed folder organization
- **🖥️ [Windows Development Guide](docs/windows_development_guide.md)** - Windows-specific setup
- **🔄 [NextJS Conversion Strategy](docs/nextjs_conversion_strategy.md)** - Frontend modernization
- **🛠️ [Technical Implementation](docs/technical_implementation.md)** - Implementation details

## 📊 Database Schema

The application uses a sophisticated MySQL schema with 22+ migration files:

### Core Tables

- **users** - Authentication and profiles with role-based access
- **doctors** - Healthcare provider profiles and specialties
- **patients** - Patient records and medical history
- **care_plans** - Treatment and care management plans
- **medications** - Prescription tracking and adherence
- **appointments** - Scheduling system with recurring events
- **vitals** - Health monitoring data and readings
- **medicines** - Drug database and templates
- **specialities** - Medical specialties and categories
- **vital_templates** - Standardized vital sign templates

### Advanced Features

- **Proper Relationships** - Foreign keys and associations between all entities
- **Migration System** - Versioned schema changes with 22+ migration files
- **Seeded Data** - Initial specialists, medicines, and vital templates
- **Audit Logging** - HIPAA-compliant activity tracking
- **Soft Deletes** - Data retention and recovery capabilities
- **Connection Pooling** - Optimized database performance

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection Issues:**

```bash
# Check MySQL is running
sudo service mysql status

# Test database connection
npm run db:test
```

**Port Conflicts:**

```bash
# Check what's running on ports
lsof -i :5000  # Backend API
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
```

**Migration Errors:**

```bash
# Reset database (development only)
npm run migrate:undo
npm run migrate
npm run seed
```

### Getting Help

- **Create an issue** in the repository for bugs
- **Check documentation** in the `docs/` folder
- **Review logs** with `docker service logs healthapp_[service] -f`
- **Test environment** with health check endpoints

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 Healthcare Standards

This application is designed with healthcare industry standards in mind:

- **HIPAA Compliance** - Privacy and security requirements
- **HL7 Ready** - Structured for healthcare data exchange
- **Clinical Workflows** - Designed for real-world healthcare processes
- **Audit Requirements** - Complete activity logging and tracking
- **Scalable Architecture** - Supports growing healthcare organizations

---

**Built with ❤️ for healthcare providers and patients**

*Healthcare Management Platform - Production-ready backend with modern ES Modules, MySQL, and comprehensive API*

**Last updated: August 2025** | Node.js 22+ | MySQL 8.0+ | Docker Swarm Ready
