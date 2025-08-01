# MySQL to PostgreSQL Migration Plan

## Overview

This document outlines the comprehensive migration strategy from MySQL to PostgreSQL for the healthcare adherence management platform. The migration includes schema conversion, data migration, application updates, and testing procedures.

## Migration Objectives

- Convert from MySQL to PostgreSQL for better JSON support, UUIDs, and advanced features
- Implement proper HIPAA compliance with audit logging
- Separate Doctor and HSP entities with role-based capabilities
- Support multi-tenant architecture with organizations
- Maintain data integrity throughout the migration process

## Pre-Migration Assessment

### Current MySQL Schema Analysis

```sql
-- Current MySQL tables (approximate structure)
- users (INT primary keys)
- doctors (references users)
- patients (references users)
- providers (legacy table)
- appointments
- care_plans
- medications
- vitals
- specialities
- user_roles
```

### PostgreSQL Target Schema

```sql
-- New PostgreSQL tables with UUIDs
- users (UUID primary keys, HIPAA fields)
- organizations (multi-tenant support)
- doctors (enhanced with capabilities)
- hsps (new Healthcare Support Personnel)
- patients (enhanced with JSONB fields)
- treatment_plans (new, separate from care_plans)
- care_plans (enhanced for chronic conditions)
- prescriptions (new, formal prescription management)
- notifications (new notification system)
- adherence_logs (new adherence tracking)
- lab_results (new diagnostic results)
- medical_devices (new device integration)
- audit_logs (HIPAA compliance)
```

## Migration Phases

### Phase 1: Environment Setup and Preparation

Timeline: 1-2 weeks

#### 1.1 PostgreSQL Environment Setup

```bash
# Install PostgreSQL 15+
sudo apt-get install postgresql-15 postgresql-contrib-15

# Create database and user
sudo -u postgres createdb healthapp_production
sudo -u postgres createuser healthapp_user

# Configure PostgreSQL
# Edit postgresql.conf and pg_hba.conf for security
```

#### 1.2 Install Migration Tools

```bash
# Install pgloader for data migration
sudo apt-get install pgloader

# Install pg_dump and pg_restore
sudo apt-get install postgresql-client-15
```

#### 1.3 Backup Current MySQL Database

```bash
# Full MySQL backup
mysqldump -u root -p --single-transaction --routines --triggers healthapp_mysql > mysql_backup.sql

# Individual table backups for safety
mysqldump -u root -p healthapp_mysql users > users_backup.sql
mysqldump -u root -p healthapp_mysql patients > patients_backup.sql
# ... repeat for all tables
```

### Phase 2: Schema Migration

Timeline: 2-3 weeks

#### 2.1 Create PostgreSQL Schema

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create ENUMs
CREATE TYPE user_role AS ENUM ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP', 'PATIENT', 'CAREGIVER');
CREATE TYPE account_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
-- ... create all ENUMs from enums.js
```

#### 2.2 Schema Mapping Strategy

| MySQL Table | PostgreSQL Equivalent | Changes |
|-------------|----------------------|---------|
| users | users | INT → UUID, add HIPAA fields |
| doctors | doctors | Enhanced model, UUID references |
| patients | patients | JSONB fields, UUID references |
| providers | doctors + hsps | Split into two tables |
| appointments | appointments | Enhanced with UUIDs |
| care_plans | care_plans + treatment_plans | Split by purpose |
| medications | medications + prescriptions | Enhanced prescription management |
| vitals | vitals | Enhanced with JSONB |

#### 2.3 Data Type Conversions

```sql
-- MySQL to PostgreSQL type mapping
INT AUTO_INCREMENT → UUID DEFAULT uuid_generate_v4()
VARCHAR(255) → VARCHAR(255) or TEXT
TEXT → TEXT
JSON → JSONB
DATETIME → TIMESTAMP WITH TIME ZONE
TINYINT(1) → BOOLEAN
DECIMAL → NUMERIC
```

### Phase 3: Data Mapping and Transformation

Timeline: 2-3 weeks

#### 3.1 UUID Generation Strategy

```javascript
// Create UUID mapping for existing integer IDs
const uuidMap = new Map();

