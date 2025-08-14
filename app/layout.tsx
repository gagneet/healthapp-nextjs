import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

// Force all pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { SessionProvider } from '@/components/providers/SessionProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalErrorHandler from '@/components/GlobalErrorHandler'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: 'Healthcare Management Platform',
  description: 'Modern healthcare management platform for doctors, patients, and healthcare providers',
  keywords: 'healthcare, medical, patients, doctors, medication adherence, appointments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={`script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3002'} ${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005'};`} />
      </head>
      <body className={`${inter.className} h-full bg-gray-50`}>
        <ErrorBoundary>
          <GlobalErrorHandler />
          <SessionProvider>
            <AuthProvider>
              <div id="root" className="h-full">
                {children}
              </div>
              <Toaster 
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#22c55e',
                    },
                  },
                  error: {
                    style: {
                      background: '#ef4444',
                    },
                  },
                }}
              />
            </AuthProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}