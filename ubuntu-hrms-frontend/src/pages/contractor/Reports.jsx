import React, { useState, useEffect } from 'react'
import { BsDownload, BsFilter, BsCalendar3, BsGraphUp } from 'react-icons/bs'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'month',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchReports()
  }, [filters])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await contractorAPI.getReports(filters.type)
      setReports(response.data || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (reportId, type) => {
    try {
      const response = await contractorAPI.downloadReport(reportId)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Failed to download report:', error)
      toast.error('Failed to download report')
    }
  }

  const reportTypes = [
    { value: 'earnings', label: 'Earnings Report', icon: '💰' },
    { value: 'projects', label: 'Projects Report', icon: '📋' },
    { value: 'invoices', label: 'Invoices Report', icon: '🧾' },
    { value: 'performance', label: 'Performance Report', icon: '📊' }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Contractor Reports</h1>
        <p className="page-subtitle">Generate and download detailed reports for your contracting work.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Report Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Reports</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map(report => (
            <Card key={report.id}>
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {reportTypes.find(t => t.value === report.type)?.icon || '📊'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {report.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        📅 {report.generated_date}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        📊 {report.record_count} records
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadReport(report.id, report.type)}
                    className="inline-flex items-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <BsDownload size={16} className="mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <BsGraphUp size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
                No Reports Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your filters or generate a new report.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ContractorReports
