import React from 'react'

const Input = React.forwardRef(
  (
    {
      label,
      error,
      size = 'md',
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    }

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full ${sizeClasses[size] || sizeClasses.md} rounded-lg border ${
            error
              ? 'border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600'
              : 'border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-light'
          } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors duration-200 ${className}`}
          {...props}
        />
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
