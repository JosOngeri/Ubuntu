import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI, leaveAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const approvedStatuses = ['Pending', 'Pending_Approval', 'Pending_Documentation', 'Awaiting_Documentation']
const leaveKinds = ['annual', 'sick']

const normalizeDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const overlaps = (left, right) => {
  const startA = normalizeDate(left.start_date || left.startDate)
  const endA = normalizeDate(left.end_date || left.endDate)
  const startB = normalizeDate(right.start_date || right.startDate)
  const endB = normalizeDate(right.end_date || right.endDate)
  if (!startA || !endA || !startB || !endB) return false
  return startA <= endB && startB <= endA
}

export default function LeaveApprovals() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedLeaveId, setSelectedLeaveId] = useState(null)
  const [error, setError] = useState('')

  const employeeNameMap = useMemo(() => {
    return employees.reduce((accumulator, employee) => {
      accumulator[String(employee.id || employee._id)] = [employee.firstName, employee.lastName].filter(Boolean).join(' ')
      return accumulator
    }, {})
  }, [employees])

  const pendingLeaves = useMemo(() => {
    return leaves.filter((leave) => approvedStatuses.includes(String(leave.status)) && leaveKinds.includes(String(leave.type).toLowerCase()))
  }, [leaves])

  const conflictMap = useMemo(() => {
    return pendingLeaves.reduce((accumulator, leave, index) => {
      const conflictCount = pendingLeaves.reduce((count, other, otherIndex) => {
        if (index === otherIndex) return count
        return overlaps(leave, other) ? count + 1 : count
      }, 0)

      if (conflictCount > 0) {
        accumulator[String(leave.id)] = conflictCount
      }
      return accumulator
    }, {})
  }, [pendingLeaves])

  const loadData = async () => {
    try {
      setLoading(true)
      const [leaveResponse, employeeResponse] = await Promise.all([
        leaveAPI.getAll(),
        employeeAPI.getAll(),
      ])
      setLeaves(leaveResponse.data || [])
      setEmployees(employeeResponse.data || [])
      setError('')
    } catch (loadError) {
      console.error('Failed to load leave approvals', loadError)
      setError(loadError.response?.data?.error || 'Failed to load leave approvals')
      toast.error('Failed to load leave approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateStatus = async (leaveId, status) => {
    try {
      setActionLoading(true)
      await leaveAPI.updateLeaveStatus(leaveId, { approverId: user?.id, status })
      toast.success(`Leave ${status.toLowerCase()}`)
      await loadData()
      setSelectedLeaveId(null)
    } catch (updateError) {
      const message = updateError.response?.data?.error || updateError.message || `Failed to ${status.toLowerCase()} leave`
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const selectedLeave = pendingLeaves.find((leave) => String(leave.id) === String(selectedLeaveId))

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Leave Approvals</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Review annual and sick requests for your team, with conflict visibility for overlapping leave dates.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {conflictMap && Object.keys(conflictMap).length > 1 && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          <strong>Conflict Warning:</strong> multiple team members are off on overlapping dates. Review coverage before approving.
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : pendingLeaves.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No pending annual or sick leave requests at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Dates</th>
                    <th className="px-4 py-3 font-medium">Conflict</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pendingLeaves.map((leave) => (
                    <tr key={leave.id} className="align-top">
                      <td className="px-4 py-4 text-slate-950 dark:text-white">
                        {employeeNameMap[String(leave.employee_id)] || leave.employee_name || `Employee ${leave.employee_id}`}
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-700 dark:text-slate-300">{leave.type}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {leave.start_date} to {leave.end_date}
                      </td>
                      <td className="px-4 py-4">
                        {conflictMap[String(leave.id)] ? (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {conflictMap[String(leave.id)] + 1} overlapping requests
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">No overlap</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedLeaveId(leave.id)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => updateStatus(leave.id, 'Approved')}
                            disabled={actionLoading}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(leave.id, 'Rejected')}
                            disabled={actionLoading}
                            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Request Details</h2>
            {selectedLeave ? (
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Employee</div>
                  <div className="mt-1 font-medium text-slate-950 dark:text-white">
                    {employeeNameMap[String(selectedLeave.employee_id)] || `Employee ${selectedLeave.employee_id}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Leave type</div>
                  <div className="mt-1 capitalize">{selectedLeave.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Period</div>
                  <div className="mt-1">{selectedLeave.start_date} to {selectedLeave.end_date}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Reason</div>
                  <div className="mt-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">{selectedLeave.reason || 'No reason supplied'}</div>
                </div>
                {conflictMap[String(selectedLeave.id)] && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                    Conflict warning: this request overlaps with {conflictMap[String(selectedLeave.id)]} other pending request(s).
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedLeave.id, 'Approved')}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(selectedLeave.id, 'Rejected')}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose a request to review details.</p>
            )}
          </aside>
        </div>
      )}
    </DashboardLayout>
  )
}
