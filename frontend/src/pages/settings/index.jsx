import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { BsGear, BsBell, BsShield, BsPalette, BsGlobe } from 'react-icons/bs'

const Settings = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPreferences()
    loadDarkMode()
  }, [])

  const loadPreferences = async () => {
    try {
      const res = await userAPI.getPreferences()
      const prefs = res.data || {}
      setNotifications(prefs.notifications !== undefined ? prefs.notifications : true)
      setLanguage(prefs.language || 'en')
    } catch (err) {
      console.error('Failed to load preferences', err)
    }
  }

  const loadDarkMode = () => {
    const saved = localStorage.getItem('darkMode')
    setDarkMode(saved === 'true')
    applyDarkMode(saved === 'true')
  }

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleDarkModeToggle = async () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))
    applyDarkMode(newValue)
    await savePreferences({ darkMode: newValue })
  }

  const handleNotificationsToggle = async () => {
    const newValue = !notifications
    setNotifications(newValue)
    await savePreferences({ notifications: newValue })
  }

  const handleLanguageChange = async (value) => {
    setLanguage(value)
    await savePreferences({ language: value })
  }

  const savePreferences = async (updates) => {
    try {
      setLoading(true)
      await userAPI.updatePreferences(updates)
      toast.success('Preferences saved')
    } catch (err) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ubuntu-cream dark:bg-ubuntu-brown py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ubuntu-brown dark:text-ubuntu-cream mb-2">Settings</h1>
          <p className="text-ubuntu-brown-dark dark:text-ubuntu-tan">Manage your account preferences and application settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Settings */}
          <div className="bg-white dark:bg-ubuntu-brown-light rounded-xl shadow-lg border border-ubuntu-tan dark:border-ubuntu-sienna p-6">
            <div className="flex items-center gap-3 mb-6">
              <BsShield size={24} className="text-ubuntu-brown dark:text-ubuntu-cream" />
              <h2 className="text-xl font-semibold text-ubuntu-brown dark:text-ubuntu-cream">Account</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan mb-2">Username</label>
                <input 
                  type="text" 
                  value={user?.username || ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna bg-ubuntu-cream dark:bg-ubuntu-brown text-ubuntu-brown-dark dark:text-ubuntu-cream"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan mb-2">Email</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna bg-ubuntu-cream dark:bg-ubuntu-brown text-ubuntu-brown-dark dark:text-ubuntu-cream"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan mb-2">Role</label>
                <input 
                  type="text" 
                  value={user?.role || ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna bg-ubuntu-cream dark:bg-ubuntu-brown text-ubuntu-brown-dark dark:text-ubuntu-cream"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-ubuntu-brown-light rounded-xl shadow-lg border border-ubuntu-tan dark:border-ubuntu-sienna p-6">
            <div className="flex items-center gap-3 mb-6">
              <BsPalette size={24} className="text-ubuntu-brown dark:text-ubuntu-cream" />
              <h2 className="text-xl font-semibold text-ubuntu-brown dark:text-ubuntu-cream">Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan">Dark Mode</label>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    darkMode ? 'bg-ubuntu-brown' : 'bg-ubuntu-orange'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full transition-transform ${
                    darkMode ? 'translate-x-5 bg-white' : 'translate-x-1 bg-white'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna bg-ubuntu-cream dark:bg-ubuntu-brown text-ubuntu-brown-dark dark:text-ubuntu-cream"
                >
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan">Notifications</label>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    notifications ? 'bg-ubuntu-brown' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full transition-transform ${
                    notifications ? 'translate-x-5 bg-white' : 'translate-x-1 bg-white'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* System */}
          <div className="bg-white dark:bg-ubuntu-brown-light rounded-xl shadow-lg border border-ubuntu-tan dark:border-ubuntu-sienna p-6">
            <div className="flex items-center gap-3 mb-6">
              <BsGlobe size={24} className="text-ubuntu-brown dark:text-ubuntu-cream" />
              <h2 className="text-xl font-semibold text-ubuntu-brown dark:text-ubuntu-cream">System</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan">Version</span>
                <span className="text-sm text-ubuntu-brown dark:text-ubuntu-tan">1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ubuntu-brown-dark dark:text-ubuntu-tan">Last Updated</span>
                <span className="text-sm text-ubuntu-brown dark:text-ubuntu-tan">Today at 2:30 PM</span>
              </div>
              
              <button className="w-full bg-ubuntu-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-ubuntu-orange-dark transition-colors">
                Check for Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
