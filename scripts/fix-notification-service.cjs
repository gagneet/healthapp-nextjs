#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing NotificationService.ts...');

const filePath = path.join(process.cwd(), 'src/services/NotificationService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix function return statements with malformed object properties
const fixes = [
  // Fix return statement error objects
  { find: /, \(\w+ as any\): \(\w+ as any\)\.message/g, replace: ', error: (error as any).message' },
  
  // Fix method declarations that got mangled
  { find: /async (\w+)\(([^)]*)\) \{/g, replace: 'async $1($2) {' },
  
  // Fix class method declarations
  { find: /(\w+)\(([^)]*)\) \{/g, replace: '$1($2) {' },
  
  // Fix object property syntax errors - more specific patterns
  { find: /return \{ success: false, (\w+): (.+?), \(error as any\): \(error as any\)\.message \}/g, 
    replace: 'return { success: false, $1: $2, error: (error as any).message }' },
    
  // Fix class property initialization
  { find: /constructor\(\) \{/g, replace: 'constructor() {' },
];

fixes.forEach(fix => {
  const newContent = content.replace(fix.find, fix.replace);
  if (newContent !== content) {
    content = newContent;
    console.log('Applied fix:', fix.find.toString());
  }
});

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ NotificationService.ts fixed');

// Check if it compiles now
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit src/services/NotificationService.ts', { 
    encoding: 'utf8', 
    stdio: 'ignore' 
  });
  console.log('✅ NotificationService.ts now compiles successfully!');
} catch (error) {
  console.log('⚠️  Still has some compilation errors, checking...');
  try {
    const output = execSync('npx tsc --noEmit src/services/NotificationService.ts 2>&1 || true', { encoding: 'utf8' });
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));
    console.log(`Remaining errors: ${errorLines.length}`);
    if (errorLines.length < 10) {
      errorLines.forEach(line => console.log(line));
    }
  } catch (e) {
    console.log('Error checking compilation');
  }
}