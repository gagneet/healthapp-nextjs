#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing JSX syntax errors...');

// Get TypeScript errors
let tscOutput;
try {
  tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
} catch (error) {
  tscOutput = error.stdout || error.output ? error.output.join('') : '';
}
const lines = tscOutput.split('\n');

const jsxErrors = lines.filter(line => 
  line.includes('TS1003') || 
  line.includes('TS1382') || 
  line.includes('TS17002') ||
  line.includes('TS1005') ||
  line.includes('TS1128') ||
  line.includes('TS1109')
);
console.log(`Found ${jsxErrors.length} JSX syntax errors to fix`);

const fileChanges = new Map();

// Patterns to fix
const fixes = [
  // Fix malformed JSX expressions like (span || 0)(className || 0)
  {
    pattern: /\((\w+) \|\| 0\)\((\w+) \|\| 0\)/g,
    replacement: '<$1 $2'
  },
  // Fix malformed closing JSX like </div ?? null>
  {
    pattern: /<\/\((\w+) \?\? null\)>/g,
    replacement: '</$1>'
  },
  // Fix malformed opening JSX like <(div ?? null)>
  {
    pattern: /<\((\w+) \?\? null\)>/g,
    replacement: '<$1>'
  },
  // Fix malformed JSX attributes like className={`(text || 0)-(sm || 0)`}
  {
    pattern: /className=\{\`\(([^)]+)\)\`\}/g,
    replacement: 'className={`$1`}'
  },
  // Fix parentheses around JSX elements
  {
    pattern: /\(([A-Z]\w+) \|\| 0\)/g,
    replacement: '$1'
  }
];

jsxErrors.forEach(errorLine => {
  const match = errorLine.match(/^(.+)\((\d+),(\d+)\):/);
  if (!match) return;
  
  const [, filePath, lineNum] = match;
  const lineNumber = parseInt(lineNum);
  
  if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) return;
  
  if (!fileChanges.has(filePath)) {
    fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8').split('\n'));
  }
  
  const fileLines = fileChanges.get(filePath);
  if (lineNumber > 0 && lineNumber <= fileLines.length) {
    let line = fileLines[lineNumber - 1];
    let originalLine = line;
    
    // Apply all fixes
    fixes.forEach(fix => {
      line = line.replace(fix.pattern, fix.replacement);
    });
    
    // Additional specific fixes
    // Fix deliveryResult.(sms as any).error patterns
    line = line.replace(/(\w+)\.\((\w+) as any\)/g, '$1.$2');
    
    // Fix malformed boolean expressions in JSX
    line = line.replace(/\{[^}]*\|\| 0[^}]*\}/g, (match) => {
      // If it looks like className or other attributes, clean it up
      if (match.includes('className') || match.includes('style')) {
        return match.replace(/ \|\| 0/g, '');
      }
      return match;
    });
    
    if (line !== originalLine) {
      fileLines[lineNumber - 1] = line;
      console.log(`Fixed JSX syntax in ${filePath}:${lineNumber}`);
    }
  }
});

// Write changes back to files
let filesFixed = 0;
for (const [filePath, lines] of fileChanges.entries()) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  filesFixed++;
}

console.log(`✅ Fixed JSX syntax in ${filesFixed} files`);

// Check results
try {
  const newTscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
  console.log('No TypeScript errors remaining!');
} catch (error) {
  const errorOutput = error.stdout || error.output ? error.output.join('') : '';
  const newErrorCount = errorOutput.split('\n').filter(line => line.includes('error TS')).length;
  console.log(`Remaining errors: ${newErrorCount}`);
}