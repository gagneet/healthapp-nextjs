/**
 * Prisma Configuration File
 * Replaces deprecated package.json#prisma configuration
 * https://pris.ly/prisma-config
 */

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  
  // Seed configuration
  seed: {
    command: 'node lib/seed.cjs'
  },

  // Generator configuration
  generate: {
    // Enable preview features if needed
    previewFeatures: [],
    
    // Custom output directory (optional)
    // output: './generated/client'
  }
});