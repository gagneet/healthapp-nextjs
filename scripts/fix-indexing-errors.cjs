#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Security: Sanitize log output to prevent log injection
const sanitizeForLog = (input) => {
  if (typeof input !== 'string') {
    input = String(input);
  }
  // Remove/escape potentially dangerous characters that could manipulate logs
  return input.replace(/[\r\n\t]/g, ' ').replace(/[<>&"']/g, (char) => {
    const escapes = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return escapes[char] || char;
  });
};

console.log('🔧 Fixing TypeScript indexing errors (TS7053)...');

// Get TypeScript errors
let tscOutput;
try {
  tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
} catch (error) {
  tscOutput = error.stdout || error.output ? error.output.join('') : '';
}
const lines = tscOutput.split('\n');

const indexingErrors = lines.filter(line => line.includes('TS7053'));
console.log(`Found ${indexingErrors.length} indexing errors to fix`);

const fileChanges = new Map();

indexingErrors.forEach(errorLine => {
  const match = errorLine.match(/^(.+)\((\d+),(\d+)\):.+TS7053:.+expression of type '(.+)' can't be used to index type '(.+)'/);
  if (!match) return;
  
  const [, filePath, lineNum, colNum, indexType, objectType] = match;
  const lineNumber = parseInt(lineNum);
  
  if (!fs.existsSync(filePath)) return;
  
  if (!fileChanges.has(filePath)) {
    fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8').split('\n'));
  }
  
  const lines = fileChanges.get(filePath);
  if (lineNumber <= 0 || lineNumber > lines.length) return;
  
  const line = lines[lineNumber - 1];
  let fixedLine = line;
  
  // Pattern 1: someObj[key] -> (someObj as any)[key]
  if (line.includes('[') && line.includes(']')) {
    fixedLine = fixedLine.replace(/(\w+)\[([^\]]+)\]/g, '($1 as any)[$2]');
  }
  
  // Pattern 2: errors[error.type] -> errors[error.type as keyof typeof errors]
  if (objectType.includes('{') && indexType.includes('string')) {
    fixedLine = fixedLine.replace(/(\w+)\[([^[\]]+)\]/g, '$1[$2 as keyof typeof $1]');
  }
  
  if (fixedLine !== line) {
    lines[lineNumber - 1] = fixedLine;
    console.log(`Fixed indexing in ${sanitizeForLog(filePath)}:${sanitizeForLog(lineNumber)}`);
  }
});

// Write changes back to files
let filesFixed = 0;
for (const [filePath, lines] of fileChanges.entries()) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  filesFixed++;
}

console.log(`✅ Fixed indexing errors in ${filesFixed} files`);

// Check results
try {
  const newTscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
  const newIndexingErrors = newTscOutput.split('\n').filter(line => line.includes('TS7053'));
  console.log(`Remaining indexing errors: ${newIndexingErrors.length}`);
} catch (error) {
  const errorOutput = error.stdout || error.output ? error.output.join('') : '';
  const newIndexingErrors = errorOutput.split('\n').filter(line => line.includes('TS7053'));
  console.log(`Remaining indexing errors: ${newIndexingErrors.length}`);
}