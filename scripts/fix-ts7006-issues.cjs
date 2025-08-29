#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

class ImprovedTS7006Fixer {
  constructor() {
    this.commonTypes = {
      'alert': 'EmergencyAlertWithRelations | MedicationSafetyAlertWithRelations',
      'notification': 'NotificationWithRelations',
      'patient': 'Patient',
      'user': 'User',
      'record': 'AdherenceRecordWithRelations',
      'r': 'any',
      'score': 'number',
      'sum': 'number',
      'acc': 'number',
      'item': 'any',
      'element': 'any',
      'data': 'any',
      'result': 'any',
      'msg': 'string',
      'ev': 'React.MouseEvent',
      'event': 'Event',
      'config': 'any'
    };
  }

  /**
   * Get all TS7006 errors
   */
  getAllTS7006Errors() {
    let output = '';
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return [];
    } catch (error) {
      output = error.stdout.toString();
    }

    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS7006: Parameter '(.+?)' implicitly has an 'any' type\./);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          character: parseInt(match[3]),
          parameter: match[4],
          fullLine: line.trim()
        });
      }
    }
    
    return errors;
  }

  /**
   * Analyze context and get suggested type
   */
  getSuggestedType(error) {
    try {
      const content = fs.readFileSync(error.file, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[error.line - 1];
      
      // Context-aware type suggestions
      if (error.parameter === 'alert') {
        if (targetLine.includes('emergencyAlerts') || error.file.includes('critical-alerts')) {
          return 'EmergencyAlertWithRelations';
        } else if (targetLine.includes('medicationAlerts')) {
          return 'MedicationSafetyAlertWithRelations';
        }
        return 'EmergencyAlertWithRelations | MedicationSafetyAlertWithRelations';
      }
      
      if (error.parameter === 'notification') {
        return 'NotificationWithRelations';
      }
      
      if (error.parameter === 'r' && targetLine.includes('.reduce(')) {
        // Look for context clues in surrounding lines
        for (let i = Math.max(0, error.line - 5); i < Math.min(lines.length, error.line + 2); i++) {
          if (lines[i].includes('adherenceRecords') || lines[i].includes('AdherenceRecord')) {
            return 'AdherenceRecordWithRelations';
          }
        }
        return 'any';
      }
      
      if (['score', 'sum', 'acc'].includes(error.parameter)) {
        return 'number';
      }
      
      if (error.parameter === 'ev' && targetLine.includes('onClick')) {
        return 'React.MouseEvent<HTMLButtonElement>';
      }
      
      return this.commonTypes[error.parameter] || 'any';
      
    } catch (err) {
      return this.commonTypes[error.parameter] || 'any';
    }
  }

  /**
   * Fix a single error
   */
  fixSingleError(error, isDryRun = false) {
    try {
      const content = fs.readFileSync(error.file, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[error.line - 1];
      
      const suggestedType = this.getSuggestedType(error);
      
      // Create regex pattern to match the parameter
      const patterns = [
        new RegExp(`\\(\\s*${error.parameter}\\s*\\)`, 'g'),
        new RegExp(`\\(\\s*${error.parameter}\\s*,`, 'g'),
        new RegExp(`,\\s*${error.parameter}\\s*\\)`, 'g'),
        new RegExp(`,\\s*${error.parameter}\\s*,`, 'g')
      ];
      
      let foundMatch = false;
      let newLine = targetLine;
      
      for (const pattern of patterns) {
        if (pattern.test(targetLine)) {
          const replacement = targetLine.match(/\(\s*\w+\s*\)/g) 
            ? `(${error.parameter}: ${suggestedType})`
            : targetLine.match(/,\s*\w+\s*\)/g)
            ? `, ${error.parameter}: ${suggestedType})`
            : targetLine.match(/\(\s*\w+\s*,/g)
            ? `(${error.parameter}: ${suggestedType},`
            : `, ${error.parameter}: ${suggestedType},`;
            
          newLine = targetLine.replace(pattern, replacement);
          foundMatch = true;
          break;
        }
      }
      
      if (foundMatch) {
        if (!isDryRun) {
          lines[error.line - 1] = newLine;
          
          // Add necessary imports and types
          let updatedContent = this.addRequiredImports(lines.join('\n'), suggestedType);
          fs.writeFileSync(error.file, updatedContent);
        }
        
        return {
          success: true,
          suggestedType,
          before: targetLine.trim(),
          after: newLine.trim()
        };
      }
      
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
    
    return { success: false, error: 'No pattern matched' };
  }

  /**
   * Add required imports and type definitions
   */
  addRequiredImports(content, suggestedType) {
    let needsPrismaImport = false;
    let needsReactImport = false;
    let needsTypeDefinitions = false;
    
    // Determine what imports are needed
    if (suggestedType.includes('WithRelations')) {
      needsPrismaImport = true;
      needsTypeDefinitions = true;
    }
    
    if (suggestedType.includes('React.')) {
      needsReactImport = true;
    }
    
    // Add Prisma import
    if (needsPrismaImport && !content.includes('import { Prisma }')) {
      const importMatch = content.match(/^(import .+?;\s*\n)*/m);
      if (importMatch) {
        const existingImports = importMatch[0] || '';
        content = content.replace(existingImports, existingImports + 'import { Prisma } from "@prisma/client";\n');
      }
    }
    
    // Add React import if needed
    if (needsReactImport && !content.includes('import React') && !content.includes('import * as React')) {
      const importMatch = content.match(/^(import .+?;\s*\n)*/m);
      if (importMatch) {
        const existingImports = importMatch[0] || '';
        content = content.replace(existingImports, existingImports + 'import React from "react";\n');
      }
    }
    
    // Add type definitions
    if (needsTypeDefinitions && !content.includes('type EmergencyAlertWithRelations')) {
      const typeDefinitions = `
type EmergencyAlertWithRelations = Prisma.EmergencyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type MedicationSafetyAlertWithRelations = Prisma.MedicationSafetyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: { patient: true; user: true }
}>;

type AdherenceRecordWithRelations = Prisma.AdherenceRecordGetPayload<{
  include: { patient: true; user: true }
}>;

`;
      
      // Find position to insert type definitions
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('export ') || line.startsWith('function ') || 
            line.startsWith('const ') || line.startsWith('async function') ||
            line.startsWith('class ')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, ...typeDefinitions.split('\n'));
      content = lines.join('\n');
    }
    
    return content;
  }

  /**
   * Run the fixer with comprehensive reporting
   */
  run() {
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
    
    console.log('🔍 Scanning for TS7006 errors...');
    
    const errors = this.getAllTS7006Errors();
    
    if (errors.length === 0) {
      console.log('✨ No TS7006 errors found!');
      return;
    }
    
    console.log(`📝 Found ${errors.length} TS7006 errors`);
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN - Preview of changes:\n');
    } else {
      console.log('\n🔧 Applying fixes:\n');
    }
    
    const results = {
      total: errors.length,
      fixed: 0,
      failed: 0,
      details: []
    };
    
    // Group errors by file for better organization
    const errorsByFile = {};
    errors.forEach(error => {
      if (!errorsByFile[error.file]) {
        errorsByFile[error.file] = [];
      }
      errorsByFile[error.file].push(error);
    });
    
    // Process each file
    Object.entries(errorsByFile).forEach(([filePath, fileErrors]) => {
      console.log(`\n📁 ${filePath} (${fileErrors.length} errors)`);
      
      fileErrors.forEach((error, index) => {
        const result = this.fixSingleError(error, isDryRun);
        results.details.push({
          error,
          result
        });
        
        if (result.success) {
          results.fixed++;
          const icon = isDryRun ? '👀' : '✅';
          console.log(`   ${icon} Line ${error.line}: '${error.parameter}' → '${result.suggestedType}'`);
          if (isDryRun && result.before !== result.after) {
            console.log(`      Before: ${result.before}`);
            console.log(`      After:  ${result.after}`);
          }
        } else {
          results.failed++;
          console.log(`   ❌ Line ${error.line}: '${error.parameter}' - ${result.error}`);
        }
      });
    });
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total errors: ${results.total}`);
    console.log(`   ${isDryRun ? 'Would fix' : 'Fixed'}: ${results.fixed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Success rate: ${Math.round((results.fixed / results.total) * 100)}%`);
    
    if (!isDryRun && results.fixed > 0) {
      console.log('\n🔍 Re-checking for remaining errors...');
      const remainingErrors = this.getAllTS7006Errors();
      
      if (remainingErrors.length === 0) {
        console.log('✨ All TS7006 errors have been resolved!');
      } else {
        console.log(`⚠️  ${remainingErrors.length} errors still remain and need manual attention:`);
        
        // Show remaining errors grouped by type
        const remainingByParam = {};
        remainingErrors.forEach(error => {
          if (!remainingByParam[error.parameter]) {
            remainingByParam[error.parameter] = [];
          }
          remainingByParam[error.parameter].push(error);
        });
        
        Object.entries(remainingByParam).forEach(([param, paramErrors]) => {
          console.log(`   '${param}': ${paramErrors.length} occurrences`);
          paramErrors.slice(0, 3).forEach(error => {
            console.log(`     ${error.file}:${error.line}`);
          });
          if (paramErrors.length > 3) {
            console.log(`     ... and ${paramErrors.length - 3} more`);
          }
        });
      }
    }
    
    if (isDryRun) {
      console.log('\n💡 Run without --dry-run to apply these fixes');
    }
  }
}

// CLI Interface
const fixer = new ImprovedTS7006Fixer();
fixer.run();
