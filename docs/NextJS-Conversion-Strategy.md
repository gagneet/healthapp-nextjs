# Next.js Conversion Strategy

## Overview
This document outlines the strategy for converting the healthcare adherence management platform backend to work seamlessly with Next.js, implementing modern full-stack architecture patterns while maintaining HIPAA compliance and security standards.

## Current Architecture Analysis

### Existing Backend Structure
```
src/
├── config/          # Database and app configuration
├── controllers/     # Route handlers
├── middleware/      # Authentication, validation, HIPAA
├── models/          # Sequelize models (PostgreSQL)
├── routes/          # Express routes
├── services/        # Business logic
├── utils/           # Helper functions
└── server.js        # Express server entry point
```

### Target Next.js Architecture
```
healthapp-nextjs/
├── app/             # Next.js 13+ App Router
│   ├── api/         # API routes (replaces Express routes)
│   ├── (dashboard)/ # Dashboard layout group
│   ├── (auth)/      # Authentication layout group
│   └── globals.css  # Global styles
├── components/      # React components
├── lib/             # Utilities and configurations
│   ├── auth/        # Authentication logic
│   ├── db/          # Database models and connections
│   ├── middleware/  # Next.js middleware
│   └── utils/       # Helper functions
├── types/           # TypeScript type definitions
└── middleware.ts    # Next.js middleware entry
```

## Conversion Strategy

### Phase 1: Foundation Setup (2-3 weeks)

#### 1.1 Next.js Project Initialization
```bash
# Create Next.js project with TypeScript
npx create-next-app@latest healthapp-nextjs --typescript --tailwind --eslint --app

# Install additional dependencies
npm install @next-auth/prisma-adapter
npm install sequelize pg pg-hstore
npm install @types/node @types/pg
npm install zod
npm install @hookform/resolvers
npm install react-hook-form
npm install @radix-ui/react-*  # UI components
npm install lucide-react       # Icons
```

#### 1.2 Environment Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['sequelize']
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    HIPAA_ENCRYPTION_KEY: process.env.HIPAA_ENCRYPTION_KEY
  }
}

module.exports = nextConfig
```

#### 1.3 Database Integration
```typescript
// lib/db/connection.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
```

### Phase 2: API Route Migration (3-4 weeks)

#### 2.1 Convert Express Routes to Next.js API Routes

**Before (Express):**
```javascript
// routes/patients.js
router.get('/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**After (Next.js API Route):**
```typescript
// app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Patient } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patient = await Patient.findByPk(params.id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 2.2 API Route Structure
```
app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── patients/
│   ├── route.ts                    # GET /api/patients, POST /api/patients
│   ├── [id]/route.ts              # GET, PUT, DELETE /api/patients/[id]
│   └── [id]/adherence/route.ts    # GET /api/patients/[id]/adherence
├── doctors/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── patients/route.ts
├── prescriptions/
│   ├── route.ts
│   └── [id]/route.ts
└── notifications/
    ├── route.ts
    └── [id]/route.ts
```

#### 2.3 Middleware Conversion
```typescript
// middleware.ts (Next.js middleware)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  async function middleware(request: NextRequest) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    // HIPAA audit logging
    if (pathname.startsWith('/api/')) {
      await logHIPAAAccess(request, token);
    }

    // Role-based access control
    if (pathname.startsWith('/api/admin')) {
      if (token?.role !== 'SYSTEM_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
};
```

### Phase 3: Authentication Integration (2-3 weeks)

#### 3.1 NextAuth.js Setup
```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await User.findOne({
          where: { email: credentials.email }
        });

        if (!user || !await bcrypt.compare(credentials.password, user.password_hash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.getFullName(),
          role: user.role,
          organizationId: user.organization_id
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as string;
      session.user.organizationId = token.organizationId as string;
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60 // 8 hours for HIPAA compliance
  }
};
```

#### 3.2 Protected Route Components
```typescript
// components/ProtectedRoute.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { USER_ROLES } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  capability?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  capability 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push('/unauthorized');
      return;
    }

    // Check provider capabilities if specified
    if (capability) {
      // Implementation would check provider capabilities
    }
  }, [session, status, router, allowedRoles, capability]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

### Phase 4: Frontend Integration (4-5 weeks)

