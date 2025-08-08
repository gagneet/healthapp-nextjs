#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing syntax errors caused by indexing fix...');

// Get TypeScript errors
let tscOutput;
try {
  tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
} catch (error) {
  tscOutput = error.stdout || error.output ? error.output.join('') : '';
}
const lines = tscOutput.split('\n');

const syntaxErrors = lines.filter(line => line.includes('TS1003') && line.includes('Identifier expected'));
console.log(`Found ${syntaxErrors.length} syntax errors to fix`);

const fileChanges = new Map();

syntaxErrors.forEach(errorLine => {
  const match = errorLine.match(/^(.+)\((\d+),(\d+)\):/);
  if (!match) return;
  
  const [, filePath, lineNum, colNum] = match;
  const lineNumber = parseInt(lineNum);
  
  if (!fs.existsSync(filePath)) return;
  
  if (!fileChanges.has(filePath)) {
    fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8').split('\n'));
  }
  
  const lines = fileChanges.get(filePath);
  if (lineNumber <= 0 || lineNumber > lines.length) return;
  
  const line = lines[lineNumber - 1];
  let fixedLine = line;
  
  // Fix the specific syntax error: responseData.(property as any) -> (responseData as any).property
  fixedLine = fixedLine.replace(/(\w+)\.\((\w+) as any\)/g, '($1 as any).$2');
  
  // Fix other similar patterns
  fixedLine = fixedLine.replace(/(\w+)\.\(([^)]+) as any\)/g, '($1 as any).$2');
  
  if (fixedLine !== line) {
    lines[lineNumber - 1] = fixedLine;
    console.log(`Fixed syntax in ${filePath}:${lineNumber}`);
  }
});

// Write changes back to files
let filesFixed = 0;
for (const [filePath, lines] of fileChanges.entries()) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  filesFixed++;
}

console.log(`✅ Fixed syntax errors in ${filesFixed} files`);

// Check results
try {
  const newTscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: process.cwd() });
  const newSyntaxErrors = newTscOutput.split('\n').filter(line => line.includes('TS1003'));
  console.log(`Remaining syntax errors: ${newSyntaxErrors.length}`);
} catch (error) {
  const errorOutput = error.stdout || error.output ? error.output.join('') : '';
  const newSyntaxErrors = errorOutput.split('\n').filter(line => line.includes('TS1003'));
  console.log(`Remaining syntax errors: ${newSyntaxErrors.length}`);
}