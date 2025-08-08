#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing final critical build errors...');

const fixes = [
  // Fix doctorController.ts req.files issues
  {
    file: 'src/controllers/doctorController.ts',
    patterns: [
      { find: /req\.\(files as any\)/g, replace: '(req as any).files' },
      { find: /req\.\(files as any\)\.(\w+)/g, replace: '(req as any).files.$1' }
    ]
  },
  
  // Fix GeoLocationService.ts object property errors
  {
    file: 'src/services/GeoLocationService.ts',
    patterns: [
      { find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: 'error: (error as any).message' },
      { find: /, \(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: ', error: (error as any).message' }
    ]
  },
  
  // Fix logger.ts object property errors
  {
    file: 'src/middleware/logger.ts',
    patterns: [
      { find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: 'error: (error as any).message' },
      { find: /, \(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: ', error: (error as any).message' }
    ]
  },
  
  // Fix CacheService.ts syntax errors
  {
    file: 'src/services/CacheService.ts',
    patterns: [
      { find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: 'error: (error as any).message' },
      { find: /, \(\(error as any\)\): \(\(error as any\)\.message\)/g, replace: ', error: (error as any).message' }
    ]
  }
];

let totalFixes = 0;

fixes.forEach(fileConfig => {
  const filePath = path.join(process.cwd(), fileConfig.file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fileConfig.patterns.forEach(pattern => {
      const newContent = content.replace(pattern.find, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        totalFixes++;
        console.log(`Applied fix to ${fileConfig.file}:`, pattern.find.toString());
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${fileConfig.file}`);
    }
  } else {
    console.log(`⚠️  File not found: ${fileConfig.file}`);
  }
});

console.log(`✅ Applied ${totalFixes} fixes to critical files`);

// Check compilation
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit 2>/dev/null');
  console.log('🎉 All TypeScript files now compile successfully!');
} catch (error) {
  try {
    const output = execSync('npx tsc --noEmit 2>&1 || true', { encoding: 'utf8' });
    const errorCount = output.split('\n').filter(line => line.includes('error TS')).length;
    console.log(`📊 Remaining errors: ${errorCount}`);
    
    if (errorCount < 20) {
      console.log('\nRemaining errors:');
      output.split('\n')
        .filter(line => line.includes('error TS'))
        .slice(0, 10)
        .forEach(line => console.log(line));
    }
  } catch (e) {
    console.log('Error checking final compilation status');
  }
}