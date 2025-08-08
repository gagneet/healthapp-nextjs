#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 Fixing the final 25 TypeScript errors...');

// Get the specific errors
let tscOutput;
try {
  tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
} catch (error) {
  tscOutput = error.stdout || error.output ? error.output.join('') : '';
}
const lines = tscOutput.split('\n');

const errorFiles = new Set();
const scriptErrors = lines.filter(line => {
  if (line.includes('error TS') && line.includes('scripts/')) {
    const match = line.match(/^([^:]+):/);
    if (match) {
      errorFiles.add(match[1]);
    }
    return true;
  }
  return false;
});

console.log(`Found ${scriptErrors.length} errors in ${errorFiles.size} script files`);

// Fix common patterns in all script files
const commonFixes = [
  // Fix console.log patterns that got mangled
  { find: /console\.(log as any)\(/g, replace: 'console.log(' },
  { find: /console\.(error as any)\(/g, replace: 'console.error(' },
  { find: /console\.(warn as any)\(/g, replace: 'console.warn(' },
  { find: /console\.(info as any)\(/g, replace: 'console.info(' },
  
  // Fix object property syntax errors
  { find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: 'error: (error as any).message' },
  { find: /, \(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: ', error: (error as any).message' },
  
  // Fix method declarations
  { find: /async (\w+)\(([^)]*)\) \{/g, replace: 'async $1($2) {' },
  
  // Fix function calls
  { find: /\.(\w+)\(([^)]*)\) as any/g, replace: '.($1 as any)($2)' }
];

let totalFixes = 0;

errorFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    commonFixes.forEach(fix => {
      const newContent = content.replace(fix.find, fix.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        totalFixes++;
      }
    });
    
    // Additional specific fixes for script files
    // Fix any remaining mangled console calls
    if (content.includes('(log as any)') || content.includes('(error as any)')) {
      content = content.replace(/console\.\((\w+) as any\)\(/g, 'console.$1(');
      modified = true;
      totalFixes++;
    }
    
    // Fix migration script specific issues
    if (filePath.includes('migrate-to-postgresql.ts')) {
      // Fix object property assignment errors
      content = content.replace(/(\w+): \((\w+ as any)\)\.(\w+)/g, '$1: ($2 as any).$3');
      content = content.replace(/verification_results: await this\.verifyMigration\(\)/g, 'verification_results: await this.verifyMigration()');
      modified = true;
      totalFixes++;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    }
  }
});

console.log(`✅ Applied ${totalFixes} fixes to script files`);

// Check final results
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'ignore' });
  console.log('🎉 ZERO TypeScript errors remaining! Application ready to build!');
} catch (error) {
  try {
    const output = execSync('npx tsc --noEmit 2>&1 || true', { encoding: 'utf8' });
    const errorCount = output.split('\n').filter(line => line.includes('error TS')).length;
    
    if (errorCount === 0) {
      console.log('🎉 ZERO TypeScript errors remaining! Application ready to build!');
    } else {
      console.log(`📊 Final error count: ${errorCount}`);
      if (errorCount <= 10) {
        console.log('\nRemaining errors:');
        output.split('\n')
          .filter(line => line.includes('error TS'))
          .forEach(line => console.log(line));
      }
    }
  } catch (e) {
    console.log('Checking final status...');
  }
}