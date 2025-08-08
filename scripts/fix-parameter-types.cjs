#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Automated TypeScript Parameter Type Fixer');
console.log('============================================');

// Get all parameter type errors
console.log('📊 Analyzing TypeScript errors...');
const tscOutput = execSync('npx tsc --build tsconfig.backend.json 2>&1 || true', { encoding: 'utf8' });
const parameterErrors = tscOutput
  .split('\n')
  .filter(line => line.includes('Parameter') && line.includes('implicitly has an \'any\' type'))
  .map(line => {
    const match = line.match(/^(.+)\((\d+),(\d+)\):.+Parameter '(.+)' implicitly has an 'any' type/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]) - 1, // Convert to 0-based indexing
        column: parseInt(match[3]) - 1,
        parameter: match[4]
      };
    }
    return null;
  })
  .filter(Boolean);

console.log(`📋 Found ${parameterErrors.length} parameter type errors`);

// Group errors by file
const errorsByFile = parameterErrors.reduce((acc, error) => {
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
    
    // Sort errors by line number in descending order to avoid line shifting issues
    errors.sort((a, b) => b.line - a.line);
    
    let fileFixed = 0;
    for (const error of errors) {
      const line = lines[error.line];
      if (!line) continue;
      
      // Common parameter type patterns
      const patterns = [
        // Function parameters: functionName(param) -> functionName(param: any)
        { 
          regex: new RegExp(`\\b${error.parameter}\\b(?!:\\s*\\w)`), 
          replacement: `${error.parameter}: any` 
        },
        // Arrow function parameters: (param) => -> (param: any) =>
        { 
          regex: new RegExp(`\\(\\s*${error.parameter}\\s*\\)\\s*=>`), 
          replacement: `(${error.parameter}: any) =>` 
        },
        // Method parameters: method(param, -> method(param: any,
        { 
          regex: new RegExp(`\\b${error.parameter}\\b\\s*,`), 
          replacement: `${error.parameter}: any,` 
        },
        // Method parameters: method(param) -> method(param: any)
        { 
          regex: new RegExp(`\\b${error.parameter}\\b\\s*\\)`), 
          replacement: `${error.parameter}: any)` 
        }
      ];
      
      let fixed = false;
      for (const pattern of patterns) {
        if (pattern.regex.test(line) && !line.includes(`${error.parameter}: any`)) {
          lines[error.line] = line.replace(pattern.regex, pattern.replacement);
          fixed = true;
          fileFixed++;
          break;
        }
      }
      
      if (!fixed) {
        console.log(`  ⚠️  Could not auto-fix parameter '${error.parameter}' at line ${error.line + 1}`);
      }
    }
    
    if (fileFixed > 0) {
      // Write the fixed content back to file
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`  ✅ Fixed ${fileFixed} parameter types`);
      totalFixed += fileFixed;
    }
    
  } catch (err) {
    console.error(`  ❌ Error processing ${filePath}:`, err.message);
  }
}

console.log(`\n🎉 Total parameter types fixed: ${totalFixed}`);
console.log('\n📊 Checking remaining errors...');

// Check remaining error count
const newTscOutput = execSync('npx tsc --build tsconfig.backend.json 2>&1 || true', { encoding: 'utf8' });
const remainingErrors = newTscOutput.split('\n').filter(line => line.includes('error TS')).length;

console.log(`📉 Remaining TypeScript errors: ${remainingErrors}`);
console.log('✨ Parameter type fixing complete!');