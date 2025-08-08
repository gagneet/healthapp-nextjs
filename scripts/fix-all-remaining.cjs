#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all remaining critical issues...');

// Define comprehensive fixes for known problematic files
const fileFixes = {
  'app/dashboard/doctor/patients/page.tsx': [
    {
      find: /<<span className=\{\`[^`]*\`\}>/g,
      replace: '<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">'
    },
    {
      find: /<div>\(Last[^<]*<\/div>/g,
      replace: '<div>Last visit: {patient.last_visit ? formatDate(patient.last_visit) : "No previous visits"}</div>'
    },
    {
      find: /<div>\(Next[^<]*<\/div>/g,
      replace: '<div>Next appointment: {patient.next_appointment ? formatDate(patient.next_appointment) : "No upcoming appointments"}</div>'
    }
  ],
  'app/dashboard/doctor/patients/[id]/page.tsx': [
    {
      find: /<<div className=\{\`[^`]*\`\}>/g,
      replace: '<div className="p-3 rounded-full bg-green-100">'
    }
  ],
  'app/dashboard/hospital/patients/page.tsx': [
    {
      find: /<<span className=\{\`[^`]*\`\}>/g,
      replace: '<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">'
    }
  ],
  'src/services/PatientAccessService.ts': [
    {
      find: /deliveryResult\.\(sms as any\)\.error/g,
      replace: 'deliveryResult.sms.error'
    },
    {
      find: /deliveryResult\.\(email as any\)\.error/g,
      replace: 'deliveryResult.email.error'
    }
  ],
  'src/controllers/symptomsDiagnosisController.ts': [
    {
      find: /\.sort\(\(\(a as any\), \(b \(a as any\)s \(a as any\)ny\)\) => \(b \(a as any\)s \(a as any\)ny\)\.m\(a as any\)tchedSymptoms - \(a as any\)\.m\(a as any\)tchedSymptoms\)/g,
      replace: '.sort((a, b) => (b as any).matchedSymptoms - (a as any).matchedSymptoms)'
    }
  ],
  'scripts/migrate-to-postgresql.ts': [
    {
      find: /\(\(error as any\) as any\): \(\(error as any\) as any\)\.message/g,
      replace: 'error: (error as any).message'
    },
    {
      find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g,
      replace: 'error: (error as any).message'
    }
  ],
  'src/middleware/logger.ts': [
    {
      find: /\(\(error as any\)\): \(\(error as any\)\.message\)/g,
      replace: 'error: (error as any).message'
    }
  ]
};

let totalFixes = 0;

Object.entries(fileFixes).forEach(([filePath, fixes]) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileModified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.find, fix.replace);
      if (newContent !== content) {
        content = newContent;
        fileModified = true;
        totalFixes++;
      }
    });
    
    if (fileModified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

// Also fix common patterns across all TypeScript files
const globFiles = require('glob').globSync('**/*.{ts,tsx}', { 
  ignore: ['node_modules/**', 'dist/**', '.next/**'] 
});

globFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix common patterns
  const patterns = [
    // Fix double casting errors
    { find: /\(\(([^)]+)\) as any\) as any/g, replace: '($1 as any)' },
    // Fix nested parentheses in as any
    { find: /\(\(([^)]+) as any\) as any\)/g, replace: '($1 as any)' },
    // Fix syntax errors in error objects  
    { find: /\{[^}]*\(\(error as any\)\):[^}]*\}/g, replace: '{ error: (error as any).message }' }
  ];
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.find, pattern.replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      totalFixes++;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log(`✅ Applied ${totalFixes} comprehensive fixes`);

// Check final results
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'ignore' });
  console.log('🎉 No TypeScript errors remaining!');
} catch (error) {
  try {
    const errorOutput = execSync('npx tsc --noEmit 2>&1 || true', { encoding: 'utf8' });
    const errorCount = errorOutput.split('\n').filter(line => line.includes('error TS')).length;
    console.log(`📊 Final error count: ${errorCount}`);
  } catch (e) {
    console.log('Checking final error count...');
  }
}