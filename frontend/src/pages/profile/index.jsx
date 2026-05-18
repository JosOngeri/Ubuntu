import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BsPerson, BsEnvelope, BsShield, BsCalendar, BsClock } from 'react-icons/bs'

const ProfileIndex = () => {
  const { user, displayName } = useAuth()

  return (
    <div className="min-h-screen bg-ubuntu-cream dark:bg-ubuntu-brown py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ubuntu-brown dark:text-ubuntu-cream mb-2">My Profile</h1>
          <p className="text-ubuntu-brown-dark dark:text-ubuntu-tan">Manage your personal information and preferences</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-ubuntu-brown-light rounded-xl shadow-lg border border-ubuntu-tan dark:border-ubuntu-sienna p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-ubuntu-orange rounded-full flex items-center justify-center">
                <BsPerson size={48} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ubuntu-brown dark:text-ubuntu-cream">
                {displayName}
              </h2>
              <p className="text-ubuntu-brown-dark dark:text-ubuntu-tan">{user?.email || 'user@example.com'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-ubuntu-gold text-white">
                  {user?.role || 'Employee'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-6 bg-ubuntu-cream-dark dark:bg-ubuntu-brown rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna">
              <BsShield size={32} className="text-ubuntu-brown dark:text-ubuntu-cream mx-auto mb-3" />
              <h3 className="font-semibold text-ubuntu-brown dark:text-ubuntu-cream mb-1">Secure Account</h3>
              <p className="text-sm text-ubuntu-brown-dark dark:text-ubuntu-tan">2FA Enabled</p>
            </div>
            
            <div className="text-center p-6 bg-ubuntu-cream-dark dark:bg-ubuntu-brown rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna">
              <BsCalendar size={32} className="text-ubuntu-brown dark:text-ubuntu-cream mx-auto mb-3" />
              <h3 className="font-semibold text-ubuntu-brown dark:text-ubuntu-cream mb-1">Joined</h3>
              <p className="text-sm text-ubuntu-brown-dark dark:text-ubuntu-tan">January 2024</p>
            </div>
            
            <div className="text-center p-6 bg-ubuntu-cream-dark dark:bg-ubuntu-brown rounded-lg border border-ubuntu-tan dark:border-ubuntu-sienna">
              <BsClock size={32} className="text-ubuntu-brown dark:text-ubuntu-cream mx-auto mb-3" />
              <h3 className="font-semibold text-ubuntu-brown dark:text-ubuntu-cream mb-1">Last Active</h3>
              <p className="text-sm text-ubuntu-brown-dark dark:text-ubuntu-tan">2 hours ago</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/profile/update"
              className="flex-1 bg-ubuntu-brown text-white px-6 py-3 rounded-lg font-medium hover:bg-ubuntu-brown-dark transition-colors text-center"
            >
              Edit Profile
            </Link>
            
            <Link 
              to="/settings"
              className="flex-1 bg-white dark:bg-ubuntu-brown-light text-ubuntu-brown dark:text-ubuntu-cream border border-ubuntu-brown dark:border-ubuntu-cream px-6 py-3 rounded-lg font-medium hover:bg-ubuntu-cream dark:hover:bg-ubuntu-brown transition-colors text-center"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileIndex
