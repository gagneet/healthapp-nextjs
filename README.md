# AdhereLive Healthcare Management Platform - Backend

A robust Node.js/Express backend for the AdhereLive Healthcare Management Platform, providing comprehensive API endpoints for patient care management, medication tracking, appointments, and vital signs monitoring.

## 🏗️ Architecture

This backend follows a clean, modular architecture with proper separation of concerns:

```text
src/
├── config/         # Database, JWT, and other configurations
├── controllers/    # Route handlers and business logic
├── middleware/     # Auth, validation, error handling, rate limiting
├── models/         # Sequelize models and associations
├── routes/         # API route definitions
├── services/       # Business logic and data processing
├── utils/          # Helper functions and utilities
├── migrations/     # Database migrations
├── seeders/        # Database seed data
└── server.js       # Application entry point
```

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Management**: Complete CRUD operations for patient records
- **Doctor Management**: Doctor profiles, specializations, and patient assignments
- **Medication Management**: Prescription tracking with adherence monitoring
- **Appointment System**: Scheduling with recurring appointment support
- **Care Plans**: Comprehensive treatment plan management
- **Vital Signs**: Monitoring and tracking of patient vitals
- **Real-time Scheduling**: Event-based system for reminders and notifications
- **Search & Filtering**: Advanced search capabilities across entities
- **Admin Panel**: Administrative functions and system monitoring
- **API Documentation**: RESTful API following healthcare standards

## 🛠️ Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens
- **Validation**: Joi validation library
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston logger
- **File Upload**: AWS S3 integration
- **Real-time**: Socket.io ready
- **Testing**: Jest testing framework

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager
- Git

## 🏃‍♂️ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd adhere-live-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE adhere;
EXIT;

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_NAME` | Database name | `adhere` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | - |
| `DB_HOST` | Database host | `localhost` |
| `JWT_SECRET` | JWT signing secret | - |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

### Database Configuration

The application uses MySQL with Sequelize ORM. Configure your database connection in `.env`:

```env
DB_NAME=adhere
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

## 📚 API Documentation

### Base URLs

- Web API: `/api`
- Mobile API: `/m-api`

### Response Format

All API responses follow this consistent format:

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

### Main Endpoints

#### Authentication URL's

- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/refresh-token` - Refresh access token

#### Patients

- `GET /api/patients/pagination` - Get paginated patient list
- `GET /api/patients/:patientId` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:patientId` - Update patient
- `DELETE /api/patients/:patientId` - Delete patient

#### Medications

- `GET /api/medications/:patientId` - Get patient medications
- `POST /api/medications/treatment/:patientId/:carePlanId` - Add medication
- `GET /api/medications/:medicationId/timeline` - Get medication timeline

#### Appointments

- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:patientId` - Get patient appointments
- `GET /api/appointments/date?date=YYYY-MM-DD` - Get appointments by date

#### Care Plans

- `GET /api/careplan/patients/:patientId/careplan-details` - Get patient care plan
- `POST /api/careplan/patients/add-careplan-for-patient/:patientId` - Create care plan

#### Vitals

- `POST /api/vitals` - Add vital monitoring
- `GET /api/vitals/:patientId` - Get patient vitals
- `GET /api/vitals/:vitalId/timeline` - Get vital timeline

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for doctors, patients, admins
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers protection
- **SQL Injection Protection**: Sequelize ORM parameterized queries

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📈 Performance & Scaling

- **Database Indexing**: Optimized database queries with proper indexes
- **Connection Pooling**: Configured database connection pooling
- **Caching Strategy**: Redis integration ready for caching
- **Logging**: Structured logging with Winston
- **Error Handling**: Comprehensive error handling and monitoring

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**

```bash
NODE_ENV=production
# Set production database credentials
# Configure proper JWT secrets
```

2. **Database Migration**

```bash
npm run migrate
   ```

3. **Start Production Server**

```bash
npm start
```

### Docker Deployment (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting guide

## 🔄 Changelog

### Version 1.0.0

- Initial release
- Complete API implementation
- Authentication and authorization
- Patient and doctor management
- Medication tracking
- Appointment scheduling
- Care plan management
- Vital signs monitoring

## Benefits of This Approach

### ✅ BETTER NORMALIZATION

- Common fields (name, address, contact) centralized in User
- Role-specific fields properly separated
- Eliminates data duplication
- Easier to maintain and update

### ✅ IMPROVED PERFORMANCE

- Single source of truth for common data
- Better query optimization
- Reduced storage overhead
- Consistent indexing strategy

### ✅ ENHANCED FLEXIBILITY

- Users can have multiple roles (doctor + admin)
- Easier role transitions
- Common authentication logic
- Shared user management

### ✅ BETTER DATA INTEGRITY

- Foreign key constraints properly enforced
- Consistent validation rules
- Centralized user status management
- Easier audit trails

### ✅ SIMPLIFIED QUERIES

```javascript
// Get user with role-specific data
const userWithRoles = await User.findByPk(userId, {
  include: [
    { model: Doctor, as: 'doctor' },
    { model: Patient, as: 'patient' }
  ]
});

