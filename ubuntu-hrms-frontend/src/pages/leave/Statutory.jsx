import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { leaveAPI } from '../../services/api'

const statutoryTypes = ['maternity']

const buildAttachmentUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${import.meta.env.VITE_API_URL || 'https://ubuntu-hrms-epmc.onrender.com'}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function LeaveStatutory() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')

  const statutoryLeaves = useMemo(() => {
    return leaves.filter((leave) => statutoryTypes.includes(String(leave.type).toLowerCase()))
  }, [leaves])

  const selectedLeave = statutoryLeaves.find((leave) => String(leave.id) === String(selectedId))

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await leaveAPI.getAll()
      setLeaves(response.data || [])
      setError('')
    } catch (loadError) {
      console.error('Failed to load statutory leave requests', loadError)
      setError(loadError.response?.data?.error || 'Failed to load statutory leave requests')
      toast.error('Failed to load statutory leave requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Statutory Leave Review</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Dedicated review view for long-term statutory leave requests with document preview and download support.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : statutoryLeaves.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No statutory maternity leave requests available right now.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4">
            {statutoryLeaves.map((leave) => (
              <button
                key={leave.id}
                onClick={() => setSelectedId(leave.id)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition ${String(selectedId) === String(leave.id)
                  ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200 bg-white text-slate-950 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-600'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-70">Employee {leave.employee_id}</div>
                    <div className="mt-1 text-lg font-semibold">{leave.type.toUpperCase()} Leave</div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {leave.status}
                  </span>
                </div>
                <div className="mt-3 text-sm opacity-80">
                  {leave.start_date} to {leave.end_date}
                </div>
              </button>
            ))}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {selectedLeave ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Review attachment</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Maternity leave is treated as statutory and the document preview is available here.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Reason</div>
                  <div className="mt-2 text-sm text-slate-800 dark:text-slate-200">{selectedLeave.reason || 'No reason supplied'}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Period</div>
                  <div className="mt-2 text-sm text-slate-800 dark:text-slate-200">{selectedLeave.start_date} to {selectedLeave.end_date}</div>
                </div>

                {selectedLeave.attachment_path ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => window.open(buildAttachmentUrl(selectedLeave.attachment_path), '_blank', 'noopener,noreferrer')}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      Preview PDF
                    </button>
                    <a
                      href={buildAttachmentUrl(selectedLeave.attachment_path)}
                      download
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No attachment found for this request.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">Select a statutory leave request to inspect the uploaded medical document.</div>
            )}
          </aside>
        </div>
      )}
    </DashboardLayout>
  )
}
