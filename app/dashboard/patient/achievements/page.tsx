'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { TrophyIcon } from '@heroicons/react/24/outline'

interface GamificationData {
  profile?: {
    totalPoints: number
    currentLevel: number
    medicationStreak: number
    vitalsStreak: number
  } | null
  badges: Array<{
    id: string
    badgeName: string
    badgeDescription?: string | null
    pointsAwarded: number
    awardedDate: string
  }>
  challenges: Array<{
    id: string
    challengeName: string
    targetValue: number
    currentProgress: number
    isCompleted: boolean
    endDate: string
  }>
}

export default function PatientAchievementsPage() {
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/gamification')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load achievements')
      }
      setData(result.payload?.data || null)
    } catch (err) {
      console.error('Failed to load achievements:', err)
      setError('Unable to load achievements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-blue-600 hover:text-blue-700">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrophyIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Level: {data?.profile?.currentLevel ?? 1}</p>
        <p className="text-sm text-gray-600">Points: {data?.profile?.totalPoints ?? 0}</p>
        <p className="text-sm text-gray-600">Medication streak: {data?.profile?.medicationStreak ?? 0} days</p>
      </div>

      <div className="grid gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Badges</h2>
          {data?.badges?.length ? (
            <ul className="space-y-2">
              {data.badges.map((badge) => (
                <li key={badge.id} className="text-sm text-gray-600">
                  {badge.badgeName} — {badge.pointsAwarded} pts
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No badges earned yet.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Challenges</h2>
          {data?.challenges?.length ? (
            <ul className="space-y-2">
              {data.challenges.map((challenge) => (
                <li key={challenge.id} className="text-sm text-gray-600">
                  {challenge.challengeName}: {challenge.currentProgress}/{challenge.targetValue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No active challenges.</p>
          )}
        </div>
      </div>
    </div>
  )
}
