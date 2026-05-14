import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { BsBoxArrowRight, BsGear, BsPersonCircle, BsChevronDown } from 'react-icons/bs'
import ThemeToggle from './ThemeToggle'

const initialsFromName = (name) => {
  if (!name || name === 'Guest') return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const a = parts[0][0]
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1]
  return `${(a || '').toUpperCase()}${(b || '').toUpperCase()}`.trim() || '?'
}

const Header = ({ onToggleSidebar }) => {
  const { user, logout, displayName } = useAuth()
  const navigate = useNavigate()
  const avatarInitials = initialsFromName(displayName)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 transition-colors lg:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <img src="/ubuntu_log_transparent.png" alt="Ubuntu Kreative Village" className="h-11 w-11 object-contain" />
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-primary dark:text-primary-light">UBUNTU HRMS</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kreative Village</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="flex items-center gap-4 border-l border-ubuntu-tan dark:border-ubuntu-sienna pl-4">
            {/* Always visible user info */}
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full bg-ubuntu-orange text-white flex items-center justify-center text-sm font-semibold shrink-0"
                title={displayName}
              >
                {avatarInitials}
              </div>
              <div>
                <p className="text-ubuntu-brown dark:text-ubuntu-cream font-medium">
                  {displayName}
                </p>
                <p className="text-sm text-ubuntu-brown-dark dark:text-ubuntu-tan">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
            
            {/* Profile dropdown trigger */}
            <div className="relative">
              <button 
                onClick={handleProfileClick}
                className="p-2 hover:bg-ubuntu-cream dark:hover:bg-ubuntu-brown-light rounded-lg transition-colors"
                title="Menu"
              >
                <BsChevronDown size={14} className="text-ubuntu-brown dark:text-ubuntu-cream" />
              </button>
              
              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div 
                  ref={profileRef}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-ubuntu-brown border border-ubuntu-tan dark:border-ubuntu-sienna rounded-lg shadow-lg z-50"
                >
                  <div className="p-4">
                    <div className="border-b border-ubuntu-tan dark:border-ubuntu-sienna pb-3 mb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-ubuntu-orange text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {avatarInitials}
                        </div>
                        <div>
                          <p className="font-semibold text-ubuntu-brown dark:text-ubuntu-cream">
                            {displayName}
                          </p>
                          <p className="text-sm text-ubuntu-brown-dark dark:text-ubuntu-tan">
                            {user?.email || 'user@example.com'}
                          </p>
                          <p className="text-xs text-ubuntu-orange dark:text-ubuntu-orange-light mt-1">
                            {user?.role || 'Employee'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Link 
                        to="/profile/view"
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-ubuntu-cream dark:hover:bg-ubuntu-brown-light transition-colors text-ubuntu-brown dark:text-ubuntu-cream"
                      >
                        <BsPersonCircle size={16} />
                        <span>My Profile</span>
                      </Link>
                      
                      <Link 
                        to="/profile/update"
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-ubuntu-cream dark:hover:bg-ubuntu-brown-light transition-colors text-ubuntu-brown dark:text-ubuntu-cream"
                      >
                        <BsGear size={16} />
                        <span>Settings</span>
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-ubuntu-brown transition-colors text-red-600 dark:text-red-400 w-full text-left"
                      >
                        <BsBoxArrowRight size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
