'use client'

// Force dynamic rendering for auth pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon, HeartIcon } from '@heroicons/react/24/outline'
import { signIn, useSession } from 'next-auth/react'
import { UserRole } from '@/types/auth'
import toast from 'react-hot-toast'
import { createLogger } from '@/lib/logger'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const roleConfig = {
  doctor: {
    title: 'Doctor Portal',
    subtitle: 'Access your patient management dashboard',
    icon: '👨‍⚕️',
    redirectPath: '/dashboard/doctor',
  },
  hsp: {
    title: 'Health Service Provider Portal',
    subtitle: 'Support patient care and wellness',
    icon: '👩‍⚕️',
    redirectPath: '/dashboard/hsp',
  },
  hospital_admin: {
    title: 'Hospital Administrator Portal',
    subtitle: 'Manage your healthcare organization',
    icon: '🏥',
    redirectPath: '/dashboard/hospital',
  },
  patient: {
    title: 'Patient Portal',
    subtitle: 'Track your health and medications',
    icon: '🧑‍🦽',
    redirectPath: '/dashboard/patient',
  },
  system_admin: {
    title: 'System Administrator Portal',
    subtitle: 'Manage the entire platform',
    icon: '⚙️',
    redirectPath: '/dashboard/admin',
  },
}

const logger = createLogger('LoginPage')

// Function to get redirect path based on user role
const getRedirectPathForRole = (role: string): string => {
  switch (role) {
    case 'DOCTOR':
      return '/dashboard/doctor'
    case 'PATIENT': 
      return '/dashboard/patient'
    case 'HOSPITAL_ADMIN':
      return '/dashboard/hospital'
    case 'SYSTEM_ADMIN':
    case 'ADMIN':
      return '/dashboard/admin'
    case 'HSP':
      return '/dashboard/hsp'
    default:
      return '/dashboard'
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const roleParam = searchParams.get('role') as keyof typeof roleConfig
  const config = roleConfig[roleParam] || {
    title: 'Login to the Health Care Application',
    subtitle: 'Access your healthcare dashboard',
    icon: '💚',
    redirectPath: '/dashboard',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember_me: false,
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
      const redirectPath = getRedirectPathForRole(session.user.role as UserRole)
      logger.debug('Auth state changed:', { isAuthenticated: !!session, userRole: session.user.role, redirectPath })
      logger.info('User is authenticated, redirecting to:', redirectPath)
      router.push(redirectPath)
    }
  }, [session, router])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    logger.debug('Login attempt with:', { email: data.email, redirectPath: config.redirectPath })
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      
      logger.debug('NextAuth signIn result:', result)
      
      if (result?.ok) {
        logger.info('Login successful')
        toast.success('Login successful!')
        // NextAuth will handle the session, and the useEffect above will redirect
      } else {
        logger.warn('Login failed:', result?.error)
        toast.error(result?.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      logger.error('Login error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <HeartIcon className="h-10 w-10 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">Healthcare Application</span>
          </Link>
          
          <div className="mb-6">
            <div className="text-6xl mb-4">{config.icon}</div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {config.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('remember_me')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href={`/auth/register${roleParam ? `?role=${roleParam}` : ''}`}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Demo Credentials - Only show after client hydration */}
        {isClient && process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Test Credentials</h3>
            <div className="text-xs text-yellow-700">
              <p><strong>Doctor:</strong> doctor@healthapp.com / T3mpP@ssw0rd2376!</p>
              <p><strong>Patient:</strong> patient@healthapp.com / T3mpP@ssw0rd2376!</p>
              <p><strong>Admin:</strong> gagneet@silverfoxtechnologies.com.au / T3mpP@ssw0rd2376!</p>
            </div>
          </div>
        )}

        {/* Security Notice - Only show after client hydration and for HTTP */}
        {isClient && window.location.protocol === 'http:' && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-orange-800 mb-2">Security Notice</h3>
            <p className="text-xs text-orange-700">
              For production use, ensure this application is served over HTTPS to secure password transmission.
              The browser may show security warnings when password fields are used over HTTP.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}