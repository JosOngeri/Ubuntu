import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BsBoxArrowRight, BsGear } from 'react-icons/bs'
import ThemeToggle from './ThemeToggle'

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
          
          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-4">
            <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">
              {user?.username || 'User'}
            </span>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                title="Settings"
              >
                <BsGear size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                title="Logout"
              >
                <BsBoxArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
