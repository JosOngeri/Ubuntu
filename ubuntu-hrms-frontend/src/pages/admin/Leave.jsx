import React, { useEffect, useState, useMemo } from 'react'
import { leaveAPI, employeeAPI } from '../../services/api'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import { toast } from 'react-toastify'
import { downloadPdfReport } from '../../utils/reportExport'

const AdminLeave = () => {
  const [allLeaves, setAllLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const [activeTab, setActiveTab] = useState('approvals') // 'approvals', 'all', 'reports'
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchEmployee, setSearchEmployee] = useState('')

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
      const response = await leaveAPI.getAll()
      setAllLeaves(response.data || [])
    } catch (error) {
      console.error('Failed to fetch leaves', error)
    }
  }

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      setUpdating(true)
      await leaveAPI.updateLeaveStatus(leaveId, { status: newStatus, approverId: 1 })
      toast.success(`Leave ${newStatus.toLowerCase()}`)
      await fetchLeaves()
      setSelectedLeave(null)
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update leave status'
      toast.error(message)
    } finally {
      setUpdating(false)
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
      return `⚠️ ${leave.department_conflict_count} other staff member(s) in ${leave.department || 'the department'} are on leave during these dates (${leave.department_conflict_pct}% of department).`
    }
    return null
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
      case 'Pending_Documentation':
      case 'Awaiting_Documentation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Pending_Approval':
      case 'Pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const handleExportLeavesReport = async () => {
    await downloadPdfReport({
      fileName: 'admin-leaves-report.pdf',
      title: 'Global Leave Requests Report',
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
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status?.replace(/_/g, ' ')}
        </span>
    ) },
  ]

  const totalLeaves = allLeaves.length;
  const approvedLeaves = allLeaves.filter(l => l.status === 'Approved').length;
  const rejectedLeaves = allLeaves.filter(l => l.status === 'Rejected').length;
  const leavesByType = allLeaves.reduce((acc, curr) => {
    const type = curr.type.toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const maxTypeCount = Math.max(...Object.values(leavesByType), 1);

  if (loading && allLeaves.length === 0) {
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
        <p className="page-subtitle">Review approvals, manage all leaves, and view reports.</p>
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
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'reports' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports & Analytics
        </button>
      </div>

      {activeTab === 'approvals' && (
        pendingLeaves.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-slate-600 dark:text-slate-400">No pending leave requests found.</p>
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
                        {getEmployeeName(leave.employee_id)} - {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                      </h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {leave.start_date} to {leave.end_date}
                    </p>
                    {getDepartmentWarning(leave) && (
                      <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">{getDepartmentWarning(leave)}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {selectedLeave && (
            <Card className="lg:col-span-1">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Details</h3>

                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Employee</p>
                  <p className="mt-1 text-slate-900 dark:text-slate-100">{getEmployeeName(selectedLeave.employee_id)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Type</p>
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
                    <p className="font-medium">ℹ️ Status Notes</p>
                    <p className="mt-1">{selectedLeave.instructions}</p>
                  </div>
                )}

                {selectedLeave.attachment_path && (
                  <div className="rounded bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">📎 Attachment</p>
                    <a href={selectedLeave.attachment_path} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                      View Document
                    </a>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</p>
                  {['Pending', 'Pending_Approval', 'Pending_Documentation'].includes(selectedLeave.status) ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusChange(selectedLeave.id, 'Approved')}
                        disabled={updating}
                        className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedLeave.id, 'Rejected')}
                        disabled={updating}
                        className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                      >
                        ✗ Reject
                      </button>
                      {selectedLeave.status === 'Pending_Documentation' && (
                        <button
                          onClick={() => handleStatusChange(selectedLeave.id, 'Awaiting_Documentation')}
                          disabled={updating}
                          className="w-full rounded bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:bg-gray-400"
                        >
                          ⏳ Awaiting Doc
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">This request has been {selectedLeave.status.toLowerCase()}.</p>
                  )}
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

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Requests</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalLeaves}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{approvedLeaves}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Pending</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">{pendingLeaves.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold">Rejected</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">{rejectedLeaves}</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Leaves by Type</h3>
            <div className="space-y-6">
              {Object.entries(leavesByType).map(([type, count]) => {
                const percentage = (count / maxTypeCount) * 100;
                return (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{type}</div>
                    <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{count}</div>
                  </div>
                );
              })}
              {Object.keys(leavesByType).length === 0 && (
                <p className="text-slate-500">No leave data available for generating graphs.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdminLeave
