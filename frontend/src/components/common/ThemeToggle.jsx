import React from 'react'
import { BsSun, BsMoon } from 'react-icons/bs'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200"
    >
      {theme === 'light' ? (
        <BsMoon size={20} />
      ) : (
        <BsSun size={20} />
      )}
    </button>
  )
}

export default ThemeToggle
