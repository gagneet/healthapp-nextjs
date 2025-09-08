#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * This script connects to PostgreSQL and validates our Prisma schema against actual database tables
 * It also scans the codebase for field usage and generates a comprehensive mapping report
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || '192.168.0.148',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'healthapp_dev',
  user: process.env.POSTGRES_USER || 'healthapp_user',
  password: process.env.POSTGRES_PASSWORD || 'secure_pg_password',
};

async function main() {
  console.log('🔍 Starting Database Schema Validation...\n');
  
  // Step 1: Get actual database schema
  const dbSchema = await getDatabaseSchema();
  
  // Step 2: Parse Prisma schema
  const prismaSchema = await parsePrismaSchema();
  
  // Step 3: Scan codebase for field usage
  const codeUsage = await scanCodebaseFieldUsage();
  
  // Step 4: Generate validation report
  await generateValidationReport(dbSchema, prismaSchema, codeUsage);
  
  console.log('\n✅ Schema validation completed! Check schema-validation-report.json');
}

async function getDatabaseSchema() {
  console.log('📊 Fetching actual database schema...');
  
  const client = new Client(dbConfig);
  await client.connect();
  
  try {
    // Get all tables and their columns
    const tablesQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN information_schema.constraint_column_usage ccu ON c.column_name = ccu.column_name AND c.table_name = ccu.table_name
      LEFT JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name IS NOT NULL
      ORDER BY t.table_name, c.ordinal_position;
    `;
    
    const result = await client.query(tablesQuery);
    
    // Group by table
    const schema = {};
    result.rows.forEach(row => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }
      schema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
        constraint: row.constraint_type
      });
    });
    
    // Get foreign key relationships
    const fkQuery = `
      SELECT DISTINCT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `;
    
    const fkResult = await client.query(fkQuery);
    const foreignKeys = {};
    fkResult.rows.forEach(row => {
      if (!foreignKeys[row.table_name]) foreignKeys[row.table_name] = [];
      foreignKeys[row.table_name].push({
        column: row.column_name,
        referencedTable: row.referenced_table,
        referencedColumn: row.referenced_column
      });
    });
    
    console.log(`   Found ${Object.keys(schema).length} tables`);
    return { tables: schema, foreignKeys };
    
  } finally {
    await client.end();
  }
}

async function parsePrismaSchema() {
  console.log('🔧 Parsing Prisma schema...');
  
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  const models = {};
  const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // Extract fields
    const fieldRegex = /^\s*(\w+)\s+([^\s@]+)(?:\s+@[^\n]*)?$/gm;
    const fields = [];
    
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      
      // Skip computed fields and relations without @relation
      if (fieldName === '@@map' || fieldName === '@@index' || fieldName === '@@unique') continue;
      
      fields.push({
        name: fieldName,
        type: fieldType,
        line: fieldMatch.index
      });
    }
    
    models[modelName] = fields;
  }
  
  console.log(`   Found ${Object.keys(models).length} Prisma models`);
  return models;
}

async function scanCodebaseFieldUsage() {
  console.log('🔍 Scanning codebase for field usage...');
  
  const usage = {};
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const directories = ['app', 'lib', 'components', 'src'];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Find Prisma queries and field accesses
      const patterns = [
        /prisma\.(\w+)\.findMany\(/g,
        /prisma\.(\w+)\.findUnique\(/g,
        /prisma\.(\w+)\.create\(/g,
        /prisma\.(\w+)\.update\(/g,
        /\.(\w+)\s*:/g, // Object property access
        /\.(\w+)\s*\?/g, // Optional chaining
        /select:\s*{([^}]+)}/g, // Prisma select clauses
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const field = match[1];
          if (!usage[field]) usage[field] = [];
          usage[field].push(filePath);
        }
      });
      
    } catch (error) {
      // Ignore read errors
    }
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        scanFile(fullPath);
      }
    });
  }
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    scanDirectory(fullPath);
  });
  
  console.log(`   Found field usage in ${Object.keys(usage).length} unique fields`);
  return usage;
}

async function generateValidationReport(dbSchema, prismaSchema, codeUsage) {
  console.log('📋 Generating validation report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    issues: [],
    recommendations: []
  };
  
  // Compare database tables with Prisma models
  const dbTables = Object.keys(dbSchema.tables);
  const prismaModels = Object.keys(prismaSchema);
  
  report.summary = {
    databaseTables: dbTables.length,
    prismaModels: prismaModels.length,
    totalIssues: 0
  };
  
  // Check for missing models
  dbTables.forEach(tableName => {
    const modelName = toPascalCase(tableName);
    if (!prismaSchema[modelName]) {
      report.issues.push({
        type: 'missing_model',
        severity: 'warning',
        table: tableName,
        message: `Database table '${tableName}' has no corresponding Prisma model '${modelName}'`
      });
    }
  });
  
  // Check for field mismatches
  Object.keys(prismaSchema).forEach(modelName => {
    const tableName = toSnakeCase(modelName);
    const dbTable = dbSchema.tables[tableName];
    
    if (!dbTable) {
      report.issues.push({
        type: 'missing_table',
        severity: 'error',
        model: modelName,
        message: `Prisma model '${modelName}' has no corresponding database table '${tableName}'`
      });
      return;
    }
    
    const dbColumns = dbTable.map(col => col.column);
    const prismaFields = prismaSchema[modelName].map(field => field.name);
    
    // Check for missing fields
    prismaFields.forEach(fieldName => {
      const dbColumnName = toSnakeCase(fieldName);
      if (!dbColumns.includes(dbColumnName) && !fieldName.includes('[]') && !isRelationField(fieldName)) {
        report.issues.push({
          type: 'missing_column',
          severity: 'error',
          model: modelName,
          field: fieldName,
          expectedColumn: dbColumnName,
          message: `Prisma field '${modelName}.${fieldName}' has no corresponding database column '${tableName}.${dbColumnName}'`,
          usedInCode: codeUsage[fieldName] ? codeUsage[fieldName].length > 0 : false
        });
      }
    });
    
    // Check for missing Prisma fields
    dbColumns.forEach(columnName => {
      const fieldName = toCamelCase(columnName);
      if (!prismaFields.includes(fieldName) && !isSystemColumn(columnName)) {
        report.issues.push({
          type: 'missing_field',
          severity: 'warning',
          table: tableName,
          column: columnName,
          expectedField: fieldName,
          message: `Database column '${tableName}.${columnName}' has no corresponding Prisma field '${modelName}.${fieldName}'`
        });
      }
    });
  });
  
  // Generate recommendations
  const errorCount = report.issues.filter(i => i.severity === 'error').length;
  const warningCount = report.issues.filter(i => i.severity === 'warning').length;
  
  report.summary.totalIssues = errorCount + warningCount;
  report.summary.errors = errorCount;
  report.summary.warnings = warningCount;
  
  if (errorCount > 0) {
    report.recommendations.push('❌ Fix all ERROR level issues before attempting to build the application');
  }
  
  if (warningCount > 0) {
    report.recommendations.push('⚠️  Review WARNING level issues - they may indicate unused database columns or missing Prisma fields');
  }
  
  // Most common issues
  const issueTypes = {};
  report.issues.forEach(issue => {
    issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
  });
  
  report.recommendations.push(`📊 Most common issues: ${Object.entries(issueTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
  
  // Save report
  const reportPath = path.join(__dirname, '../schema-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📋 VALIDATION SUMMARY:');
  console.log(`   Database Tables: ${report.summary.databaseTables}`);
  console.log(`   Prisma Models: ${report.summary.prismaModels}`);
  console.log(`   Total Issues: ${report.summary.totalIssues}`);
  console.log(`   - Errors: ${report.summary.errors}`);
  console.log(`   - Warnings: ${report.summary.warnings}`);
  
  if (report.summary.errors > 0) {
    console.log('\n❌ CRITICAL ERRORS that will prevent compilation:');
    report.issues.filter(i => i.severity === 'error').slice(0, 10).forEach(issue => {
      console.log(`   • ${issue.message}`);
    });
  }
  
  return report;
}

// Utility functions
function toPascalCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function toCamelCase(str) {
  const parts = str.split('_');
  return parts[0] + parts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function isRelationField(fieldName) {
  // Heuristic to detect Prisma relation fields
  return fieldName.endsWith('[]') || fieldName.includes('_id') || fieldName.charAt(0).toUpperCase() === fieldName.charAt(0);
}

function isSystemColumn(columnName) {
  const systemColumns = ['createdAt', 'updatedAt', 'deleted_at'];
  return systemColumns.includes(columnName);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Schema validation failed:', error);
    process.exit(1);
  });
}