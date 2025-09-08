#!/usr/bin/env node

/**
 * Automated Field Mapping Fix Script
 * Automatically fixes common field naming issues identified by the analysis
 */

const fs = require('fs');
const path = require('path');

// Field mappings from snake_case (code) to camelCase (Prisma)
const FIELD_MAPPINGS = {
  // User fields
  'firstName': 'firstName',           // Keep as is - matches Prisma
  'lastName': 'lastName',             // Keep as is - matches Prisma  
  'phone_number': 'phone',              // Database uses 'phone'
  'email_verified': 'email_verified',   // Keep as is - matches Prisma
  'account_status': 'account_status',   // Keep as is - matches Prisma
  'date_of_birth': 'date_of_birth',     // Keep as is - matches Prisma
  'last_login_at': 'last_used_at',      // Use existing field
  
  // Common field fixes
  'createdAt': 'createdAt',
  'updatedAt': 'updatedAt',
  'deleted_at': 'deleted_at',
  
  // Healthcare specific
  'patientId': 'patientId',
  'doctorId': 'doctorId',
  'care_plan_id': 'care_plan_id',
  'medication_id': 'medication_id',
  'vital_template_id': 'vital_template_id',
  'reading_date': 'readingTime',       // Actual field name in schema
  'recorded_by': 'recordedAt',         // Use timestamp instead
  
  // Relationship corrections
  'primary_doctor': 'doctors',          // Actual relationship name
  'vital_readings': 'vitalReading',     // Actual model name
  'patient_symptoms': 'symptom',        // Actual model name
  'medications': 'carePlans',          // Use existing relationship
  
  // Count corrections for _count queries
  'vital_readings': 'adherence_records', // Available count field
};

async function main() {
  console.log('🔧 Starting Automated Field Mapping Fixes...\n');
  
  // Load the analysis report to prioritize fixes
  const report = loadAnalysisReport();
  
  // Apply fixes in priority order
  const fixResults = await applyFieldFixes(report);
  
  // Generate fix summary
  generateFixSummary(fixResults);
  
  console.log('\n✅ Field mapping fixes completed!');
  console.log('   Run "npm run build" to verify fixes worked');
}

function loadAnalysisReport() {
  const reportPath = path.join(__dirname, '../field-analysis-report.json');
  if (!fs.existsSync(reportPath)) {
    console.log('⚠️  Analysis report not found, using default mappings');
    return null;
  }
  
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

async function applyFieldFixes(report) {
  const results = {
    filesModified: 0,
    replacements: 0,
    errors: []
  };
  
  // Get priority mismatches from report
  const priorityFields = new Set();
  
  if (report) {
    // Add top mismatches to priority
    report.mismatches.slice(0, 20).forEach(mismatch => {
      if (FIELD_MAPPINGS[mismatch.field]) {
        priorityFields.add(mismatch.field);
      }
    });
  }
  
  // Always include common problematic fields
  const commonFields = ['phone_number', 'reading_date', 'primary_doctor', 'vital_readings', 'patient_symptoms'];
  commonFields.forEach(field => priorityFields.add(field));
  
  console.log(`🎯 Targeting ${priorityFields.size} priority fields for fixes`);
  
  // Scan and fix files
  const directories = ['app', 'lib', 'components'];
  
  for (const dir of directories) {
    const fullPath = path.join(__dirname, '../../', dir);
    if (fs.existsSync(fullPath)) {
      await processDirectory(fullPath, priorityFields, results);
    }
  }
  
  return results;
}

async function processDirectory(dirPath, priorityFields, results) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      await processDirectory(fullPath, priorityFields, results);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      await processFile(fullPath, priorityFields, results);
    }
  }
}

async function processFile(filePath, priorityFields, results) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let fileReplacements = 0;
    
    // Apply field mappings in order of importance
    for (const [oldField, newField] of Object.entries(FIELD_MAPPINGS)) {
      if (!priorityFields.has(oldField) && !priorityFields.has('all')) continue;
      
      // Skip if old and new are the same
      if (oldField === newField) continue;
      
      // Different replacement patterns based on context
      const patterns = [
        // Object property access: .phone_number -> .phone
        {
          regex: new RegExp(`\\.${oldField}(?!\\w)`, 'g'),
          replacement: `.${newField}`,
          description: 'property access'
        },
        // Select/include object properties: phone_number: true -> phone: true
        {
          regex: new RegExp(`\\b${oldField}:\\s*true\\b`, 'g'),
          replacement: `${newField}: true`,
          description: 'select/include'
        },
        // Object keys: { phone_number: value } -> { phone: value }
        {
          regex: new RegExp(`\\b${oldField}:\\s*(?!\\s*true\\b)`, 'g'),
          replacement: `${newField}: `,
          description: 'object key'
        },
        // Prisma model references: patient_symptoms -> symptom
        {
          regex: new RegExp(`prisma\\.${oldField}\\b`, 'g'),
          replacement: `prisma.${newField}`,
          description: 'prisma model'
        },
        // Count field references: _count.medications -> _count.carePlans  
        {
          regex: new RegExp(`_count\\.${oldField}\\b`, 'g'),
          replacement: `_count.${newField}`,
          description: 'count field'
        }
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
          content = content.replace(pattern.regex, pattern.replacement);
          fileReplacements += matches.length;
          modified = true;
        }
      });
    }
    
    // Write modified content back to file
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.filesModified++;
      results.replacements += fileReplacements;
      
      const relativePath = filePath.replace(path.join(__dirname, '..'), '');
      console.log(`   ✅ ${relativePath} (${fileReplacements} replacements)`);
    }
    
  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
  }
}

function generateFixSummary(results) {
  console.log('\n📊 FIX SUMMARY:');
  console.log(`   Files Modified: ${results.filesModified}`);
  console.log(`   Total Replacements: ${results.replacements}`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.slice(0, 5).forEach(error => {
      console.log(`   • ${error.file}: ${error.error}`);
    });
  }
  
  // Save detailed results
  const summaryPath = path.join(__dirname, '../field-fix-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...results,
    fieldMappingsApplied: Object.keys(FIELD_MAPPINGS).length
  }, null, 2));
  
  console.log('\n🔧 APPLIED FIELD MAPPINGS:');
  Object.entries(FIELD_MAPPINGS).forEach(([old, new_]) => {
    if (old !== new_) {
      console.log(`   • ${old} → ${new_}`);
    }
  });
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Field fix failed:', error);
    process.exit(1);
  });
}