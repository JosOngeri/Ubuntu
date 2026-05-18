import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'

const STORAGE_KEY = 'ubuntu-contractor-milestones'

const readMilestones = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const saveMilestones = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function ContractorPortal() {
  const [stats, setStats] = useState({ activeProjects: 0, pendingInvoices: 0, deliveryRate: 0 })
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ description: '', proof: null })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [statsResponse, projectsResponse, invoicesResponse] = await Promise.all([
          contractorAPI.getStats(),
          contractorAPI.getProjects(),
          contractorAPI.getInvoices(),
        ])
        setStats(statsResponse.data || { activeProjects: 0, pendingInvoices: 0, deliveryRate: 0 })
        setProjects(projectsResponse.data || [])
        setInvoices(invoicesResponse.data || [])
        setMilestones(readMilestones())
      } catch (loadError) {
        console.error('Failed to load contractor portal data', loadError)
        toast.error('Failed to load contractor portal data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const activeContracts = useMemo(() => projects.filter((project) => String(project.status).toLowerCase() !== 'completed'), [projects])

  const handleChange = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }))
  }

  const submitMilestone = (event) => {
    event.preventDefault()
    if (!form.description || !form.proof) {
      toast.error('Add a milestone description and supporting proof/invoice')
      return
    }

    const entry = {
      id: `milestone-${Date.now()}`,
      description: form.description,
      proofName: form.proof.name,
      projectName: activeContracts[0]?.name || 'General Contract',
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    }

    const nextMilestones = [entry, ...readMilestones()]
    saveMilestones(nextMilestones)
    setMilestones(nextMilestones)
    setForm({ description: '', proof: null })
    toast.success('Milestone submitted')
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Contractor Portal</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Track active contracts, deadlines, and submit milestone proof from a single dashboard.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Active Contracts', stats.activeProjects],
              ['Pending Invoices', stats.pendingInvoices],
              ['Delivery Rate', `${stats.deliveryRate}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
                <div className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Active Contracts & Deadlines</h2>
              <div className="mt-4 space-y-3">
                {activeContracts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No active contracts found.
                  </div>
                ) : (
                  activeContracts.map((project) => (
                    <div key={project.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-950 dark:text-white">{project.name}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Deadline: {project.due || project.due_date || 'TBD'}</div>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Submit Milestone</h2>
              <form onSubmit={submitMilestone} className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Describe the milestone you completed"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Proof / invoice</span>
                  <input
                    type="file"
                    name="proof"
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  Submit Milestone
                </button>
              </form>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Submitted Milestones</h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">Stored locally for the review workflow</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {milestones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No milestone submissions yet.
                </div>
              ) : (
                milestones.map((milestone) => (
                  <article key={milestone.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">{milestone.projectName}</div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        {milestone.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{milestone.description}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Proof: {milestone.proofName}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm dark:bg-white dark:text-slate-950">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <p className="mt-2 text-sm text-slate-300 dark:text-slate-700">
              {invoices.length} invoice record(s) loaded for reference.
            </p>
          </section>
        </>
      )}
    </DashboardLayout>
  )
}