#### 4.1 Dashboard Structure
```typescript
// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 4.2 Server Components for Data Fetching
```typescript
// app/(dashboard)/patients/page.tsx
import { Patient } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PatientList from '@/components/patients/PatientList';

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  
  // Server-side data fetching
  const patients = await Patient.findAll({
    where: {
      organization_id: session?.user.organizationId
    },
    include: ['user', 'primaryCareDoctor', 'primaryCareHSP']
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Patients</h1>
      <PatientList patients={patients} />
    </div>
  );
}
```

#### 4.3 Client Components for Interactivity
```typescript
// components/patients/PatientList.tsx
'use client';

import { useState } from 'react';
import { Patient } from '@/types';
import PatientCard from './PatientCard';
import SearchFilter from './SearchFilter';

interface PatientListProps {
  patients: Patient[];
}

export default function PatientList({ patients }: PatientListProps) {
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = patients.filter(patient =>
      patient.user.first_name.toLowerCase().includes(term.toLowerCase()) ||
      patient.user.last_name.toLowerCase().includes(term.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  return (
    <div>
      <SearchFilter onSearch={handleSearch} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredPatients.map(patient => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>
    </div>
  );
}
```

### Phase 5: Advanced Features (3-4 weeks)

#### 5.1 Server Actions for Forms
```typescript
// lib/actions/patient-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { Patient } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional()
});

export async function createPatient(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['DOCTOR', 'HSP', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const validatedFields = createPatientSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    dateOfBirth: formData.get('dateOfBirth')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    };
  }

  try {
    // Create user first
    const user = await User.create({
      email: validatedFields.data.email,
      first_name: validatedFields.data.firstName,
      last_name: validatedFields.data.lastName,
      phone: validatedFields.data.phone,
      date_of_birth: validatedFields.data.dateOfBirth,
      role: 'PATIENT',
      organization_id: session.user.organizationId
    });

    // Create patient record
    const patient = await Patient.create({
      user_id: user.id,
      organization_id: session.user.organizationId
    });

    revalidatePath('/patients');
    return { success: true, patientId: patient.id };
  } catch (error) {
    return { errors: { _form: 'Failed to create patient' } };
  }
}
```

#### 5.2 Real-time Features with WebSockets
```typescript
// lib/websocket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';

export function initializeWebSocket(server: any) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-organization', (organizationId) => {
      socket.join(`org-${organizationId}`);
    });

    socket.on('medication-taken', (data) => {
      // Broadcast to care team
      socket.to(`org-${data.organizationId}`).emit('adherence-update', data);
    });

    socket.on('critical-alert', (data) => {
      // Broadcast critical alerts to all providers
      socket.to(`org-${data.organizationId}`).emit('critical-alert', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}
```

### Phase 6: Testing and Optimization (2-3 weeks)

#### 6.1 Testing Strategy
```typescript
// __tests__/api/patients.test.ts
import { GET } from '@/app/api/patients/route';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: '1', role: 'DOCTOR', organizationId: 'org-1' }
  }))
}));

describe('/api/patients', () => {
  it('should return patients for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/patients');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

#### 6.2 Performance Optimization
```typescript
// app/(dashboard)/patients/loading.tsx
export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Migration Benefits

### Technical Benefits
- **Server-Side Rendering**: Better SEO and initial load performance
- **API Routes**: Simplified backend architecture
- **TypeScript**: Better type safety and developer experience
- **React Server Components**: Reduced JavaScript bundle size
- **Edge Runtime**: Better global performance
- **Built-in Optimization**: Image optimization, font optimization

### Healthcare-Specific Benefits
- **HIPAA Compliance**: Built-in security features
- **Real-time Updates**: WebSocket integration for critical alerts
- **Mobile Responsive**: Better patient engagement
- **Offline Capabilities**: Service workers for mobile apps
- **Performance**: Critical for emergency situations

## Migration Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Foundation | 2-3 weeks | Next.js setup, DB integration |
| 2. API Migration | 3-4 weeks | All API routes converted |
| 3. Authentication | 2-3 weeks | NextAuth.js integration |
| 4. Frontend | 4-5 weeks | Dashboard and components |
| 5. Advanced Features | 3-4 weeks | Server actions, WebSockets |
| 6. Testing | 2-3 weeks | Testing and optimization |
| **Total** | **16-22 weeks** | **Complete Next.js migration** |

## Success Metrics

- ✅ All API endpoints migrated and functional
- ✅ Authentication and authorization working
- ✅ HIPAA compliance maintained
- ✅ Performance improved (Core Web Vitals)
- ✅ TypeScript coverage > 95%
- ✅ Test coverage > 80%
- ✅ SEO score > 90
- ✅ Accessibility score > 95

This Next.js conversion strategy provides a comprehensive approach to modernizing the healthcare platform while maintaining security and compliance standards.