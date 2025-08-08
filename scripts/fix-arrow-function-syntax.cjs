#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Automated Arrow Function Syntax Fixer');
console.log('=========================================');

// Get all syntax errors
console.log('📊 Analyzing TypeScript syntax errors...');
const tscOutput = execSync('npx tsc --build tsconfig.backend.json 2>&1 || true', { encoding: 'utf8' });
const syntaxErrors = tscOutput
  .split('\n')
  .filter(line => line.includes("',' expected"))
  .map(line => {
    const match = line.match(/^(.+)\((\d+),(\d+)\):.+error TS1005: ',' expected/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]) - 1,
        column: parseInt(match[3]) - 1
      };
    }
    return null;
  })
  .filter(Boolean);

console.log(`📋 Found ${syntaxErrors.length} syntax errors to fix`);

// Group errors by file
const errorsByFile = syntaxErrors.reduce((acc, error) => {
  if (!acc[error.file]) acc[error.file] = [];
  acc[error.file].push(error);
  return acc;
}, {});

let totalFixed = 0;

// Process each file
for (const [filePath, errors] of Object.entries(errorsByFile)) {
  console.log(`\n🔧 Processing ${filePath} (${errors.length} errors)`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let fileFixed = 0;
    
    // Sort errors by line number in descending order
    errors.sort((a, b) => b.line - a.line);
    
    for (const error of errors) {
      const line = lines[error.line];
      if (!line) continue;
      
      // Fix common patterns that cause syntax errors:
      // 1. Fix: .map(param: any => { -> .map((param: any) => {
      if (line.includes(': any =>')) {
        const fixed = line.replace(/(\w+): any =>/g, '($1: any) =>');
        if (fixed !== line) {
          lines[error.line] = fixed;
          fileFixed++;
        }
      }
      
      // 2. Fix: .filter(param: any => -> .filter((param: any) =>  
      else if (line.includes(': any') && (line.includes('.map') || line.includes('.filter') || line.includes('.forEach'))) {
        const fixed = line.replace(/\.(\w+)\((\w+): any\b/g, '.$1(($2: any)');
        if (fixed !== line) {
          lines[error.line] = fixed;
          fileFixed++;
        }
      }
      
      // 3. Fix arrow function parameter syntax issues
      else if (line.includes(': any') && line.includes('=>')) {
        // Pattern: word: any => should be (word: any) =>
        const fixed = line.replace(/\b(\w+): any\s*=>/g, '($1: any) =>');
        if (fixed !== line) {
          lines[error.line] = fixed;
          fileFixed++;
        }
      }
    }
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`  ✅ Fixed ${fileFixed} syntax errors`);
      totalFixed += fileFixed;
    }
    
  } catch (err) {
    console.error(`  ❌ Error processing ${filePath}:`, err.message);
  }
}

console.log(`\n🎉 Total syntax errors fixed: ${totalFixed}`);
console.log('\n📊 Checking remaining errors...');

// Check remaining error count
const newTscOutput = execSync('npx tsc --build tsconfig.backend.json 2>&1 || true', { encoding: 'utf8' });
const remainingErrors = newTscOutput.split('\n').filter(line => line.includes('error TS')).length;

console.log(`📉 Remaining TypeScript errors: ${remainingErrors}`);
console.log('✨ Syntax fixing complete!');