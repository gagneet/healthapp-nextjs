'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Remove non-existent imports

interface UserSettings {
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    appointment_reminders: boolean
    medication_alerts: boolean
    system_updates: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private' | 'colleagues_only'
    show_online_status: boolean
    allow_patient_messaging: boolean
  }
  preferences: {
    language: string
    timezone: string
    date_format: string
    time_format: '12h' | '24h'
    default_consultation_duration: number
  }
  security: {
    two_factor_enabled: boolean
    login_notifications: boolean
    session_timeout: number
  }
}

interface ActiveSession {
  sessionId: string
  createdAt: string
  deviceInfo: {
    ip: string
    userAgent: string
  }
  isCurrentSession: boolean
}

export default function DoctorSettingsPage() {
  // Remove useAuth since it doesn't exist
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchSettings()
    fetchActiveSessions()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch real user settings from database
      const response = await fetch('/api/user/settings', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payload?.data?.settings) {
          setSettings(data.payload.data.settings);
        } else {
          throw new Error('Invalid settings response format');
        }
      } else {
        throw new Error('Failed to fetch settings from server');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      
      // Fallback to default settings if API fails
      const defaultSettings: UserSettings = {
        notifications: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          appointment_reminders: true,
          medication_alerts: true,
          system_updates: false
        },
        privacy: {
          profile_visibility: 'colleagues_only',
          show_online_status: true,
          allow_patient_messaging: true
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          date_format: 'DD/MM/YYYY',
          time_format: '12h',
          default_consultation_duration: 30
        },
        security: {
          two_factor_enabled: false,
          login_notifications: true,
          session_timeout: 24
        }
      };
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchActiveSessions = async () => {
    try {
      // Fetch real user sessions from database
      const response = await fetch('/api/user/sessions', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payload?.data?.sessions) {
          setActiveSessions(data.payload.data.sessions);
        }
      } else {
        console.log('Session listing not available or no active sessions');
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setActiveSessions([]);
    }
  }

  // Safe getter for settings with fallback
  const getSetting = (section: keyof UserSettings, key: string, fallback: any = '') => {
    return settings?.[section]?.[key as keyof typeof settings[typeof section]] ?? fallback
  }


  const updateSettings = async (section: keyof UserSettings, key: string, value: any) => {
    if (!settings) return

    const updatedSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    }

    try {
      // Call real API to update settings
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings: updatedSettings })
      });

      if (response.ok) {
        setSettings(updatedSettings);
        console.log('Settings updated successfully:', updatedSettings);
        // toast.success('Settings updated successfully')
      } else {
        throw new Error('Failed to update settings on server');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      // toast.error('Failed to update settings')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      // Call real API to change password
      const response = await fetch('/api/user/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password changed successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.payload?.error?.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('Network error occurred');
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      // Call real API to revoke specific session
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        console.log('Session revoked successfully:', sessionId);
      } else {
        throw new Error('Failed to revoke session');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  }

  const logoutAllDevices = async () => {
    if (confirm('Are you sure you want to logout from all devices? You will need to login again.')) {
      try {
        // Call real API to logout from all devices
        const response = await fetch('/api/user/sessions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Successfully logged out from ${data.payload?.data?.revokedSessions || 0} devices`);
          setActiveSessions([]);
        } else {
          throw new Error('Failed to logout from all devices');
        }
      } catch (error) {
        console.error('Logout all devices error:', error);
        alert('Failed to logout from all devices');
      }
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'sessions', name: 'Active Sessions', icon: DevicePhoneMobileIcon },
  ]

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean
    onChange: (enabled: boolean) => void
    label: string
    description?: string 
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        className={`${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        onClick={() => onChange(!enabled)}
      >
        <span
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'profile' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={getSetting('preferences', 'language', 'en')}
                    onChange={(e) => updateSettings('preferences', 'language', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    value={settings.preferences.date_format}
                    onChange={(e) => updateSettings('preferences', 'date_format', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Format
                  </label>
                  <select
                    value={settings.preferences.time_format}
                    onChange={(e) => updateSettings('preferences', 'time_format', e.target.value as '12h' | '24h')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="12h">12 Hour (AM/PM)</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Consultation Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.preferences.default_consultation_duration}
                    onChange={(e) => updateSettings('preferences', 'default_consultation_duration', parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleSwitch
                enabled={settings.notifications.email_notifications}
                onChange={(value) => updateSettings('notifications', 'email_notifications', value)}
                label="Email Notifications"
                description="Receive notifications via email"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.sms_notifications}
                onChange={(value) => updateSettings('notifications', 'sms_notifications', value)}
                label="SMS Notifications"
                description="Receive notifications via SMS"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.push_notifications}
                onChange={(value) => updateSettings('notifications', 'push_notifications', value)}
                label="Push Notifications"
                description="Receive browser push notifications"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.appointment_reminders}
                onChange={(value) => updateSettings('notifications', 'appointment_reminders', value)}
                label="Appointment Reminders"
                description="Get notified about upcoming appointments"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.medication_alerts}
                onChange={(value) => updateSettings('notifications', 'medication_alerts', value)}
                label="Medication Alerts"
                description="Receive alerts about patient medications"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.system_updates}
                onChange={(value) => updateSettings('notifications', 'system_updates', value)}
                label="System Updates"
                description="Get notified about system maintenance and updates"
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'privacy' && (
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.privacy.profile_visibility}
                  onChange={(e) => updateSettings('privacy', 'profile_visibility', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="colleagues_only">Colleagues Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <ToggleSwitch
                enabled={settings.privacy.show_online_status}
                onChange={(value) => updateSettings('privacy', 'show_online_status', value)}
                label="Show Online Status"
                description="Let others see when you're online"
              />
              
              <ToggleSwitch
                enabled={settings.privacy.allow_patient_messaging}
                onChange={(value) => updateSettings('privacy', 'allow_patient_messaging', value)}
                label="Allow Patient Messaging"
                description="Allow patients to send you messages"
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Security Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleSwitch
                  enabled={settings.security.two_factor_enabled}
                  onChange={(value) => updateSettings('security', 'two_factor_enabled', value)}
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                />
                
                <ToggleSwitch
                  enabled={settings.security.login_notifications}
                  onChange={(value) => updateSettings('security', 'login_notifications', value)}
                  label="Login Notifications"
                  description="Get notified when someone logs into your account"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSettings('security', 'session_timeout', parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Change Password
                </button>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'sessions' && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Sessions</CardTitle>
                <button
                  onClick={logoutAllDevices}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Logout All Devices
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {session.deviceInfo.userAgent.includes('Mobile') ? (
                            <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400" />
                          ) : (
                            <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.isCurrentSession && (
                              <span className="text-green-600 mr-2">Current Session</span>
                            )}
                            {session.deviceInfo.userAgent.includes('Chrome') ? 'Chrome' :
                             session.deviceInfo.userAgent.includes('Firefox') ? 'Firefox' :
                             session.deviceInfo.userAgent.includes('Safari') ? 'Safari' : 'Unknown Browser'}
                          </p>
                          <p className="text-xs text-gray-500">
                            IP: {session.deviceInfo.ip}
                          </p>
                          <p className="text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3 inline mr-1" />
                            {new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrentSession && (
                        <button
                          onClick={() => revokeSession(session.sessionId)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Revoke Session"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {activeSessions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No active sessions found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}