# Healthcare Management Platform

A comprehensive, modern healthcare management system built with **NextJS 14** frontend and **Node.js/Express** backend, featuring patient care management, medication tracking, appointment scheduling, and real-time monitoring capabilities.

Key Updates Made:

## ✅ Architecture & Technology Stack

- Updated to reflect the hybrid NextJS 14 + Node.js/Express architecture
- Highlighted modern ES Modules, PostgreSQL, and TypeScript implementation
- Added comprehensive project structure diagram

## ✅ Clear Installation Instructions

- Step-by-step setup process with PostgreSQL database creation
- Environment configuration with complete variable reference table
- Proper migration and seeding workflow

## ✅ Complete API Documentation

- All major API endpoints with proper HTTP methods
- Consistent response format documentation
- Authentication and authorization details

## ✅ Development Workflow

- All available npm scripts clearly explained
- Database development with Sequelize commands
- Code quality standards and modern JavaScript practices

## ✅ Docker Deployment

- Both development and production deployment instructions
- Service overview with port mappings
- References to comprehensive deployment guide

## ✅ Security & Compliance Features

- HIPAA compliance details
- Security features and best practices
- Healthcare industry standards

## ✅ Performance & Monitoring

- Database optimization features
- Caching strategies with Redis
- Monitoring and logging capabilities

## ✅ Comprehensive Documentation Links

- References to all existing documentation files
- Troubleshooting guide with common issues
- Migration and deployment guides

The updated documentation now properly reflects your sophisticated healthcare management platform with:

- Clear architecture overview
- Step-by-step setup instructions
- Complete API documentation
- Modern development practices
- Production deployment guidance

- 22 migration files for complete database schema
- 13+ Sequelize models with associations
- Modern ES Module implementation
- PostgreSQL with advanced features (UUIDs, JSONB, full-text search)
- Complete healthcare management functionality
- Docker deployment with production-ready configuration
- HIPAA compliance and security features

The documentation is now production-ready and provides clear guidance for developers, operators, and healthcare organizations implementing this system.

Having well-organized documentation like this will make it much easier for new developers to onboard, for operations teams to deploy, and for healthcare organizations to understand the platform's capabilities.

## 🏗️ Architecture

This application uses a **hybrid architecture** combining:

- **Frontend**: NextJS 14 with TypeScript, TailwindCSS, and App Router
- **Backend**: Node.js/Express with ES Modules and Sequelize ORM
- **Database**: PostgreSQL with advanced features and Redis caching
- **Deployment**: Docker containers with production-ready orchestration

```text
healthapp-nextjs/
├── 🎨 Frontend (NextJS 14 + TypeScript)
│   ├── app/                 # NextJS App Router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Frontend utilities & API client
│   └── types/               # TypeScript definitions
├── 🔧 Backend (Node.js + Express + Sequelize)
│   └── src/
│       ├── config/          # Database, JWT, constants
│       ├── controllers/     # Route handlers (8 controllers)
│       ├── middleware/      # Auth, validation, rate limiting
│       ├── models/          # Sequelize models (13+ models)
│       ├── routes/          # API endpoints (10 route files)
│       ├── services/        # Business logic layer (4 services)
│       ├── utils/           # Helper functions & validators
│       ├── migrations/      # Database migrations (22 files)
│       └── seeders/         # Initial data population
├── 🚀 Deployment & Infrastructure
│   ├── docker/              # Docker configurations
│   ├── scripts/             # Deployment scripts
│   ├── nginx/               # Reverse proxy config
│   └── monitoring/          # Prometheus configuration
└── 📚 docs/                 # Comprehensive documentation
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

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14+ (recommended) or MySQL 8.0+
- **Redis** (optional, for caching)
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
# Create PostgreSQL database
createdb healthapp_db

# Run migrations
npm run migrate

# Seed initial data (specialties, medicines, vital templates)
npm run seed
```

