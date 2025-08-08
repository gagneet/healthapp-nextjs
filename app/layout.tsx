import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
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
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://192.168.0.148:3002 http://192.168.0.148:3005;" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50`}>
        <ErrorBoundary>
          <GlobalErrorHandler />
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
        </ErrorBoundary>
      </body>
    </html>
  )
}