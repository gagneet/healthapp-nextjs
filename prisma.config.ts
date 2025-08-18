// prisma.config.ts - Modern Prisma configuration for v7+ compatibility
import { Config } from '@prisma/client/runtime/library'

const config: Config = {
  seed: {
    script: 'npm run seed'
  }
}

export default config