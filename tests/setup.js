/**
 * Healthcare Management Platform - Test Setup (JavaScript)
 * Configures the testing environment for healthcare workflows
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://healthapp_user:pg_password@localhost:5434/healthapp_test?schema=public'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DAILY_API_KEY = 'test-api-key'

// Mock Next.js modules that might not be available in test environment
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}))

// Basic test environment setup

console.log('✅ Healthcare Test Setup Complete (Next.js Compatible)')