import React from 'react'
import { BsCash, BsCalendarWeek, BsPeople } from 'react-icons/bs'

export default function PayrollCard({ payrollData = {}, onClick = null }) {
  const defaultData = {
    dailyWageBill: payrollData.dailyWageBill || 1250,
    monthlyWageBill: payrollData.monthlyWageBill || 28500,
    contractorPayments: payrollData.contractorPayments || 8750,
    dailyTrend: payrollData.dailyTrend || 2.5,
    monthlyTrend: payrollData.monthlyTrend || 8.2,
    contractorTrend: payrollData.contractorTrend || -3.1
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KES', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : 'hover:shadow-xl transition-shadow duration-300'}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#CB7246] to-[#F27C12] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payroll Overview</h3>
          <BsCash className="text-2xl" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Today's Daily Labour Wage Bill */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#CB7246] text-white rounded-lg">
              <BsCalendarWeek size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Daily Labour</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(defaultData.dailyWageBill)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${defaultData.dailyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {defaultData.dailyTrend > 0 ? '↑' : '↓'} {Math.abs(defaultData.dailyTrend)}%
            </p>
            <p className="text-xs text-gray-500">vs yesterday</p>
          </div>
        </div>

        {/* Monthly Wage Bill */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#2B6410] text-white rounded-lg">
              <BsCash size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Wage Bill</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(defaultData.monthlyWageBill)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${defaultData.monthlyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {defaultData.monthlyTrend > 0 ? '↑' : '↓'} {Math.abs(defaultData.monthlyTrend)}%
            </p>
            <p className="text-xs text-gray-500">vs last month</p>
          </div>
        </div>

        {/* Contractors Pending Payments */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#373435] text-white rounded-lg">
              <BsPeople size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Contractors Pending</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(defaultData.contractorPayments)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${defaultData.contractorTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {defaultData.contractorTrend > 0 ? '↑' : '↓'} {Math.abs(defaultData.contractorTrend)}%
            </p>
            <p className="text-xs text-gray-500">vs last period</p>
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll Commitment</p>
              <p className="text-2xl font-bold text-[#CB7246]">
                {formatCurrency(defaultData.dailyWageBill + defaultData.monthlyWageBill + defaultData.contractorPayments)}
              </p>
            </div>
            <div className="px-3 py-1 bg-orange-100 text-[#CB7246] rounded-full text-sm font-medium border border-orange-200">
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