#### **Start development servers:**

```bash
# Start backend API server (port 3001)
npm run backend:dev

# In another terminal, start frontend (port 3000)
npm run dev
```

#### **Access the application:**

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Documentation**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (if configured)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Frontend port | `3000` |
| `BACKEND_PORT` | Backend API port | `3001` |
| `DB_NAME` | Database name | `healthapp_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | `your-aws-key` |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | `your-aws-secret` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_BUCKET_NAME` | S3 bucket name | `healthapp-files` |

### Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **13+ Core Models**: Users, Patients, Providers, Care Plans, Medications, etc.
- **Advanced Features**: UUIDs, JSONB columns, full-text search, triggers
- **HIPAA Compliance**: Audit logging, soft deletes, encrypted sensitive data
- **Performance**: Optimized indexes, connection pooling, query optimization

See `docs/healthapp_schema.sql` for the complete schema definition.

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
# Frontend Development
npm run dev              # Start NextJS development server
npm run build           # Build production frontend
npm run start           # Start production frontend
npm run lint            # Run ESLint on frontend
npm run type-check      # TypeScript type checking

# Backend Development  
npm run backend:dev     # Start backend with nodemon
npm run backend:start   # Start production backend
npm run lint:backend    # Run ESLint on backend
npm run lint:fix        # Auto-fix ESLint issues

# Database Management
npm run migrate         # Run all pending migrations
npm run migrate:undo    # Undo last migration
npm run seed            # Run all seeders
npm run seed:undo       # Undo all seeders
npm run db:setup        # Run migrations + seeders

# Testing
npm test                # Run Jest test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### Database Development

The application uses Sequelize with PostgreSQL:

```bash
# Generate new migration
npx sequelize-cli migration:generate --name create-new-table

# Generate new seeder
npx sequelize-cli seed:generate --name demo-data

# Check database connection
npm run db:test
```

### Code Quality

The project enforces modern JavaScript standards:

- **ES Modules**: Full `import/export` syntax with `.js` extensions
- **ESLint**: Configured for modern JavaScript and React
- **TypeScript**: Type safety across frontend and backend
- **Jest**: Comprehensive testing with coverage reporting

## 🐳 Docker Deployment

### Development with Docker

```bash
# Using deployment script (Linux/macOS)
chmod +x scripts/*.sh
./scripts/deploy-dev.sh

# Using Docker Compose directly
docker-compose -f docker/docker-compose.dev.yml up -d
```

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
| Frontend | 3000 | 80/443 | NextJS application |
| Backend | 3001 | Internal | Node.js API server |
| PostgreSQL | 5432 | Internal | Primary database |
| Redis | 6379 | Internal | Cache & sessions |
| NGINX | - | 80/443 | Reverse proxy |
| pgAdmin | 5050 | - | Database management (dev only) |

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

The application uses a sophisticated PostgreSQL schema with:

### Core Tables

- **users** - Authentication and profiles
- **healthcare_providers** - Doctor/provider profiles  
- **patients** - Patient records and medical history
- **care_plans** - Treatment and care management
- **medications** - Prescription tracking
- **appointments** - Scheduling system
- **vital_readings** - Health monitoring data
- **notifications** - Multi-channel messaging

### Advanced Features

- **UUID Primary Keys** - Scalable, secure identifiers
- **JSONB Columns** - Flexible, queryable JSON storage
- **Full-text Search** - PostgreSQL's advanced search capabilities
- **Audit Logging** - HIPAA-compliant activity tracking
- **Soft Deletes** - Data retention and recovery
- **Triggers & Functions** - Automated timestamp updates

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection Issues:**

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test database connection
npm run db:test
```

**Port Conflicts:**

```bash
# Check what's running on ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL
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
- **Review logs** with `docker-compose logs [service]`
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

## **Built with ❤️ for healthcare providers and patients**

## *Last updated: January 2025*
