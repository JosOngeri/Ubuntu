import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI, leaveAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const leaveTypeOptions = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'unpaid', label: 'Unpaid' },
]

const dayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0
  return Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000) + 1
}

const formatCurrencyDays = (value) => `${Number(value || 0)} day(s)`

export default function LeaveRequest() {
  const { user } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [balance, setBalance] = useState({ annual: 0, sick: 0, maternity_paternity: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' })

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        const meResponse = await employeeAPI.getMe()
        if (!isMounted) return

        const currentEmployee = meResponse.data
        setEmployee(currentEmployee)

        const employeeId = currentEmployee?.id || currentEmployee?._id
        if (employeeId) {
          const balanceResponse = await leaveAPI.getBalance(employeeId)
          if (isMounted) {
            setBalance(balanceResponse.data || { annual: 0, sick: 0, maternity_paternity: 0 })
          }
        }
      } catch (loadError) {
        console.error('Failed to load leave request context', loadError)
        if (isMounted) {
          setError(loadError.response?.data?.error || 'Unable to load leave balance')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (user) {
      load()
    }

    return () => {
      isMounted = false
    }
  }, [user])

  const requestedDays = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const isStatutory = form.type === 'maternity' || form.type === 'paternity'
  const availableBalance = useMemo(() => {
    if (form.type === 'annual') return Number(balance.annual || 0)
    if (form.type === 'sick') return Number(balance.sick || 0)
    return Number(balance.maternity_paternity || 0)
  }, [balance, form.type])

  const validationMessage = useMemo(() => {
    if (!form.startDate || !form.endDate) return ''
    if (requestedDays <= 0) return 'Please choose a valid date range.'
    if (form.type === 'annual' && requestedDays > availableBalance) {
      return `You only have ${availableBalance} annual day(s) left.`
    }
    if (form.type === 'sick') {
      return 'Medical certificate may be required after submission.'
    }
    if (isStatutory) {
      return 'Statutory leave does not deduct from your leave balance, but supporting documents are required.'
    }
    return ''
  }, [availableBalance, form.endDate, form.startDate, form.type, isStatutory, requestedDays])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!employee?.id && !employee?._id) {
      setError('Employee profile not loaded yet.')
      return
    }

    if (!form.type || !form.startDate || !form.endDate) {
      setError('Select a leave type and start/end dates.')
      return
    }

    if (form.type === 'annual' && requestedDays > availableBalance) {
      setError(`You only have ${availableBalance} annual day(s) left.`)
      return
    }

    if (isStatutory && !attachment) {
      setError('Attach the supporting medical document before submitting.')
      return
    }

    if (form.type === 'sick' && requestedDays > 7) {
      toast.info('Long sick leave may require additional documentation.')
    }

    try {
      setSubmitting(true)
      const payload = {
        employeeId: employee.id || employee._id,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        attachment,
      }
      await leaveAPI.requestLeave(payload)
      toast.success('Leave request submitted')
      setForm({ type: 'annual', startDate: '', endDate: '', reason: '' })
      setAttachment(null)
      const balanceResponse = await leaveAPI.getBalance(employee.id || employee._id)
      setBalance(balanceResponse.data || balance)
    } catch (submitError) {
      const message = submitError.response?.data?.error || submitError.response?.data?.msg || submitError.message
      setError(message || 'Failed to submit leave request')
      toast.error(message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Leave Request</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Submit annual, sick, or statutory leave requests with balance checks and supporting documents.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Leave type</span>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {leaveTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Requested days</div>
                <div className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{formatCurrencyDays(requestedDays)}</div>
              </div>
            </div>

            {validationMessage && (
              <div className={`rounded-xl px-4 py-3 text-sm ${isStatutory ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'}`}>
                {validationMessage}
              </div>
            )}

            {form.type === 'sick' && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                Sick leave requests should be supported by a medical certificate when required by policy.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Start date</span>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">End date</span>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</span>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Briefly explain your request"
              />
            </label>

            {isStatutory && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Supporting document</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Upload a PDF or image for maternity/paternity validation.</p>
                {attachment && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Selected: {attachment.name}</p>}
              </label>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading || (form.type === 'annual' && requestedDays > availableBalance)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Current Balance</h2>
            {loading ? (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : isStatutory ? (
              <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                Maternity and paternity requests are handled as statutory leave, so the balance widget stays hidden for this leave type.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                  <span>Annual</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{Number(balance.annual || 0)} days</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                  <span>Sick</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{Number(balance.sick || 0)} days</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                  <span>Maternity / Paternity</span>
                  <span className="font-semibold text-slate-950 dark:text-white">Statutory</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-sm">
            <h3 className="text-lg font-semibold">Need approval context?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Annual leave will be blocked when the requested period exceeds your current allocation.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Sick leave displays a compliance warning, while statutory leave requires supporting documents.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">API context</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Current employee payload: <span className="font-mono text-xs">{employee?.id || employee?._id || 'loading'}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Requests are submitted to the manager for approval.</p>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}
