'use client'

export const dynamic = 'force-dynamic'




/**
 * Demo Page - Healthcare Management Platform
 */

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Healthcare Management Platform Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of healthcare management with our comprehensive platform 
            designed for doctors, patients, and healthcare providers.
          </p>
        </div>

        {/* Demo Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold ml-4">Patient Management</h3>
            </div>
            <p className="text-gray-600">
              Comprehensive patient records, medical history, and care plan management.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h10a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold ml-4">Medication Tracking</h3>
            </div>
            <p className="text-gray-600">
              Real-time medication adherence monitoring and automatic reminders.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 4v6m-4-6l8 8" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold ml-4">Vital Signs Monitoring</h3>
            </div>
            <p className="text-gray-600">
              Continuous monitoring of patient vitals with alert systems.
            </p>
          </Card>
        </div>

        {/* User Role Demos */}
        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Explore by User Role</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white p-4 rounded-lg mb-4">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Doctor Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Manage patients, prescriptions, and appointments
              </p>
              <Link href="/dashboard/doctor">
                <Button variant="outline" className="w-full">
                  View Doctor Demo
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white p-4 rounded-lg mb-4">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Patient Portal</h3>
              <p className="text-gray-600 mb-4">
                Track medications, vitals, and appointments
              </p>
              <Link href="/dashboard/patient">
                <Button variant="outline" className="w-full">
                  View Patient Demo
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white p-4 rounded-lg mb-4">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-3a1 1 0 011-1h1a1 1 0 011 1v3m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Hospital Admin</h3>
              <p className="text-gray-600 mb-4">
                Manage healthcare providers and operations
              </p>
              <Link href="/dashboard/admin">
                <Button variant="outline" className="w-full">
                  View Admin Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of healthcare providers using our platform to improve patient outcomes.
          </p>
          <div className="space-x-4">
            <Link href="/auth/register">
              <Button size="lg">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
