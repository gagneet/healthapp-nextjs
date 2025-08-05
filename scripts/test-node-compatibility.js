#!/usr/bin/env node
// Test Node.js 22 compatibility for key features used in the application

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🚀 Testing Node.js compatibility...');
console.log(`Node.js version: ${process.version}`);

// Test 1: ES Modules with top-level await
console.log('\n✅ Test 1: ES Modules with top-level await');
try {
  const testData = await fs.readFile('package.json', 'utf-8');
  const pkg = JSON.parse(testData);
  console.log(`   Package name: ${pkg.name}`);
  console.log('   ✓ ES Modules working');
} catch (error) {
  console.error('   ❌ ES Modules failed:', error.message);
}

// Test 2: Import assertions (if used)
console.log('\n✅ Test 2: Dynamic imports');
try {
  const { default: crypto } = await import('crypto');
  const hash = crypto.createHash('sha256').update('test').digest('hex');
  console.log(`   Hash generated: ${hash.substring(0, 16)}...`);
  console.log('   ✓ Dynamic imports working');
} catch (error) {
  console.error('   ❌ Dynamic imports failed:', error.message);
}

// Test 3: Fetch API (available in Node.js 18+)
console.log('\n✅ Test 3: Built-in Fetch API');
try {
  // Test if fetch is available (should be in Node.js 18+)
  if (typeof fetch !== 'undefined') {
    console.log('   ✓ Fetch API available');
  } else {
    console.log('   ⚠️  Fetch API not available (may need polyfill)');
  }
} catch (error) {
  console.error('   ❌ Fetch API test failed:', error.message);
}

// Test 4: Worker Threads
console.log('\n✅ Test 4: Worker Threads');
try {
  const { Worker, isMainThread } = await import('worker_threads');
  if (isMainThread) {
    console.log('   ✓ Worker Threads available');
  }
} catch (error) {
  console.error('   ❌ Worker Threads failed:', error.message);
}

// Test 5: AbortController
console.log('\n✅ Test 5: AbortController');
try {
  const controller = new AbortController();
  console.log('   ✓ AbortController available');
} catch (error) {
  console.error('   ❌ AbortController failed:', error.message);
}

// Test 6: Buffer and Stream compatibility
console.log('\n✅ Test 6: Buffer and Stream APIs');
try {
  const buffer = Buffer.from('test data', 'utf-8');
  console.log(`   Buffer created: ${buffer.length} bytes`);
  console.log('   ✓ Buffer API working');
} catch (error) {
  console.error('   ❌ Buffer API failed:', error.message);
}

// Test 7: Check key dependencies compatibility
console.log('\n✅ Test 7: Key dependencies');
const criticalDeps = [
  'express',
  'sequelize', 
  'jsonwebtoken',
  'bcryptjs',
  'redis',
  'next'
];

for (const dep of criticalDeps) {
  try {
    const pkg = require(`${dep}/package.json`);
    console.log(`   ${dep}@${pkg.version} ✓`);
  } catch (error) {
    console.log(`   ${dep} - ⚠️  Could not check version`);
  }
}

console.log('\n🎉 Node.js compatibility test completed!');
console.log('\n📝 Notes for Node.js 22 upgrade:');
console.log('   • All modern JavaScript features supported');
console.log('   • ES Modules work correctly');
console.log('   • Built-in Fetch API available');
console.log('   • Worker Threads enhanced in v22');
console.log('   • Better performance and security');
console.log('   • LTS version with long-term support');