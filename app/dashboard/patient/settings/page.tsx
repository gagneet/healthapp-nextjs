'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface UserSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    medication_reminders: boolean
    appointment_reminders: boolean
    vital_reminders: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private' | 'doctors_only'
    share_data_research: boolean
    allow_marketing: boolean
  }
  security: {
    two_factor_enabled: boolean
    login_notifications: boolean
    session_timeout: number
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    date_format: string
    measurement_units: 'metric' | 'imperial'
  }
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notifications')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.payload?.data || null)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updatedData: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/patient/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })
      if (response.ok) {
        await fetchSettings()
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CogIcon className="w-8 h-8 mr-3 text-gray-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and privacy settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'notifications', name: 'Notifications', icon: BellIcon },
              { id: 'privacy', name: 'Privacy', icon: EyeIcon },
              { id: 'security', name: 'Security', icon: ShieldCheckIcon },
              { id: 'preferences', name: 'Preferences', icon: CogIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">General Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Email Notifications</h5>
                      <p className="text-sm text-gray-500">Receive general updates via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.email}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, email: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">SMS Notifications</h5>
                      <p className="text-sm text-gray-500">Receive text message alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.sms}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, sms: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Push Notifications</h5>
                      <p className="text-sm text-gray-500">Receive push notifications on your devices</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.push}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, push: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Health Reminders</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Medication Reminders</h5>
                      <p className="text-sm text-gray-500">Get reminded when it's time to take your medication</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.medication_reminders}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, medication_reminders: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Appointment Reminders</h5>
                      <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.appointment_reminders}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, appointment_reminders: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Vital Sign Reminders</h5>
                      <p className="text-sm text-gray-500">Get reminded to record your vital signs</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings?.notifications.vital_reminders}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings?.notifications!, vital_reminders: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Profile Visibility</h4>
                <p className="text-sm text-gray-500 mb-4">Control who can see your profile information</p>
                <select
                  value={settings?.privacy.profile_visibility}
                  onChange={(e) => updateSettings({
                    privacy: { ...settings?.privacy!, profile_visibility: e.target.value as any }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private - Only you</option>
                  <option value="doctors_only">Doctors Only - Your healthcare providers</option>
                  <option value="public">Public - Anyone in the platform</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Share Data for Research</h4>
                  <p className="text-sm text-gray-500">Allow anonymized health data to be used for medical research</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.privacy.share_data_research}
                  onChange={(e) => updateSettings({
                    privacy: { ...settings?.privacy!, share_data_research: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Marketing Communications</h4>
                  <p className="text-sm text-gray-500">Receive information about new features and health tips</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.privacy.allow_marketing}
                  onChange={(e) => updateSettings({
                    privacy: { ...settings?.privacy!, allow_marketing: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.security.two_factor_enabled}
                    onChange={(e) => updateSettings({
                      security: { ...settings?.security!, two_factor_enabled: e.target.checked }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                {settings?.security.two_factor_enabled && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-700">
                      Two-factor authentication is enabled. Use your authenticator app to generate codes.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Login Notifications</h4>
                  <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.security.login_notifications}
                  onChange={(e) => updateSettings({
                    security: { ...settings?.security!, login_notifications: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Session Timeout</h4>
                <p className="text-sm text-gray-500 mb-4">Automatically log out after inactivity</p>
                <select
                  value={settings?.security.session_timeout}
                  onChange={(e) => updateSettings({
                    security: { ...settings?.security!, session_timeout: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Change Password
                </button>

                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Preferences</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Theme</h4>
                <select
                  value={settings?.preferences.theme}
                  onChange={(e) => updateSettings({
                    preferences: { ...settings?.preferences!, theme: e.target.value as any }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Language</h4>
                <select
                  value={settings?.preferences.language}
                  onChange={(e) => updateSettings({
                    preferences: { ...settings?.preferences!, language: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Timezone</h4>
                <select
                  value={settings?.preferences.timezone}
                  onChange={(e) => updateSettings({
                    preferences: { ...settings?.preferences!, timezone: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Measurement Units</h4>
                <select
                  value={settings?.preferences.measurement_units}
                  onChange={(e) => updateSettings({
                    preferences: { ...settings?.preferences!, measurement_units: e.target.value as any }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="imperial">Imperial (lbs, °F)</option>
                  <option value="metric">Metric (kg, °C)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-red-900 mb-4">Delete Account</h3>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}