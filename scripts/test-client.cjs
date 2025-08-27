const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('First 20 client properties (after schema update):');
const props = Object.getOwnPropertyNames(prisma)
  .filter(name => !name.startsWith('$'))
  .sort()
  .slice(0, 20);

props.forEach(prop => console.log(`  prisma.${prop}`));

console.log('\nLooking for User/Patient models:');
const all = Object.getOwnPropertyNames(prisma)
  .filter(name => !name.startsWith('$'));

const userPatientModels = all.filter(p => 
  p.toLowerCase().includes('user') || 
  p.toLowerCase().includes('patient')
);
console.log('User/Patient related models:', userPatientModels);

console.log('\nAll models A-M:');
all.filter(p => p >= 'A' && p <= 'M').forEach(p => console.log(`  prisma.${p}`));

prisma.$disconnect();