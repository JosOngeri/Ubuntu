import React from 'react'
import { BsX } from 'react-icons/bs'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
        <div className={`w-full ${sizeClasses[size] || sizeClasses.md} mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl my-auto`} onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-white dark:bg-slate-900 rounded-t-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
            >
              <BsX size={24} />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export default Modal