// Generate UUIDs for all existing records
async function generateUUIDs() {
  const users = await mysql.query('SELECT id FROM users');
  users.forEach(user => {
    uuidMap.set(`users_${user.id}`, uuidv4());
  });
  
  // Repeat for all tables
}
```

#### 3.2 Data Transformation Scripts

```javascript
// Transform users table
async function transformUsers() {
  const mysqlUsers = await mysql.query(`
    SELECT * FROM users
  `);
  
  const pgUsers = mysqlUsers.map(user => ({
    id: uuidMap.get(`users_${user.id}`),
    email: user.email,
    password_hash: user.password,
    role: mapRole(user.role_id), // Convert role_id to enum
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    date_of_birth: user.date_of_birth,
    // Add new HIPAA fields
    email_verified: user.email_verified || false,
    hipaa_consent_date: null, // Will need to be collected
    terms_accepted_at: user.created_at,
    privacy_policy_accepted_at: user.created_at,
    created_at: user.created_at,
    updated_at: user.updated_at
  }));
  
  return pgUsers;
}
```

#### 3.3 Provider Separation Logic

```javascript
// Separate providers into doctors and HSPs
async function separateProviders() {
  const providers = await mysql.query(`
    SELECT p.*, u.*, s.name as specialty_name 
    FROM providers p 
    JOIN users u ON p.user_id = u.id 
    LEFT JOIN specialities s ON p.speciality_id = s.id
  `);
  
  const doctors = [];
  const hsps = [];
  
  providers.forEach(provider => {
    if (isDoctorRole(provider)) {
      doctors.push(transformToDoctor(provider));
    } else {
      hsps.push(transformToHSP(provider));
    }
  });
  
  return { doctors, hsps };
}

function isDoctorRole(provider) {
  // Logic to determine if provider is a doctor vs HSP
  // Based on license type, credentials, etc.
  return provider.license_type === 'MD' || 
         provider.license_type === 'DO' ||
         provider.credentials?.includes('MD');
}
```

### Phase 4: Application Code Migration

Timeline: 3-4 weeks

#### 4.1 Database Configuration Update

```javascript
// Update database.js to use PostgreSQL
const config = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'healthapp_dev',
    username: process.env.DB_USER || 'healthapp_user',
    password: process.env.DB_PASS,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

#### 4.2 Model Updates

- Update all models to use PostgreSQL-specific features
- Implement UUID primary keys
- Add JSONB field handling
- Update associations for new schema

#### 4.3 Query Updates

```javascript
// Update queries for PostgreSQL syntax
// MySQL: JSON_EXTRACT(column, '$.field')
// PostgreSQL: column->>'field' or column->'field'

// MySQL
const users = await User.findAll({
  where: sequelize.literal("JSON_EXTRACT(preferences, '$.notifications') = true")
});

// PostgreSQL
const users = await User.findAll({
  where: sequelize.literal("preferences->>'notifications' = 'true'")
});
```

### Phase 5: Migration Execution

Timeline: 1-2 weeks

#### 5.1 Migration Script

```bash
#!/bin/bash
# migration.sh - Complete migration script

echo "Starting MySQL to PostgreSQL migration..."

# Step 1: Create PostgreSQL schema
psql -h localhost -U healthapp_user -d healthapp_production -f schema.sql

# Step 2: Run data transformation
node scripts/migrate-data.js

# Step 3: Verify data integrity
node scripts/verify-migration.js

# Step 4: Create indexes
psql -h localhost -U healthapp_user -d healthapp_production -f indexes.sql

# Step 5: Update sequences (if any)
psql -h localhost -U healthapp_user -d healthapp_production -f update_sequences.sql

echo "Migration completed!"
```

#### 5.2 Data Verification Checklist

