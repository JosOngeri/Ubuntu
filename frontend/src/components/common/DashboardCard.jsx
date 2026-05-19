import React from 'react'

export default function DashboardCard({ title, value, icon, color = 'orange', trend = null, onClick = null }) {
  const getColorClasses = () => {
    switch (color) {
      case 'orange':
        return 'bg-[#CB7246] text-white'
      case 'green':
        return 'bg-[#2B6410] text-white'
      case 'gray':
        return 'bg-[#373435] text-white'
      default:
        return 'bg-[#CB7246] text-white'
    }
  }

  const getLightColorClasses = () => {
    switch (color) {
      case 'orange':
        return 'bg-orange-50 text-[#CB7246] border-orange-200'
      case 'green':
        return 'bg-green-50 text-[#2B6410] border-green-200'
      case 'gray':
        return 'bg-gray-50 text-[#373435] border-gray-200'
      default:
        return 'bg-orange-50 text-[#CB7246] border-orange-200'
    }
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : 'hover:shadow-xl transition-shadow duration-300'}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className={`px-6 py-4 ${getColorClasses()}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLightColorClasses()} border`}>
            Total
          </div>
        </div>
      </div>
    </div>
  )
}
