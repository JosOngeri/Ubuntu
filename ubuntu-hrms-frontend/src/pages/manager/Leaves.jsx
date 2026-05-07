import React, { useEffect, useState, useMemo } from 'react'
import { leaveAPI, employeeAPI } from '../../services/api'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import { toast } from 'react-toastify'
import { downloadPdfReport } from '../../utils/reportExport'

const ManagerLeaves = () => {
  const [allLeaves, setAllLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [requesting, setRequesting] = useState(false)
  
  const [activeTab, setActiveTab] = useState('approvals') // 'approvals', 'all', 'request'
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchEmployee, setSearchEmployee] = useState('')
  
  const [requestForm, setRequestForm] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [leavesRes, empRes] = await Promise.all([
        leaveAPI.getAll(),
        employeeAPI.getAll()
      ])
      setAllLeaves(leavesRes.data || [])
      setEmployees(empRes.data || [])
    } catch (error) {
      console.error('Failed to fetch data', error)
      toast.error('Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaves = async () => {
    try {
      const res = await leaveAPI.getAll()
      setAllLeaves(res.data || [])
    } catch (error) {
      console.error('Failed to fetch leaves', error)
    }
  }

  const handleApprove = async (leaveId) => {
    try {
      setUpdating(true)
      await leaveAPI.updateLeaveStatus(leaveId, 1, 'Approved')
      toast.success('Leave approved')
      await fetchLeaves()
      setSelectedLeave(null)
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to approve leave'
      toast.error(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = async (leaveId) => {
    try {
      setUpdating(true)
      await leaveAPI.updateLeaveStatus(leaveId, 1, 'Rejected')
      toast.success('Leave rejected')
      await fetchLeaves()
      setSelectedLeave(null)
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to reject leave'
      toast.error(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!requestForm.startDate || !requestForm.endDate) {
      return toast.error('Start and End dates are required')
    }
    try {
      setRequesting(true)
      await leaveAPI.requestLeave({
        type: requestForm.type,
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: requestForm.reason,
        attachment: requestForm.attachment
      })
      toast.success('Leave request submitted successfully')
      setRequestForm({ type: 'annual', startDate: '', endDate: '', reason: '', attachment: null })
      fetchLeaves()
      setActiveTab('all')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit leave request')
    } finally {
      setRequesting(false)
    }
  }

  const pendingLeaves = useMemo(() => allLeaves.filter((l) =>
    ['Pending', 'Pending_Approval', 'Pending_Documentation', 'Awaiting_Documentation'].includes(l.status)
  ), [allLeaves])

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId) || String(e._id) === String(empId))
    return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : empId
  }

  const filteredAllLeaves = useMemo(() => {
    return allLeaves.filter(leave => {
      const empName = String(getEmployeeName(leave.employee_id)).toLowerCase()
      const matchName = empName.includes(searchEmployee.toLowerCase()) || String(leave.employee_id).includes(searchEmployee)
      const matchStatus = statusFilter === 'all' || leave.status === statusFilter
      return matchName && matchStatus
    })
  }, [allLeaves, searchEmployee, statusFilter, employees])

  const getDepartmentWarning = (leave) => {
    if (leave.type === 'annual' && leave.department_conflict_count > 0) {
      return `${leave.department_conflict_count} staff member(s) on leave during these dates (${leave.department_conflict_pct}%)`
    }
    return null
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending_Documentation':
      case 'Awaiting_Documentation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Pending_Approval':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
      case 'Pending':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const handleExportLeavesReport = async () => {
    await downloadPdfReport({
      fileName: 'leaves-report.pdf',
      title: 'Company Leave Requests Report',
      rows: filteredAllLeaves,
      columns: [
        { label: 'Employee', getValue: (row) => getEmployeeName(row.employee_id) },
        { label: 'Type', getValue: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
        { label: 'Start Date', getValue: (row) => new Date(row.start_date).toLocaleDateString() },
        { label: 'End Date', getValue: (row) => new Date(row.end_date).toLocaleDateString() },
        { label: 'Status', getValue: (row) => row.status?.replace(/_/g, ' ') },
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
      ],
    })
  }

  const allLeavesColumns = [
    { key: 'employee', label: 'Employee', render: (_, row) => getEmployeeName(row.employee_id) },
    { key: 'type', label: 'Type', render: (_, row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
    { key: 'start_date', label: 'Start Date', render: (date) => new Date(date).toLocaleDateString() },
    { key: 'end_date', label: 'End Date', render: (date) => new Date(date).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (_, row) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(row.status)}`}>
          {row.status?.replace(/_/g, ' ')}
        </span>
    ) },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">Loading leave data...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-header mb-6">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-subtitle">Review team approvals, view company leaves, or submit a request.</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'approvals' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('approvals')}
        >
          Pending Approvals
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('all')}
        >
          All Leaves
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'request' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('request')}
        >
          Request Leave
        </button>
      </div>

      {activeTab === 'approvals' && (
        pendingLeaves.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-slate-600 dark:text-slate-400">No pending leave requests.</p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {pendingLeaves.map((leave) => (
            <Card
              key={leave.id}
              className={`cursor-pointer transition ${
                selectedLeave?.id === leave.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedLeave(leave)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {getEmployeeName(leave.employee_id)} - {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                    </h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(leave.status)}`}>
                      {leave.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {leave.start_date} to {leave.end_date}
                  </p>
                  {getDepartmentWarning(leave) && (
                    <div className="mt-2 rounded bg-yellow-50 px-2 py-1 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                      <p className="font-medium">Warning: {getDepartmentWarning(leave)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedLeave && (
          <Card className="lg:col-span-1 h-fit sticky top-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Review Details</h3>

              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Employee</p>
                <p className="mt-1 text-slate-900 dark:text-slate-100">{getEmployeeName(selectedLeave.employee_id)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Leave Type</p>
                <p className="mt-1 text-slate-900 dark:text-slate-100">{selectedLeave.type}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Period</p>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  {selectedLeave.start_date} to {selectedLeave.end_date}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reason</p>
                <p className="mt-1 text-slate-900 dark:text-slate-100">{selectedLeave.reason || 'Not provided'}</p>
              </div>

              {selectedLeave.instructions && (
                <div className="rounded bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  <p className="font-medium">Status Notes</p>
                  <p className="mt-1">{selectedLeave.instructions}</p>
                </div>
              )}

              {getDepartmentWarning(selectedLeave) && (
                <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                  <p className="font-medium">Department Notice</p>
                  <p className="mt-1">{getDepartmentWarning(selectedLeave)}</p>
                </div>
              )}

              {selectedLeave.attachment_path && (
                <div className="rounded bg-slate-100 p-3 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachment</p>
                  <a
                    href={selectedLeave.attachment_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    View Document
                  </a>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleApprove(selectedLeave.id)}
                    disabled={updating}
                    className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Approve Leave
                  </button>
                  <button
                    onClick={() => handleReject(selectedLeave.id)}
                    disabled={updating}
                    className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}
          </div>
        )
      )}

      {activeTab === 'all' && (
        <Card>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Input
              label="Search Employee"
              placeholder="Name or ID"
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="min-w-[240px]"
            />
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending_Documentation">Pending Documentation</option>
                <option value="Awaiting_Documentation">Awaiting Documentation</option>
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={handleExportLeavesReport}>
              Export Report
            </Button>
          </div>
          <Table columns={allLeavesColumns} data={filteredAllLeaves} loading={loading} />
        </Card>
      )}

      {activeTab === 'request' && (
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="form-group">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                <select
                  className="form-select w-full"
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                  required
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="compassionate">Compassionate Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={requestForm.endDate}
                  onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <textarea
                  className="form-input w-full min-h-[100px]"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="Please provide a brief reason for your leave..."
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  className="form-input w-full"
                  onChange={(e) => setRequestForm({ ...requestForm, attachment: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-slate-500 mt-1">Medical certificates are required for sick leave &gt; 2 days.</p>
              </div>
              <div className="pt-4">
                <Button type="submit" variant="primary" disabled={requesting} className="w-full">
                  {requesting ? 'Submitting Request...' : 'Submit Leave Request'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ManagerLeaves