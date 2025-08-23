const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('Available Prisma client properties (first 30):');
console.log(Object.getOwnPropertyNames(prisma)
  .filter(name => !name.startsWith('$'))
  .sort()
  .slice(0, 30)
);

// Cleanup
prisma.$disconnect();