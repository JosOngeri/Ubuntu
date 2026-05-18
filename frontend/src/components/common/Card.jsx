import React from 'react'

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-slate-700 p-8 hover:shadow-xl dark:hover:shadow-2xl transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  )
}

export default Card