// Access common fields directly
console.log(userWithRoles.full_name);
console.log(userWithRoles.current_age);
console.log(userWithRoles.formatted_address);

// Access role-specific fields
if (userWithRoles.doctor) {
  console.log(userWithRoles.doctor.speciality_id);
  console.log(userWithRoles.doctor.consultation_fee);
}

if (userWithRoles.patient) {
  console.log(userWithRoles.patient.allergies);
  console.log(userWithRoles.patient.bmi);
}
```

## 📦 Package Versions & CommonJS Choice

### **My Rationale (Conservative Approach):**

- **Healthcare Stability**: I opted for proven, LTS versions since healthcare systems prioritize reliability over bleeding-edge features
- **Enterprise Compatibility**: Many healthcare organizations run conservative Node.js environments
- **Sequelize Ecosystem**: The versions I chose have well-tested interactions
- **Team Accessibility**: CommonJS is more familiar to mixed-experience teams

### 🏗️ Data Modeling - Duplicate Fields Issue

## 🎯 Summary: Why I Made Those Choices & Better Alternatives

A better normalized approach:

### **Package Versions & CommonJS - My Original Rationale:**

1. **Healthcare Conservatism**: Healthcare systems often prioritize stability over cutting-edge features
2. **Team Compatibility**: Mixed-experience teams are more comfortable with CommonJS
3. **Ecosystem Maturity**: Older versions have well-documented interactions and fewer breaking changes
4. **Enterprise Environment**: Many healthcare organizations run conservative Node.js setups

### **Data Modeling - My Original Rationale:**

1. **Schema Compatibility**: I was trying to match your existing MySQL schema exactly
2. **Role Separation**: Healthcare often requires strict separation between personal and professional data
3. **Audit Requirements**: HIPAA might require separate audit trails for different data types
4. **Legacy System Integration**: Existing systems might expect this structure

## ✅ **But You're Absolutely Right - Here's the Better Approach:**

### **Modern Stack Benefits:**

- **ES Modules**: Better tree-shaking, cleaner imports, future-ready
- **Latest Packages**: Security patches, performance improvements, new features
- **Modern Async/Await**: Cleaner error handling, better readability
- **Type Safety Ready**: Easier migration to TypeScript later

### **Normalized Data Model Benefits:**

- **DRY Principle**: No duplicate fields between Doctor/Patient
- **Single Source of Truth**: Common fields in User table
- **Better Performance**: Fewer JOINs, better indexing
- **Easier Maintenance**: Update address logic once, affects all roles
- **Role Flexibility**: Users can have multiple roles (doctor + admin)

## 🚀 **Recommendation for Your Implementation:**

**Go with the modern approach!** here's why:

1. **Future-Proof**: ES modules and latest packages keep you current
2. **Better Developer Experience**: Modern syntax, better tooling support
3. **Performance**: Latest versions have significant performance improvements
4. **Security**: Latest packages include important security fixes
5. **Maintainability**: Normalized schema is much easier to maintain

The conservative approach was my attempt to be "safe" for healthcare, but in reality, using modern, well-maintained packages with proper testing is actually *safer* for healthcare applications.

**Would you like me to provide the complete modern implementation** with:

- ✅ Latest package versions
- ✅ Full ES module conversion  
- ✅ Normalized User/Doctor/Patient schema
- ✅ Modern async/await patterns
- ✅ Better error handling
- ✅ TypeScript-ready structure

This would give you a much cleaner, more maintainable codebase that follows current best practices!
