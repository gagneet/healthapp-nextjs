'use client'

export const dynamic = 'force-dynamic'




import { HeartIcon, StarIcon, UserIcon } from '@heroicons/react/24/outline'

export default function TestCleanPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Test Header */}
      <div className="bg-blue-600 text-white p-8 text-center">
        <HeartIcon className="h-12 w-12 mx-auto mb-4" />
        <h1 className="text-4xl font-bold">Test Clean Page</h1>
        <p className="mt-4 text-xl">Testing if CSS classes work properly</p>
      </div>

      {/* Test Grid */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <StarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Test Card 1</h3>
            <p className="text-gray-600">This is a test card to check layout</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Test Card 2</h3>
            <p className="text-gray-600">This is another test card</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <HeartIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Test Card 3</h3>
            <p className="text-gray-600">Third test card for layout testing</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="text-center">
          <div className="space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Test Button 1
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              Test Button 2
            </button>
          </div>
        </div>

        {/* Test Typography */}
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Typography Test</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This is a test paragraph to see if text alignment, spacing, and responsive design are working correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
