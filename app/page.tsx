import Link from 'next/link'
import { ArrowRightIcon, HeartIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">AdhereLive</span>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/auth/login" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Modern Healthcare
              <span className="block text-blue-600">Management Platform</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
              Streamline patient care, improve medication adherence, and enhance healthcare outcomes 
              with our comprehensive digital health platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Your Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/demo" 
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View Demo
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Role Dashboard</h3>
              <p className="text-gray-600">
                Specialized dashboards for doctors, healthcare providers, hospital administrators, and patients.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <HeartIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Medication Adherence</h3>
              <p className="text-gray-600">
                Track medication compliance, send reminders, and monitor patient adherence in real-time.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">HIPAA Compliant</h3>
              <p className="text-gray-600">
                Enterprise-grade security with comprehensive audit trails and compliance features.
              </p>
            </div>
          </div>

          {/* User Type Cards */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Choose Your Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/auth/login?role=doctor" className="group">
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Doctor</h3>
                    <p className="text-sm text-gray-600">Manage patients and care plans</p>
                  </div>
                </div>
              </Link>

              <Link href="/auth/login?role=hsp" className="group">
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-green-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <span className="text-2xl">👩‍⚕️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Service Provider</h3>
                    <p className="text-sm text-gray-600">Support patient care delivery</p>
                  </div>
                </div>
              </Link>

              <Link href="/auth/login?role=hospital_admin" className="group">
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Hospital Admin</h3>
                    <p className="text-sm text-gray-600">Manage organization and staff</p>
                  </div>
                </div>
              </Link>

              <Link href="/auth/login?role=patient" className="group">
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-orange-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <span className="text-2xl">🧑‍🦽</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient</h3>
                    <p className="text-sm text-gray-600">Track health and medications</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <HeartIcon className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-xl font-bold">AdhereLive</span>
          </div>
          <p className="text-center text-gray-400 mt-4">
            © 2024 AdhereLive Healthcare Management Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}