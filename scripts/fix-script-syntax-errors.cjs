#!/usr/bin/env node

/**
 * Fix syntax errors in TypeScript script files
 * These errors were likely introduced by automated fixing scripts
 */

const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

// Get all TypeScript files in scripts directory
const scriptFiles = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith('.ts') && !file.includes('fix-'))
  .map(file => path.join(scriptsDir, file));

console.log(`Found ${scriptFiles.length} TypeScript script files to fix...`);

let totalFixes = 0;

scriptFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;
    let fileFixes = 0;

    // Fix console.(error as any) -> console.error
    const consoleFix = fixed.replace(/console\.\(([^)]+)\)/g, 'console.error');
    if (consoleFix !== fixed) {
      fileFixes += (fixed.match(/console\.\(([^)]+)\)/g) || []).length;
      fixed = consoleFix;
    }

    // Fix malformed object property assignments like: property: (value as any): (other as any)
    // Should be: property: (other as any)
    const propertyFix = fixed.replace(
      /(\w+):\s*\([^)]+\)\s*:\s*(\([^)]+\))/g, 
      '$1: $2'
    );
    if (propertyFix !== fixed) {
      fileFixes += (fixed.match(/(\w+):\s*\([^)]+\)\s*:\s*(\([^)]+\))/g) || []).length;
      fixed = propertyFix;
    }

    // Fix array property access issues: array[index]: value -> array[index] = value
    const arrayAssignFix = fixed.replace(
      /(\w+\[[^\]]+\]):\s*([^,;\n}]+)/g,
      '$1 = $2'
    );
    if (arrayAssignFix !== fixed) {
      fileFixes += (fixed.match(/(\w+\[[^\]]+\]):\s*([^,;\n}]+)/g) || []).length;
      fixed = arrayAssignFix;
    }

    // Fix parameter syntax issues in function calls
    // Fix cases like: function((param as any): (value as any))
    // Should be: function((param as any), (value as any))
    const paramFix = fixed.replace(
      /\(([^)]*)\)\s*:\s*\(([^)]*)\)/g,
      '($1, $2)'
    );
    if (paramFix !== fixed) {
      fileFixes += (fixed.match(/\(([^)]*)\)\s*:\s*\(([^)]*)\)/g) || []).length;
      fixed = paramFix;
    }

    // Fix template literal issues
    const templateFix = fixed.replace(/`([^`]*)\$\{([^}]*)\}([^`]*)`:\s*([^,;\n}]+)/g, '`$1${$2}$3`: $4');
    if (templateFix !== fixed) {
      fileFixes += (fixed.match(/`([^`]*)\$\{([^}]*)\}([^`]*)`:\s*([^,;\n}]+)/g) || []).length;
      fixed = templateFix;
    }

    // Fix JSX-style issues that might appear: <tag>content</tag>: value
    const jsxFix = fixed.replace(/<(\w+)>([^<]*)<\/\1>:\s*([^,;\n}]+)/g, '<$1>$3</$1>');
    if (jsxFix !== fixed) {
      fileFixes += (fixed.match(/<(\w+)>([^<]*)<\/\1>:\s*([^,;\n}]+)/g) || []).length;
      fixed = jsxFix;
    }

    // Fix method call syntax issues
    const methodFix = fixed.replace(/\.(\w+)\(([^)]*)\):\s*([^,;\n}]+)/g, '.$1($2, $3)');
    if (methodFix !== fixed) {
      fileFixes += (fixed.match(/\.(\w+)\(([^)]*)\):\s*([^,;\n}]+)/g) || []).length;
      fixed = methodFix;
    }

    if (fileFixes > 0) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`Fixed ${fileFixes} syntax errors in ${path.basename(filePath)}`);
      totalFixes += fileFixes;
    }

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Total syntax errors fixed: ${totalFixes}`);
console.log('🔄 Run "npx tsc --noEmit" to check remaining errors...');