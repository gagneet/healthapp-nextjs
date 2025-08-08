#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing TypeScript undefined checks (TS18048)...');

// Get TypeScript errors
let tscOutput;
try {
  tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
} catch (error) {
  tscOutput = error.stdout || error.output ? error.output.join('') : '';
}
const lines = tscOutput.split('\n');

const undefinedErrors = lines.filter(line => line.includes('TS18048'));
console.log(`Found ${undefinedErrors.length} undefined check errors to fix`);

const fileChanges = new Map();

undefinedErrors.forEach(errorLine => {
  const match = errorLine.match(/^(.+)\((\d+),(\d+)\):.+TS18048:.+'(.+)' is possibly '(.+)'/);
  if (!match) return;
  
  const [, filePath, lineNum, colNum, property, undefinedType] = match;
  const lineNumber = parseInt(lineNum);
  
  if (!fs.existsSync(filePath)) return;
  
  if (!fileChanges.has(filePath)) {
    fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8').split('\n'));
  }
  
  const lines = fileChanges.get(filePath);
  if (lineNumber <= 0 || lineNumber > lines.length) return;
  
  const line = lines[lineNumber - 1];
  let fixedLine = line;
  
  // Pattern 1: obj.property -> obj.property || defaultValue
  if (undefinedType === 'undefined') {
    if (property.includes('.')) {
      const propName = property.split('.').pop();
      
      // Add default values based on property type
      if (propName.includes('rate') || propName.includes('count') || propName.includes('alerts')) {
        fixedLine = fixedLine.replace(new RegExp(property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `(${property} || 0)`);
      } else if (propName.includes('name') || propName.includes('email') || propName.includes('phone')) {
        fixedLine = fixedLine.replace(new RegExp(property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `(${property} || '')`);
      } else {
        // Generic undefined check
        fixedLine = fixedLine.replace(new RegExp(property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `(${property} ?? '')`);
      }
    }
  }
  
  if (fixedLine !== line) {
    lines[lineNumber - 1] = fixedLine;
    console.log(`Fixed undefined check in ${filePath}:${lineNumber}`);
  }
});

// Write changes back to files
let filesFixed = 0;
for (const [filePath, lines] of fileChanges.entries()) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  filesFixed++;
}

console.log(`✅ Fixed undefined checks in ${filesFixed} files`);

// Check results
try {
  const newTscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
  const newUndefinedErrors = newTscOutput.split('\n').filter(line => line.includes('TS18048'));
  console.log(`Remaining undefined errors: ${newUndefinedErrors.length}`);
} catch (error) {
  const errorOutput = error.stdout || error.output ? error.output.join('') : '';
  const newUndefinedErrors = errorOutput.split('\n').filter(line => line.includes('TS18048'));
  console.log(`Remaining undefined errors: ${newUndefinedErrors.length}`);
}