```javascript
// verification script
async function verifyMigration() {
  const checks = [
    {
      name: 'User count verification',
      mysql: await mysql.query('SELECT COUNT(*) as count FROM users'),
      postgres: await postgres.query('SELECT COUNT(*) as count FROM users')
    },
    {
      name: 'Patient count verification',
      mysql: await mysql.query('SELECT COUNT(*) as count FROM patients'),
      postgres: await postgres.query('SELECT COUNT(*) as count FROM patients')
    },
    // Add checks for all tables
  ];
  
  checks.forEach(check => {
    if (check.mysql[0].count !== check.postgres[0].count) {
      console.error(`❌ ${check.name} failed: MySQL=${check.mysql[0].count}, PostgreSQL=${check.postgres[0].count}`);
    } else {
      console.log(`✅ ${check.name} passed`);
    }
  });
}
```

### Phase 6: Testing and Validation

Timeline: 2-3 weeks

#### 6.1 Unit Testing

```javascript
// Update all unit tests for PostgreSQL
describe('User Model', () => {
  it('should create user with UUID', async () => {
    const user = await User.create({
      email: 'test@example.com',
      role: 'PATIENT'
    });
    
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
```

#### 6.2 Integration Testing

- Test all API endpoints with PostgreSQL
- Verify HIPAA audit logging works
- Test provider capability restrictions
- Validate multi-tenant data isolation

#### 6.3 Performance Testing

- Compare query performance MySQL vs PostgreSQL
- Test JSONB query performance
- Validate index effectiveness

### Phase 7: Deployment and Cutover

Timeline: 1 week**

#### 7.1 Pre-Deployment

- Final production data migration
- DNS and load balancer updates
- SSL certificate updates
- Monitoring setup

#### 7.2 Deployment Strategy

```bash
# Blue-Green Deployment
# 1. Deploy new PostgreSQL-based application to "green" environment
# 2. Run final data sync
# 3. Switch traffic from "blue" to "green"
# 4. Monitor for issues
# 5. Keep "blue" environment as fallback for 72 hours
```

#### 7.3 Rollback Plan

- Keep MySQL database for 30 days
- Prepared rollback scripts
- Quick DNS switch capability
- Data sync from PostgreSQL back to MySQL if needed

## Migration Timeline Summary

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| 1. Setup | 1-2 weeks | Environment, tools, backups |
| 2. Schema | 2-3 weeks | PostgreSQL schema creation |
| 3. Data Mapping | 2-3 weeks | Transformation scripts |
| 4. Code Migration | 3-4 weeks | Application updates |
| 5. Execution | 1-2 weeks | Run migration |
| 6. Testing | 2-3 weeks | Comprehensive testing |
| 7. Deployment | 1 week | Production cutover |
| **Total** | **12-18 weeks | **Complete migration** |

## Risk Mitigation

### High-Risk Areas

1. **Data Loss**: Multiple backups, verification scripts
2. **Downtime**: Blue-green deployment, quick rollback
3. **Performance**: Extensive testing, query optimization
4. **Security**: HIPAA compliance validation
5. **Integration**: Third-party service compatibility

### Contingency Plans

- Automated rollback procedures
- 24/7 monitoring during cutover
- Database replication for zero-downtime
- Staged migration (table by table if needed)

## Post-Migration Activities

### Immediate (Week 1)

- Monitor system performance
- Validate all functionality
- Address any critical issues
- User acceptance testing

### Short-term (Month 1)

- Performance optimization
- Index tuning
- Query optimization
- User feedback integration

### Long-term (Months 2-3)

- PostgreSQL-specific feature adoption
- Advanced JSONB queries
- Partitioning for large tables
- Archive strategy for HIPAA compliance

## Success Criteria

- ✅ Zero data loss
- ✅ < 4 hours total downtime
- ✅ All tests passing
- ✅ Performance equal or better than MySQL
- ✅ HIPAA compliance maintained
- ✅ All integrations working
- ✅ User acceptance > 95%

## Migration Team Roles

- **Project Manager**: Overall coordination
- **Database Administrator**: PostgreSQL setup and optimization
- **Backend Developer**: Application code migration
- **DevOps Engineer**: Infrastructure and deployment
- **QA Engineer**: Testing and validation
- **Security Engineer**: HIPAA compliance validation

This migration plan provides a comprehensive roadmap for safely migrating from MySQL to PostgreSQL while maintaining system integrity and compliance requirements.
