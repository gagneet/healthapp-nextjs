#!/usr/bin/env node

/**
 * Prisma Field Analysis Script
 * Analyzes Prisma schema and finds field usage mismatches in TypeScript code
 * This helps identify field naming issues without needing database connection
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 Starting Prisma Field Analysis...\n');
  
  // Step 1: Parse Prisma schema
  const prismaSchema = await parsePrismaSchema();
  
  // Step 2: Scan TypeScript files for field references
  const fieldUsage = await scanTypeScriptFieldUsage();
  
  // Step 3: Find mismatches and generate report
  await generateFieldReport(prismaSchema, fieldUsage);
  
  console.log('\n✅ Field analysis completed! Check field-analysis-report.json');
}

async function parsePrismaSchema() {
  console.log('🔧 Parsing Prisma schema...');
  
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  const models = {};
  const modelRegex = /model\s+(\w+)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // Extract fields (excluding relations)
    const fieldLines = modelBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('@@') && !line.startsWith('//'));
    
    const fields = [];
    const relations = [];
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/^(\w+)\s+([^\s@]+)(?:\s+(.*))?$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const attributes = fieldMatch[3] || '';
        
        if (attributes.includes('@relation') || fieldType.endsWith('[]') || !fieldType.includes('?') && isPascalCase(fieldType)) {
          relations.push({
            name: fieldName,
            type: fieldType,
            attributes
          });
        } else {
          fields.push({
            name: fieldName,
            type: fieldType,
            attributes
          });
        }
      }
    });
    
    models[modelName] = { fields, relations };
  }
  
  console.log(`   Found ${Object.keys(models).length} Prisma models`);
  return models;
}

async function scanTypeScriptFieldUsage() {
  console.log('🔍 Scanning TypeScript files for field usage...');
  
  const fieldReferences = {};
  const fileErrors = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Patterns to find field usage
      const patterns = [
        // Prisma select/include patterns
        {
          regex: /select:\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g,
          type: 'select'
        },
        {
          regex: /include:\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g,
          type: 'include'
        },
        // Object property access
        {
          regex: /\.(\w+)(?:\?\.|\s*[:\?\[])/g,
          type: 'property_access'
        },
        // Data object creation
        {
          regex: /data:\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g,
          type: 'data'
        },
        // Where clauses
        {
          regex: /where:\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g,
          type: 'where'
        }
      ];
      
      patterns.forEach(({ regex, type }) => {
        let match;
        regex.lastIndex = 0; // Reset regex
        while ((match = regex.exec(content)) !== null) {
          if (type === 'property_access') {
            const field = match[1];
            if (field && field.length > 1 && !isCommonMethod(field)) {
              addFieldReference(field, filePath, type);
            }
          } else {
            // Extract field names from object literals
            const objectContent = match[1];
            const fieldMatches = objectContent.match(/(\w+):\s*(?:true|false|\w+|{)/g);
            if (fieldMatches) {
              fieldMatches.forEach(fieldMatch => {
                const field = fieldMatch.split(':')[0].trim();
                addFieldReference(field, filePath, type);
              });
            }
          }
        }
      });
      
    } catch (error) {
      fileErrors.push({ file: filePath, error: error.message });
    }
  }
  
  function addFieldReference(fieldName, filePath, type) {
    if (!fieldReferences[fieldName]) {
      fieldReferences[fieldName] = [];
    }
    fieldReferences[fieldName].push({
      file: filePath.replace(path.join(__dirname, '..'), ''),
      type
    });
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        scanFile(fullPath);
      }
    });
  }
  
  // Scan relevant directories
  const directories = ['app', 'lib', 'components', 'src'];
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      scanDirectory(fullPath);
    }
  });
  
  console.log(`   Found ${Object.keys(fieldReferences).length} field references`);
  console.log(`   Scanned files with ${fileErrors.length} errors`);
  
  return { references: fieldReferences, errors: fileErrors };
}

async function generateFieldReport(prismaSchema, fieldUsage) {
  console.log('📋 Generating field analysis report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    mismatches: [],
    recommendations: [],
    prismaModels: Object.keys(prismaSchema),
    commonErrors: []
  };
  
  // Get all Prisma fields
  const allPrismaFields = new Set();
  Object.values(prismaSchema).forEach(model => {
    model.fields.forEach(field => allPrismaFields.add(field.name));
    model.relations.forEach(relation => allPrismaFields.add(relation.name));
  });
  
  // Find field references that don't exist in Prisma schema
  const unmatchedFields = [];
  Object.keys(fieldUsage.references).forEach(fieldName => {
    if (!allPrismaFields.has(fieldName) && !isSystemField(fieldName)) {
      const references = fieldUsage.references[fieldName];
      unmatchedFields.push({
        field: fieldName,
        count: references.length,
        files: [...new Set(references.map(r => r.file))],
        types: [...new Set(references.map(r => r.type))],
        possibleMatches: findSimilarFields(fieldName, allPrismaFields)
      });
    }
  });
  
  // Find commonly used patterns that might indicate naming issues
  const commonPatterns = {
    snake_case: [],
    camelCase: [],
    phone_number_vs_phone: [],
    id_fields: []
  };
  
  unmatchedFields.forEach(item => {
    const field = item.field;
    
    if (field.includes('_')) {
      commonPatterns.snake_case.push(field);
    }
    
    if (field.match(/^[a-z]+[A-Z]/)) {
      commonPatterns.camelCase.push(field);
    }
    
    if (field.includes('phone_number') || field.includes('phoneNumber')) {
      commonPatterns.phone_number_vs_phone.push(field);
    }
    
    if (field.endsWith('_id') || field.endsWith('Id')) {
      commonPatterns.id_fields.push(field);
    }
  });
  
  report.summary = {
    totalPrismaFields: allPrismaFields.size,
    totalFieldReferences: Object.keys(fieldUsage.references).length,
    unmatchedFields: unmatchedFields.length,
    scanErrors: fieldUsage.errors.length
  };
  
  report.mismatches = unmatchedFields.slice(0, 50); // Top 50 mismatches
  
  // Generate common error patterns
  report.commonErrors = [
    {
      type: 'snake_case_in_code',
      count: commonPatterns.snake_case.length,
      examples: commonPatterns.snake_case.slice(0, 5),
      fix: 'Convert snake_case fields to camelCase as per Prisma convention'
    },
    {
      type: 'phone_field_mismatch',
      count: commonPatterns.phone_number_vs_phone.length,
      examples: commonPatterns.phone_number_vs_phone.slice(0, 5),
      fix: 'Database uses "phone", not "phone_number" - update code references'
    },
    {
      type: 'id_field_references',
      count: commonPatterns.id_fields.length,
      examples: commonPatterns.id_fields.slice(0, 5),
      fix: 'Verify foreign key field names match Prisma schema'
    }
  ];
  
  // Generate recommendations
  if (unmatchedFields.length > 0) {
    report.recommendations.push(
      `❌ Found ${unmatchedFields.length} field references that don't match Prisma schema`
    );
    report.recommendations.push(
      '🔧 Priority fixes: phone_number → phone, snake_case → camelCase'
    );
  }
  
  if (fieldUsage.errors.length > 0) {
    report.recommendations.push(
      `⚠️ ${fieldUsage.errors.length} files had scanning errors - check permissions`
    );
  }
  
  report.recommendations.push(
    '📝 Review the top mismatches and apply field name corrections'
  );
  
  // Save report
  const reportPath = path.join(__dirname, '../field-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📋 FIELD ANALYSIS SUMMARY:');
  console.log(`   Prisma Fields: ${report.summary.totalPrismaFields}`);
  console.log(`   Code References: ${report.summary.totalFieldReferences}`);
  console.log(`   Mismatched Fields: ${report.summary.unmatchedFields}`);
  
  if (report.summary.unmatchedFields > 0) {
    console.log('\n❌ TOP FIELD MISMATCHES:');
    unmatchedFields.slice(0, 10).forEach(mismatch => {
      console.log(`   • "${mismatch.field}" (${mismatch.count} refs) - ${mismatch.files.length} files`);
      if (mismatch.possibleMatches.length > 0) {
        console.log(`     Possible matches: ${mismatch.possibleMatches.join(', ')}`);
      }
    });
    
    console.log('\n🔧 QUICK FIXES:');
    report.commonErrors.forEach(error => {
      if (error.count > 0) {
        console.log(`   • ${error.fix} (${error.count} instances)`);
      }
    });
  }
  
  return report;
}

// Utility functions
function isPascalCase(str) {
  return str.charAt(0).toUpperCase() === str.charAt(0) && str.includes(str.charAt(0).toUpperCase());
}

function isSystemField(fieldName) {
  const systemFields = [
    'id', 'createdAt', 'updatedAt', 'deleted_at', 
    'user', 'users', 'patient', 'patients', 'doctor', 'doctors',
    'length', 'size', 'count', 'map', 'filter', 'includes',
    'toString', 'valueOf', 'hasOwnProperty'
  ];
  return systemFields.includes(fieldName) || fieldName.length <= 2;
}

function isCommonMethod(fieldName) {
  const commonMethods = [
    'map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every',
    'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
    'length', 'size', 'get', 'set', 'has', 'add', 'delete',
    'then', 'catch', 'finally', 'json', 'text', 'ok', 'status'
  ];
  return commonMethods.includes(fieldName);
}

function findSimilarFields(fieldName, allFields) {
  const similar = [];
  const lowerField = fieldName.toLowerCase();
  
  for (const field of allFields) {
    const lowerPrismaField = field.toLowerCase();
    
    // Exact match ignoring case
    if (lowerField === lowerPrismaField && fieldName !== field) {
      similar.push(field);
    }
    // Snake case vs camel case
    else if (lowerField.replace(/_/g, '') === lowerPrismaField.replace(/_/g, '')) {
      similar.push(field);
    }
    // Similar length and starting letters
    else if (Math.abs(fieldName.length - field.length) <= 2 && 
             lowerField.substring(0, 3) === lowerPrismaField.substring(0, 3)) {
      similar.push(field);
    }
  }
  
  return similar.slice(0, 3); // Top 3 matches
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Field analysis failed:', error);
    process.exit(1);
  });
}