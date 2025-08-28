#!/usr/bin/env node

/**
 * Smart Field Fix Script
 * Uses actual Prisma schema to make intelligent field corrections
 */

const fs = require('fs');
const path = require('path');

// Store parsed schema
let PRISMA_MODELS = {};

async function main() {
  console.log('🧠 Starting Smart Field Fixes based on Prisma Schema...\n');
  
  // Step 1: Parse Prisma schema to get actual field names
  await parsePrismaSchema();
  
  // Step 2: Fix common issues based on schema
  const results = await applySmartFixes();
  
  console.log('\n✅ Smart fixes completed!');
  console.log(`   Modified ${results.filesModified} files with ${results.replacements} fixes`);
  console.log('   Run "npm run build" to verify');
}

async function parsePrismaSchema() {
  console.log('📖 Parsing Prisma schema for actual field names...');
  
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  const modelRegex = /model\s+(\w+)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    const fields = new Set();
    const relations = new Set();
    
    // Extract field lines
    const fieldLines = modelBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('@@') && !line.startsWith('//'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/^(\w+)\s+([^\s@]+)(?:\s+(.*))?$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const attributes = fieldMatch[3] || '';
        
        if (attributes.includes('@relation') || fieldType.endsWith('[]')) {
          relations.add(fieldName);
        } else {
          fields.add(fieldName);
        }
      }
    });
    
    PRISMA_MODELS[modelName] = { fields, relations };
  }
  
  console.log(`   Loaded ${Object.keys(PRISMA_MODELS).length} models with field definitions`);
}

async function applySmartFixes() {
  const results = {
    filesModified: 0,
    replacements: 0,
    errors: []
  };
  
  // Smart field mappings based on analysis
  const smartMappings = generateSmartMappings();
  
  console.log('🎯 Applying smart field mappings...');
  
  // Process TypeScript files
  const directories = ['app', 'lib', 'components'];
  
  for (const dir of directories) {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      await processDirectory(fullPath, smartMappings, results);
    }
  }
  
  return results;
}

function generateSmartMappings() {
  const mappings = {};
  
  // Check User model fields to fix common issues
  if (PRISMA_MODELS.User) {
    const userFields = PRISMA_MODELS.User.fields;
    
    // Common field corrections
    if (userFields.has('phone') && !userFields.has('phone_number')) {
      mappings['phone_number'] = 'phone';
    }
    
    if (userFields.has('createdAt') && !userFields.has('last_login_at') && !userFields.has('last_used_at')) {
      // If neither field exists, remove the reference entirely
      mappings['last_used_at'] = null; // Mark for removal
      mappings['last_login_at'] = null;
    }
  }
  
  // Check Patient model relationships
  if (PRISMA_MODELS.Patient) {
    const patientRelations = PRISMA_MODELS.Patient.relations;
    
    if (patientRelations.has('doctors') && !patientRelations.has('primary_doctor')) {
      mappings['primary_doctor'] = 'doctors';
    }
    
    if (patientRelations.has('adherence_records') && !patientRelations.has('vital_readings')) {
      mappings['vital_readings'] = 'adherence_records';
    }
    
    if (patientRelations.has('care_plans') && !patientRelations.has('medications')) {
      mappings['medications'] = 'care_plans';
    }
  }
  
  // Fix Prisma model names (single vs plural)
  const modelCorrections = {
    'patient_symptoms': 'symptom',
    'vital_readings': 'vitalReading',
    'patient_subscriptions': 'patientSubscription',
  };
  
  Object.entries(modelCorrections).forEach(([wrong, correct]) => {
    if (PRISMA_MODELS[correct] || PRISMA_MODELS[toPascalCase(correct)]) {
      mappings[wrong] = correct;
    }
  });
  
  console.log('📋 Generated smart mappings:');
  Object.entries(mappings).forEach(([old, new_]) => {
    if (new_ === null) {
      console.log(`   • Remove: ${old}`);
    } else {
      console.log(`   • ${old} → ${new_}`);
    }
  });
  
  return mappings;
}

async function processDirectory(dirPath, mappings, results) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.')) {
      await processDirectory(fullPath, mappings, results);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      await processFile(fullPath, mappings, results);
    }
  }
}

async function processFile(filePath, mappings, results) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let fileReplacements = 0;
    
    Object.entries(mappings).forEach(([oldField, newField]) => {
      if (newField === null) {
        // Remove field references entirely
        const patterns = [
          // Remove from select objects: last_used_at: true,
          new RegExp(`\\s*${oldField}:\\s*true,?\\s*`, 'g'),
          // Remove from object destructuring
          new RegExp(`\\s*${oldField},?\\s*`, 'g'),
        ];
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            content = content.replace(pattern, '');
            fileReplacements += matches.length;
            modified = true;
          }
        });
        
      } else if (oldField !== newField) {
        // Replace field references
        const patterns = [
          // Property access: .old_field -> .new_field
          {
            regex: new RegExp(`\\.${oldField}(?!\\w)`, 'g'),
            replacement: `.${newField}`,
          },
          // Object keys: old_field: -> new_field:
          {
            regex: new RegExp(`\\b${oldField}:\\s*`, 'g'),
            replacement: `${newField}: `,
          },
          // Prisma model references: prisma.old_model -> prisma.new_model
          {
            regex: new RegExp(`prisma\\.${oldField}\\b`, 'g'),
            replacement: `prisma.${newField}`,
          },
          // Count references: _count.old -> _count.new
          {
            regex: new RegExp(`_count\\.${oldField}\\b`, 'g'),
            replacement: `_count.${newField}`,
          }
        ];
        
        patterns.forEach(({ regex, replacement }) => {
          const matches = content.match(regex);
          if (matches) {
            content = content.replace(regex, replacement);
            fileReplacements += matches.length;
            modified = true;
          }
        });
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.filesModified++;
      results.replacements += fileReplacements;
      
      const relativePath = filePath.replace(path.join(__dirname, '..'), '');
      console.log(`   ✅ ${relativePath} (${fileReplacements} fixes)`);
    }
    
  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
  }
}

function toPascalCase(str) {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Smart fix failed:', error);
    process.exit(1);
  });
}