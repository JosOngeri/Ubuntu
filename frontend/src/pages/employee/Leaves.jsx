import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { leaveAPI, employeeAPI } from '../../services/api'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import { toast } from 'react-toastify'

const EmployeeLeaves = () => {
  const { user } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [balance, setBalance] = useState({ annual: 0, sick: 0, maternity_paternity: 0 })
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' })
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const empRes = await employeeAPI.getMe()
        const currentEmp = empRes.data
        setEmployee(currentEmp)

        const empId = currentEmp?.id || currentEmp?._id
        if (!empId) return

        const balanceRes = await leaveAPI.getBalance(empId)
        setBalance(balanceRes.data)

        const leavesRes = await leaveAPI.getAll()
        const filtered = (leavesRes.data || []).filter(
          (leave) => String(leave.employeeId) === String(empId) || String(leave.employee_id) === String(empId),
        )
        setRequests(filtered)
      } catch (error) {
        console.error('Failed to load leave requests', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveData()
  }, [])

  const getAvailableDays = () => {
    if (!balance) return 0
    if (form.type === 'annual') return balance.annual ?? 0
    if (form.type === 'sick') return balance.sick ?? 0
    return 0
  }

  const requiresAttachment = ['maternity', 'paternity'].includes(form.type)
  const isMaternity = form.type === 'maternity'
  const isSick = form.type === 'sick'
  const isAnnual = form.type === 'annual'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (formError) setFormError('')
  }

  const handleFileChange = (e) => {
    setAttachmentFile(e.target.files?.[0] || null)
    if (formError) setFormError('')
  }

  const validateForm = () => {
    if (!form.startDate || !form.endDate || !form.type) {
      return 'Please select a leave type and both start/end dates.'
    }

    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    if (start > end) {
      return 'End date cannot be before start date.'
    }

    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
    if (days <= 0) {
      return 'Please provide valid leave dates.'
    }

    const available = getAvailableDays()
    if (available < days && ['annual', 'sick'].includes(form.type)) {
      return `You only have ${available} day(s) available for ${form.type} leave.`
    }

    if (form.type === 'sick') {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      if (start.toDateString() !== today.toDateString() && start.toDateString() !== yesterday.toDateString()) {
        return 'Sick leave must start today or yesterday.'
      }
    }

    if (requiresAttachment && !attachmentFile) {
      return `A supporting document is required for ${form.type} leave.`
    }

    return ''
  }

  const refreshData = async () => {
    const empId = employee?.id || employee?._id
    if (!empId) return
    const [balanceRes, leavesRes] = await Promise.all([
      leaveAPI.getBalance(empId),
      leaveAPI.getAll(),
    ])
    setBalance(balanceRes.data)
    setRequests((leavesRes.data || []).filter(
      (leave) => String(leave.employeeId) === String(empId) || String(leave.employee_id) === String(empId),
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const empId = employee?.id || employee?._id
    if (!empId) {
      toast.error('Unable to identify user')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      await leaveAPI.requestLeave({ employeeId: empId, ...form, attachment: attachmentFile })
      toast.success('Leave request submitted')
      setForm({ type: 'annual', startDate: '', endDate: '', reason: '' })
      setAttachmentFile(null)
      await refreshData()
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to submit leave request'
      toast.error(message)
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">My Leave Requests</h1>
        <p className="page-subtitle">Submit new leave requests and monitor your balance.</p>
      </div>

      <div className="grid-2 gap-6">
        <Card>
          <div className="balanced-card">
            <h2 className="text-lg font-semibold">Leave Balance</h2>
            {loading ? (
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Loading...</p>
            ) : (
              <div className="space-y-3">
                {isAnnual && (
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{getAvailableDays()} days</div>
                )}
                {isSick && (
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{getAvailableDays()} days</div>
                )}
                {isMaternity && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">Maternity leave is statutory and does not deduct from annual leave balance.</div>
                )}
                <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <div>Annual: {balance.annual ?? 0} days</div>
                  <div>Sick: {balance.sick ?? 0} days</div>
                  <div>Maternity/Paternity: statutory leave</div>
                </div>
              </div>
            )}
            <p className="mt-2 text-slate-600 dark:text-slate-400">Current year allocation.</p>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Leave Type *</label>
              <select name="type" value={form.type} onChange={handleChange} className="mt-1 w-full rounded border p-2">
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {isSick && (
              <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                📋 Upload of medical certificate required upon return for leaves exceeding 2 days.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Start Date *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="mt-1 w-full rounded border p-2" />
              {isSick && form.startDate && (
                <p className="mt-1 text-xs text-slate-500">
                  ℹ️ Sick leave must start today or yesterday
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">End Date *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="mt-1 w-full rounded border p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
              <textarea name="reason" value={form.reason} onChange={handleChange} className="mt-1 w-full rounded border p-2" rows="2" />
            </div>

            {requiresAttachment && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Supporting Document * (Required)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="mt-1 w-full rounded border p-2 bg-white"
                  required
                />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  📎 Attach a medical or supporting document for {form.type} leave (PDF, DOC, DOCX).
                </p>
                {attachmentFile && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">✓ {attachmentFile.name}</p>
                )}
              </div>
            )}

            {(form.type === 'maternity' || form.type === 'paternity') && (
              <div className="rounded bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Statutory leave: this request is reviewed against policy rules, not balance subtraction.
              </div>
            )}

            {formError && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
                ⚠️ {formError}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark"
            >
              Submit Request
            </button>
          </form>
        </Card>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Leave Requests</h2>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <p>Loading requests…</p>
          ) : requests.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No leave requests found.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((leave) => {
                const startLabel = leave.start_date || leave.startDate
                const endLabel = leave.end_date || leave.endDate
                const displayStatus = leave.status || 'Pending'
                const statusColor =
                  displayStatus === 'Approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                    : displayStatus === 'Rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : displayStatus.includes('Documentation')
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

                return (
                  <li key={leave.id || leave._id || `${startLabel}-${leave.type}`} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{leave.type || leave.leaveType}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {startLabel} — {endLabel}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>{displayStatus}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{leave.reason || 'No description provided'}</p>
                    {leave.instructions && (
                      <p className="mt-2 rounded bg-blue-50 p-2 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        ℹ️ {leave.instructions}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EmployeeLeaves
