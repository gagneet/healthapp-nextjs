# Technology Stack & Build System

## Core Technologies

- **Framework**: Next.js 14 with App Router (full-stack architecture)
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Prisma ORM v6+
- **Authentication**: Auth.js v5 (NextAuth.js v5) with PrismaAdapter and database sessions
- **Styling**: Tailwind CSS with custom healthcare color palette
- **UI Components**: Custom components with Headless UI and Heroicons
- **State Management**: React Context API with custom providers
- **Validation**: Zod schemas for all healthcare data
- **Testing**: Jest with TypeScript support

## Key Libraries

- **Database**: `@prisma/client`, `pg` (PostgreSQL driver)
- **Authentication**: `next-auth@5.0.0-beta`, `@auth/prisma-adapter`
- **UI/UX**: `@headlessui/react`, `@heroicons/react`, `framer-motion`
- **Forms**: `react-hook-form`, `@hookform/resolvers`
- **Medical**: `@react-three/fiber` (3D body mapping), `@daily-co/daily-react` (video consultations)
- **Charts**: `recharts` for medical data visualization
- **Utilities**: `date-fns`, `clsx`, `tailwind-merge`

## Environment Requirements

- **Node.js**: 22+ LTS (required for Auth.js v5 and ES modules)
- **PostgreSQL**: 17+ (or Docker containerized setup)
- **Docker**: Required for production deployment with Docker Swarm

## Common Commands

### Development

```bash
npm run dev                    # Start development server (port 3002)
npm run build                  # Build production bundle
npm run start                  # Start production server
npm run lint                   # Auto-fix ESLint issues
npm run type-check             # Full TypeScript validation via Next.js build
```

### Database Management (Prisma)

```bash
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations in production
npx prisma db seed            # Seed database with healthcare data
npx prisma studio             # Open database GUI
```

### Testing

```bash
npm test                      # Run Jest test suite
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report
```

### Deployment (Universal Scripts)

```bash
./scripts/deploy.sh dev deploy --migrate --seed    # Local development
./scripts/deploy.sh test deploy --migrate --seed   # Test environment
./scripts/deploy.sh prod deploy --domain <url>     # Production deployment
```

## Build Configuration

- **TypeScript**: Strict mode with path aliases (`@/*` for root imports)
- **Next.js**: Standalone output for Docker deployment, dynamic rendering for healthcare data
- **ESLint**: Next.js recommended rules with healthcare-specific overrides
- **Tailwind**: Custom healthcare color palette with medical-specific utilities
